// Test script to verify USDA FoodData Central and Open Food Facts APIs
const USDA_API_KEY = "AWR6lEqYoptdacVOaMr63y1iEM7w7WhngsIKf7gi";
const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// Test barcodes
const TEST_BARCODES = {
  cocaCola: "049000050103", // Coca-Cola (should be in both databases)
  banana: "4011",          // Banana (common produce code)
  cliffBar: "722252100207" // Clif Bar (likely in both)
};

console.log("═══════════════════════════════════════════════════════");
console.log("🧪 TESTING NUTRITION APIs");
console.log("═══════════════════════════════════════════════════════\n");

// Test 1: Open Food Facts API
async function testOpenFoodFacts(barcode) {
  console.log(`\n📦 Testing Open Food Facts API`);
  console.log(`   Barcode: ${barcode}`);
  console.log("   ─────────────────────────────────────────────────");
  
  try {
    const fields = "code,product_name,brands,nutriments,serving_size,image_front_url";
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`;
    
    console.log(`   Request: ${url}`);
    
    const response = await fetch(url, {
      headers: { 
        "User-Agent": "TeamCal/1.0 (testing)"
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        
        console.log(`   ✅ SUCCESS - Product Found!`);
        console.log(`   Product: ${p.product_name || 'N/A'}`);
        console.log(`   Brand: ${p.brands || 'N/A'}`);
        console.log(`   Serving: ${p.serving_size || 'N/A'}`);
        console.log(`   Nutrition (per 100g):`);
        console.log(`      Calories: ${n['energy-kcal_100g'] || 0} kcal`);
        console.log(`      Protein: ${n.proteins_100g || 0}g`);
        console.log(`      Carbs: ${n.carbohydrates_100g || 0}g`);
        console.log(`      Fat: ${n.fat_100g || 0}g`);
        console.log(`   Image: ${p.image_front_url ? '✅ Available' : '❌ Not available'}`);
        
        return { success: true, hasNutrition: Boolean(n['energy-kcal_100g']) };
      } else {
        console.log(`   ❌ Product not found in database`);
        return { success: false, hasNutrition: false };
      }
    } else {
      console.log(`   ❌ Request failed`);
      return { success: false, hasNutrition: false };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, hasNutrition: false };
  }
}

// Test 2: USDA FoodData Central API
async function testUSDAFoodData(barcode) {
  console.log(`\n🏛️  Testing USDA FoodData Central API`);
  console.log(`   Barcode: ${barcode}`);
  console.log("   ─────────────────────────────────────────────────");
  
  if (!USDA_API_KEY) {
    console.log(`   ⚠️  API Key not configured`);
    return { success: false, configured: false };
  }
  
  console.log(`   API Key: ${USDA_API_KEY.substring(0, 8)}...${USDA_API_KEY.substring(USDA_API_KEY.length - 4)}`);
  
  try {
    const url = `${USDA_BASE_URL}/foods/search?api_key=${encodeURIComponent(USDA_API_KEY)}`;
    
    console.log(`   Request: ${USDA_BASE_URL}/foods/search`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "TeamCal/1.0"
      },
      body: JSON.stringify({ 
        query: barcode, 
        dataType: ["Branded"], 
        pageSize: 10 
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 429) {
      console.log(`   ⚠️  Rate limit reached (1000/hour limit)`);
      return { success: false, rateLimit: true };
    }
    
    if (response.ok) {
      const data = await response.json();
      const normalized = barcode.replace(/^0+/, "");
      const food = (data.foods || []).find(item => 
        String(item.gtinUpc || "").replace(/^0+/, "") === normalized
      );
      
      if (food) {
        console.log(`   ✅ SUCCESS - Product Found!`);
        console.log(`   Product: ${food.description || 'N/A'}`);
        console.log(`   Brand: ${food.brandName || food.brandOwner || 'N/A'}`);
        console.log(`   FDC ID: ${food.fdcId}`);
        console.log(`   Serving: ${food.servingSize || 100}${food.servingSizeUnit || 'g'}`);
        console.log(`   Data Type: ${food.dataType}`);
        console.log(`   Nutrients: ${food.foodNutrients?.length || 0} nutrients available`);
        
        return { success: true, configured: true };
      } else {
        console.log(`   ❌ Product not found in database`);
        console.log(`   Total results: ${data.foods?.length || 0}`);
        return { success: false, configured: true };
      }
    } else {
      console.log(`   ❌ Request failed`);
      return { success: false, configured: true };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, configured: true };
  }
}

// Test backend endpoint
async function testBackendEndpoint(barcode) {
  console.log(`\n🔌 Testing Backend Endpoint`);
  console.log(`   POST http://localhost:3001/api/coach/lookup-barcode`);
  console.log("   ─────────────────────────────────────────────────");
  
  try {
    const response = await fetch('http://localhost:3001/api/coach/lookup-barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: barcode }),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        const item = data.result.items[0];
        console.log(`   ✅ SUCCESS`);
        console.log(`   Product: ${item.name}`);
        console.log(`   Brand: ${item.brand || 'N/A'}`);
        console.log(`   Source: ${data.result.source}`);
        console.log(`   Nutrition:`);
        console.log(`      Calories: ${data.result.totals.kcal} kcal`);
        console.log(`      Protein: ${data.result.totals.p}g`);
        console.log(`      Carbs: ${data.result.totals.c}g`);
        console.log(`      Fat: ${data.result.totals.f}g`);
        console.log(`   Confidence: ${item.confidence}`);
        
        return { success: true };
      } else {
        console.log(`   ❌ ${data.message}`);
        return { success: false };
      }
    } else {
      const data = await response.json().catch(() => null);
      console.log(`   ❌ ${data?.message || 'Request failed'}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ⚠️  Backend not running or unreachable`);
    console.log(`   Error: ${error.message}`);
    return { success: false, offline: true };
  }
}

// Run all tests
async function runTests() {
  const testBarcode = TEST_BARCODES.cliffBar;
  
  console.log(`🎯 Testing with barcode: ${testBarcode}`);
  console.log(`   (Clif Bar - testing USDA database)\n`);
  
  // Test Open Food Facts
  const offResult = await testOpenFoodFacts(testBarcode);
  
  // Test USDA
  const usdaResult = await testUSDAFoodData(testBarcode);
  
  // Test Backend
  const backendResult = await testBackendEndpoint(testBarcode);
  
  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("📊 TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Open Food Facts API:     ${offResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   - Nutrition data:     ${offResult.hasNutrition ? '✅ Available' : '⚠️  Limited'}`);
  console.log(`USDA FoodData Central:   ${usdaResult.configured ? (usdaResult.success ? '✅ WORKING' : '⚠️  No match') : '❌ NOT CONFIGURED'}`);
  console.log(`Backend Integration:     ${backendResult.success ? '✅ WORKING' : (backendResult.offline ? '⚠️  OFFLINE' : '❌ FAILED')}`);
  console.log("═══════════════════════════════════════════════════════\n");
  
  if (offResult.success || usdaResult.success) {
    console.log("✅ At least one API is working correctly!");
  }
  
  if (!backendResult.offline && backendResult.success) {
    console.log("✅ Backend endpoint is properly routing requests!");
  } else if (backendResult.offline) {
    console.log("⚠️  Start your backend server to test the full integration:");
    console.log("   cd backend && npm run dev");
  }
}

runTests().catch(console.error);
