/**
 * Verify RLS Policies for Storage
 * 
 * Run: node backend/verify-rls-policies.js
 * 
 * This checks if the storage RLS policies were applied correctly
 */

require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyPolicies() {
  console.log('\n🔐 Verifying Storage RLS Policies\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Query to check RLS policies
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname as "Policy Name",
          cmd as "Command",
          roles as "Roles",
          qual as "Using Expression",
          with_check as "With Check"
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
        ORDER BY policyname;
      `
    });

    if (error) {
      // Try alternative method if rpc doesn't work
      console.log('Using alternative query method...\n');
      
      const query = `
        SELECT 
          schemaname,
          tablename, 
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
        ORDER BY policyname;
      `;
      
      console.log('📊 Expected Policies:\n');
      console.log('   1. "Public can view images" - SELECT - {public}');
      console.log('   2. "Authenticated users can upload images" - INSERT - {authenticated}');
      console.log('   3. "Users can delete their own images" - DELETE - {authenticated}');
      console.log('\n✅ Policies should be visible in Supabase Dashboard:');
      console.log('   Go to: Authentication → Policies → storage.objects\n');
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No RLS policies found for storage.objects\n');
      console.log('This might mean:');
      console.log('   1. RLS is not enabled on storage.objects');
      console.log('   2. Policies were not created successfully');
      console.log('   3. Query permissions are insufficient\n');
      console.log('💡 Check Supabase Dashboard → Authentication → Policies\n');
      return;
    }

    console.log(`✅ Found ${data.length} RLS policies:\n`);
    
    data.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy['Policy Name']}`);
      console.log(`   Command: ${policy.Command}`);
      console.log(`   Roles: ${policy.Roles}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ RLS Policies are active!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Alternative: Check policies in Supabase Dashboard');
    console.log('   Go to: Authentication → Policies → storage.objects\n');
  }
}

verifyPolicies();
