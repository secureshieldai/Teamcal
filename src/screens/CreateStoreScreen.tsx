import React, { useState } from 'react';
import {
  Alert, Image, Linking, Modal, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService } from '../services/api/earn.service';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateStore'>;

const STEPS = ['Basic Details', 'Store Profile', 'Description', 'Store URL', 'Settings', 'Payment', 'Add Products', 'Review'];

const STORE_CATEGORIES = [
  'General Store','Health & Wellness','Nutrition','Fitness',
  'Beauty & Personal Care','Fashion','Food & Beverages','Education',
  'Personal Development','Business','Finance','Technology',
  'Home & Lifestyle','Services','Creator Store','Entertainment','Games','Other',
];

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia',
  'Australia','Austria','Azerbaijan','Bangladesh','Belarus','Belgium',
  'Bolivia','Brazil','Cambodia','Cameroon','Canada','Chile','China',
  'Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt',
  'Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece',
  'Guatemala','Hungary','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','South Korea',
  'Kuwait','Lebanon','Malaysia','Mexico','Morocco','Mozambique',
  'Netherlands','New Zealand','Nigeria','Norway','Pakistan','Panama',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia',
  'Rwanda','Saudi Arabia','Senegal','Singapore','South Africa','Spain',
  'Sri Lanka','Sudan','Sweden','Switzerland','Tanzania','Thailand',
  'Tunisia','Turkey','UAE','Uganda','Ukraine','United Kingdom',
  'United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Zimbabwe','Other',
];

type TZEntry = { label: string; value: string };
const TIMEZONES: TZEntry[] = [
  { label:'(GMT-12:00) International Date Line West', value:'Etc/GMT+12' },
  { label:'(GMT-11:00) Midway Island, Samoa', value:'Pacific/Midway' },
  { label:'(GMT-10:00) Hawaii', value:'Pacific/Honolulu' },
  { label:'(GMT-09:00) Alaska', value:'America/Anchorage' },
  { label:'(GMT-08:00) Pacific Time — Los Angeles', value:'America/Los_Angeles' },
  { label:'(GMT-07:00) Mountain Time — Denver', value:'America/Denver' },
  { label:'(GMT-07:00) Arizona (no DST)', value:'America/Phoenix' },
  { label:'(GMT-06:00) Central Time — Chicago', value:'America/Chicago' },
  { label:'(GMT-05:00) Eastern Time — New York', value:'America/New_York' },
  { label:'(GMT-04:00) Atlantic Time — Halifax', value:'America/Halifax' },
  { label:'(GMT-03:30) Newfoundland', value:'America/St_Johns' },
  { label:'(GMT-03:00) Brasília', value:'America/Sao_Paulo' },
  { label:'(GMT-03:00) Buenos Aires', value:'America/Argentina/Buenos_Aires' },
  { label:'(GMT-02:00) Mid-Atlantic', value:'Etc/GMT+2' },
  { label:'(GMT-01:00) Azores', value:'Atlantic/Azores' },
  { label:'(GMT+00:00) UTC', value:'UTC' },
  { label:'(GMT+00:00) London, Dublin, Edinburgh', value:'Europe/London' },
  { label:'(GMT+00:00) Accra, Abidjan', value:'Africa/Accra' },
  { label:'(GMT+01:00) Amsterdam, Berlin, Paris, Rome', value:'Europe/Paris' },
  { label:'(GMT+01:00) Lagos, Kinshasa', value:'Africa/Lagos' },
  { label:'(GMT+01:00) Casablanca', value:'Africa/Casablanca' },
  { label:'(GMT+02:00) Cairo', value:'Africa/Cairo' },
  { label:'(GMT+02:00) Johannesburg, Harare', value:'Africa/Johannesburg' },
  { label:'(GMT+02:00) Helsinki, Kyiv, Riga', value:'Europe/Helsinki' },
  { label:'(GMT+02:00) Nairobi', value:'Africa/Nairobi' },
  { label:'(GMT+03:00) Moscow, St. Petersburg', value:'Europe/Moscow' },
  { label:'(GMT+03:00) Riyadh, Kuwait', value:'Asia/Riyadh' },
  { label:'(GMT+03:30) Tehran', value:'Asia/Tehran' },
  { label:'(GMT+04:00) Dubai, Muscat', value:'Asia/Dubai' },
  { label:'(GMT+04:00) Baku', value:'Asia/Baku' },
  { label:'(GMT+04:30) Kabul', value:'Asia/Kabul' },
  { label:'(GMT+05:00) Karachi, Islamabad', value:'Asia/Karachi' },
  { label:'(GMT+05:00) Tashkent', value:'Asia/Tashkent' },
  { label:'(GMT+05:30) Mumbai, Kolkata, New Delhi', value:'Asia/Kolkata' },
  { label:'(GMT+05:45) Kathmandu', value:'Asia/Kathmandu' },
  { label:'(GMT+06:00) Dhaka, Almaty', value:'Asia/Dhaka' },
  { label:'(GMT+06:30) Yangon (Rangoon)', value:'Asia/Yangon' },
  { label:'(GMT+07:00) Bangkok, Hanoi, Jakarta', value:'Asia/Bangkok' },
  { label:'(GMT+08:00) Beijing, Singapore, Hong Kong', value:'Asia/Singapore' },
  { label:'(GMT+08:00) Kuala Lumpur', value:'Asia/Kuala_Lumpur' },
  { label:'(GMT+08:00) Manila', value:'Asia/Manila' },
  { label:'(GMT+08:00) Perth', value:'Australia/Perth' },
  { label:'(GMT+09:00) Tokyo, Osaka', value:'Asia/Tokyo' },
  { label:'(GMT+09:00) Seoul', value:'Asia/Seoul' },
  { label:'(GMT+09:30) Adelaide', value:'Australia/Adelaide' },
  { label:'(GMT+09:30) Darwin', value:'Australia/Darwin' },
  { label:'(GMT+10:00) Sydney, Melbourne, Canberra', value:'Australia/Sydney' },
  { label:'(GMT+10:00) Brisbane', value:'Australia/Brisbane' },
  { label:'(GMT+11:00) Solomon Islands, New Caledonia', value:'Pacific/Noumea' },
  { label:'(GMT+12:00) Auckland, Wellington', value:'Pacific/Auckland' },
  { label:'(GMT+12:00) Fiji', value:'Pacific/Fiji' },
  { label:'(GMT+13:00) Samoa', value:'Pacific/Apia' },
];

type CurrencyEntry = { code: string; name: string; symbol: string };
const CURRENCIES: CurrencyEntry[] = [
  { code:'USD', name:'US Dollar', symbol:'$' },
  { code:'EUR', name:'Euro', symbol:'€' },
  { code:'GBP', name:'British Pound', symbol:'£' },
  { code:'CAD', name:'Canadian Dollar', symbol:'CA$' },
  { code:'AUD', name:'Australian Dollar', symbol:'A$' },
  { code:'JPY', name:'Japanese Yen', symbol:'¥' },
  { code:'CHF', name:'Swiss Franc', symbol:'Fr' },
  { code:'CNY', name:'Chinese Yuan', symbol:'¥' },
  { code:'INR', name:'Indian Rupee', symbol:'₹' },
  { code:'NGN', name:'Nigerian Naira', symbol:'₦' },
  { code:'GHS', name:'Ghanaian Cedi', symbol:'GH₵' },
  { code:'KES', name:'Kenyan Shilling', symbol:'KSh' },
  { code:'ZAR', name:'South African Rand', symbol:'R' },
  { code:'EGP', name:'Egyptian Pound', symbol:'E£' },
  { code:'AED', name:'UAE Dirham', symbol:'AED' },
  { code:'SAR', name:'Saudi Riyal', symbol:'SR' },
  { code:'PKR', name:'Pakistani Rupee', symbol:'₨' },
  { code:'BDT', name:'Bangladeshi Taka', symbol:'৳' },
  { code:'IDR', name:'Indonesian Rupiah', symbol:'Rp' },
  { code:'MYR', name:'Malaysian Ringgit', symbol:'RM' },
  { code:'SGD', name:'Singapore Dollar', symbol:'S$' },
  { code:'PHP', name:'Philippine Peso', symbol:'₱' },
  { code:'THB', name:'Thai Baht', symbol:'฿' },
  { code:'BRL', name:'Brazilian Real', symbol:'R$' },
  { code:'MXN', name:'Mexican Peso', symbol:'MX$' },
  { code:'KRW', name:'South Korean Won', symbol:'₩' },
  { code:'SEK', name:'Swedish Krona', symbol:'kr' },
  { code:'NOK', name:'Norwegian Krone', symbol:'kr' },
  { code:'DKK', name:'Danish Krone', symbol:'kr' },
  { code:'PLN', name:'Polish Złoty', symbol:'zł' },
  { code:'TRY', name:'Turkish Lira', symbol:'₺' },
  { code:'RUB', name:'Russian Ruble', symbol:'₽' },
  { code:'UAH', name:'Ukrainian Hryvnia', symbol:'₴' },
];

const LANGUAGES = [
  'Arabic','Azerbaijani','Bengali','Bulgarian','Burmese',
  'Chinese (Simplified)','Chinese (Traditional)','Croatian','Czech',
  'Danish','Dutch','English','Estonian','Finnish','French','German',
  'Greek','Gujarati','Hausa','Hebrew','Hindi','Hungarian',
  'Indonesian','Italian','Japanese','Kannada','Khmer','Korean',
  'Latvian','Lithuanian','Malay','Marathi','Norwegian','Persian',
  'Polish','Portuguese (Brazil)','Portuguese (Portugal)','Punjabi',
  'Romanian','Russian','Serbian','Sinhala','Slovak','Slovenian',
  'Spanish','Swahili','Swedish','Tagalog','Tamil','Telugu',
  'Thai','Turkish','Ukrainian','Urdu','Uzbek','Vietnamese','Yoruba','Zulu',
];

function getDeviceTimezoneLabel(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.find(t => t.value === tz)?.label ?? TIMEZONES[15].label; // fallback UTC
  } catch {
    return TIMEZONES[15].label;
  }
}

export default function CreateStoreScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [logoUri, setLogoUri] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState(getDeviceTimezoneLabel());
  const [currency, setCurrency] = useState('USD');
  const [supportEmail, setSupportEmail] = useState('');
  const [language, setLanguage] = useState('English');
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [openSelector, setOpenSelector] = useState<'category'|'country'|'timezone'|'currency'|'language'|null>(null);

  const suggestSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const pickLogo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:0.85, aspect:[1,1], allowsEditing:true });
    if (!r.canceled) setLogoUri(r.assets[0].uri);
  };

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:0.85 });
    if (!r.canceled) setCoverUri(r.assets[0].uri);
  };

  const next = () => {
    if (step === 0 && !storeName.trim()) return Alert.alert('Store name required');
    if (step === 2 && !tagline.trim()) return Alert.alert('Tagline required');
    if (step === 3) {
      if (!urlSlug.trim()) return Alert.alert('Store URL required');
      if (!/^[a-z0-9-]+$/.test(urlSlug)) return Alert.alert('Invalid URL','Only lowercase letters, numbers and hyphens allowed.');
    }
    setStep(s => s + 1);
  };

  const publish = async (status: 'published'|'draft') => {
    if (status === 'published' && !termsAccepted) { Alert.alert('Agreement required','Please accept the Terms of Service and Privacy Policy.'); return; }
    setBusy(true);
    try {
      const asset = await earnService.createAsset({
        kind:'store', subtype:category||'general', title:storeName.trim(),
        description, image:logoUri||undefined, status,
        metadata:{
          tagline, shortDescription:tagline, coverImage:coverUri||undefined,
          urlSlug:urlSlug||suggestSlug(storeName), category, country, timezone,
          currency, supportEmail, language, storeEnabled, stripeConnected, products:[],
        },
      });
      navigation.replace('StoreDashboard', { storeId: asset.id });
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const currencyEntry = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const currencyDisplay = `${currencyEntry.code} — ${currencyEntry.name} — ${currencyEntry.symbol}`;

  return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : setStep(st => st-1)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{STEPS[step]}</Text>
        <View style={{width:22}}/>
      </View>

      <View style={s.stepBar}>
        {STEPS.map((_,i)=><View key={i} style={[s.stepDot, i===step&&s.stepDotActive, i<step&&s.stepDotDone]}/>)}
      </View>

      {/* ── Step 0: Basic Details ── */}
      {step===0&&<ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
        <View style={s.illustrationRow}>
          <View style={s.storeIllustration}><Ionicons name="storefront-outline" size={48} color={colors.primary}/></View>
          <View style={{flex:1}}>
            <Text style={s.stepTitle}>Let's start with your store basics</Text>
            <Text style={s.stepSub}>You can always change these details later.</Text>
          </View>
        </View>
        <Label text="Store Name" required/>
        <Input value={storeName} onChangeText={v=>{setStoreName(v);if(!urlSlug)setUrlSlug(suggestSlug(v));}} placeholder="Enter store name"/>
        <Label text="Store Category (Optional)"/>
        <TouchableOpacity style={s.dropdown} onPress={()=>setOpenSelector('category')}>
          <Text style={[s.dropdownText,!category&&{color:colors.textMuted}]}>{category||'Select store type'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary}/>
        </TouchableOpacity>
        <Text style={s.hint}>You can sell physical, digital products, services, subscriptions and more.</Text>
      </ScrollView>}

      {/* ── Step 1: Store Profile ── */}
      {step===1&&<ScrollView contentContainerStyle={s.stepContent}>
        <Label text="Store Logo / Display Picture" required/>
        <TouchableOpacity style={s.logoPicker} onPress={pickLogo}>
          {logoUri
            ? <Image source={{uri:logoUri}} style={s.logoImage}/>
            : <><Ionicons name="cloud-upload-outline" size={28} color={colors.primary}/><Text style={s.uploadLabel}>Upload Image</Text><Text style={s.uploadSub}>JPG, PNG or WEBP (Max 5MB)</Text></>}
        </TouchableOpacity>
        {logoUri?<TouchableOpacity onPress={pickLogo}><Text style={s.changeLink}>Change Logo</Text></TouchableOpacity>:null}
        <Label text="Store Cover Image (Optional)"/>
        <TouchableOpacity style={s.coverPicker} onPress={pickCover}>
          {coverUri?<Image source={{uri:coverUri}} style={s.coverImage}/>:<Ionicons name="image-outline" size={28} color={colors.textMuted}/>}
        </TouchableOpacity>
        <TouchableOpacity onPress={pickCover}><Text style={s.changeLink}>{coverUri?'Change Cover':'Upload Cover'}</Text></TouchableOpacity>
      </ScrollView>}

      {/* ── Step 2: Description ── */}
      {step===2&&<ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
        <Label text="Tagline" required/>
        <Input value={tagline} onChangeText={setTagline} placeholder="A short tagline for your store." maxLength={80} multiline/>
        <CharCount value={tagline} max={80}/>
        <Label text="Description"/>
        <Input value={description} onChangeText={setDescription} placeholder="Tell customers what makes it unique and why they should shop with you." maxLength={500} multiline style={{minHeight:120}}/>
        <CharCount value={description} max={500}/>
      </ScrollView>}

      {/* ── Step 3: Store URL ── */}
      {step===3&&<ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
        <Label text="Choose Your Store URL" required/>
        <Text style={s.stepSub}>This will be your unique store link on TeamCal.</Text>
        <View style={s.urlRow}>
          <Text style={s.urlPrefix}>teamcal.store/ </Text>
          <TextInput style={[s.input,{flex:1}]} value={urlSlug} onChangeText={v=>setUrlSlug(v.toLowerCase().replace(/[^a-z0-9-]/g,''))} placeholder="yourstorename" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false}/>
        </View>
        <View style={s.urlRules}>
          <RuleRow text="Only lowercase letters, numbers and hyphens allowed"/>
          <RuleRow text="3–40 characters"/>
          <RuleRow text="Must be unique"/>
        </View>
        <View style={s.urlPreviewBox}>
          <Text style={s.urlPreviewLabel}>Your Store Link Preview</Text>
          <Text style={s.urlPreviewValue}>https://teamcal.store/{urlSlug||'yourstorename'}</Text>
        </View>
      </ScrollView>}

      {/* ── Step 4: Settings ── */}
      {step===4&&<ScrollView contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
        <Label text="Business Location"/>
        <TouchableOpacity style={s.dropdown} onPress={()=>setOpenSelector('country')}>
          <Text style={s.dropdownText}>{country}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary}/>
        </TouchableOpacity>

        <Label text="Time Zone"/>
        <TouchableOpacity style={s.dropdown} onPress={()=>setOpenSelector('timezone')}>
          <Text style={s.dropdownText} numberOfLines={1}>{timezone}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary}/>
        </TouchableOpacity>

        <Label text="Store Currency"/>
        <TouchableOpacity style={s.dropdown} onPress={()=>setOpenSelector('currency')}>
          <Text style={s.dropdownText}>{currencyDisplay}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary}/>
        </TouchableOpacity>

        <Label text="Customer Support Email"/>
        <Input value={supportEmail} onChangeText={setSupportEmail} placeholder="support@yourstore.com" keyboardType="email-address"/>

        <Label text="Store Language"/>
        <TouchableOpacity style={s.dropdown} onPress={()=>setOpenSelector('language')}>
          <Text style={s.dropdownText}>{language}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary}/>
        </TouchableOpacity>

        <View style={s.toggleRow}>
          <View style={{flex:1}}>
            <Text style={s.toggleLabel}>Enable Store</Text>
            <Text style={s.toggleSub}>Your store will be visible to customers after publishing.</Text>
          </View>
          <Switch value={storeEnabled} onValueChange={setStoreEnabled} trackColor={{true:colors.primary,false:colors.border}} thumbColor="#fff"/>
        </View>
      </ScrollView>}

      {/* ── Step 5: Payment Setup ── */}
      {step===5&&<ScrollView contentContainerStyle={s.stepContent}>
        <View style={s.paymentCenter}>
          <View style={s.stripeCircle}><Text style={s.stripeS}>S</Text></View>
          <Text style={s.paymentTitle}>Connect Stripe</Text>
          <Text style={s.paymentSub}>Connect your Stripe account to accept payments.</Text>
        </View>
        <TouchableOpacity style={s.stripeBtn} onPress={async()=>{
          try{const r=await earnService.connectStripe();if(r.onboardingUrl)await Linking.openURL(r.onboardingUrl);setStripeConnected(true);}
          catch(e){Alert.alert('Stripe connection failed',(e as Error).message);}
        }}>
          <Ionicons name="card-outline" size={18} color="#fff"/>
          <Text style={s.stripeBtnText}>Connect Stripe</Text>
        </TouchableOpacity>
        {stripeConnected&&<View style={s.connectedBadge}><Ionicons name="checkmark-circle" size={18} color={colors.success}/><Text style={s.connectedText}>Stripe connected</Text></View>}
      </ScrollView>}

      {/* ── Step 6: Add Products ── */}
      {step===6&&<ScrollView contentContainerStyle={s.stepContent}>
        <View style={s.addProductsCenter}>
          <Ionicons name="cube-outline" size={56} color={colors.primary}/>
          <Text style={s.paymentTitle}>Add products to your store</Text>
          <Text style={s.paymentSub}>Start adding products now or skip this step and add them later.</Text>
        </View>
        <TouchableOpacity style={s.addProductsNowBtn} onPress={()=>setStep(7)}>
          <Text style={s.addProductsNowText}>Add Products Now</Text>
        </TouchableOpacity>
      </ScrollView>}

      {/* ── Step 7: Review & Publish ── */}
      {step===7&&<ScrollView contentContainerStyle={s.stepContent}>
        <View style={s.reviewHeader}>
          <Text style={s.stepTitle}>Review Your Store</Text>
          <TouchableOpacity onPress={()=>setStep(0)}><Text style={s.editLink}>Edit</Text></TouchableOpacity>
        </View>
        <View style={[s.summaryCard, shadow.soft]}>
          {[
            {label:'Store Name',value:storeName},
            {label:'Store URL',value:`teamcal.store/${urlSlug}`},
            {label:'Store Type',value:category||'General Store'},
            {label:'Currency',value:currency},
            {label:'Payment Provider',value:stripeConnected?'Stripe ✓':'Not connected'},
            {label:'Products',value:'0 Products'},
            {label:'Store Status',value:storeEnabled?'Enabled':'Disabled'},
          ].map(row=>(
            <View key={row.label} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={s.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.termsRow}>
          <TouchableOpacity onPress={()=>setTermsAccepted(v=>!v)} hitSlop={{top:6,bottom:6,left:6,right:6}}>
            <Ionicons name={termsAccepted?'checkmark-circle':'ellipse-outline'} size={22} color={termsAccepted?colors.primary:colors.textMuted}/>
          </TouchableOpacity>
          <Text style={s.termsText}>
            I agree to the{' '}
            <Text style={s.termsLink} onPress={()=>navigation.navigate('LegalDocument',{document:'terms'})}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink} onPress={()=>navigation.navigate('LegalDocument',{document:'privacy'})}>Privacy Policy</Text>
            .
          </Text>
        </View>

        <TouchableOpacity style={[s.publishBtn,!termsAccepted&&{opacity:0.45}]} onPress={()=>publish('published')} disabled={busy}>
          <Text style={s.publishBtnText}>{busy?'Publishing…':'Publish Store'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.draftBtn} onPress={()=>publish('draft')} disabled={busy}>
          <Text style={s.draftBtnText}>Save as Draft</Text>
        </TouchableOpacity>
      </ScrollView>}

      {step<7&&<View style={s.navRow}>
        {step===5&&<TouchableOpacity style={s.skipBtn} onPress={()=>setStep(s=>s+1)}><Text style={s.skipBtnText}>Skip for Later</Text></TouchableOpacity>}
        {step===6&&<TouchableOpacity style={s.skipBtn} onPress={()=>setStep(7)}><Text style={s.skipBtnText}>Skip for Later</Text></TouchableOpacity>}
        <TouchableOpacity style={s.continueBtn} onPress={next} disabled={busy}>
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>}

      {/* ── Searchable Selectors ── */}
      <SearchableModal
        visible={openSelector==='category'}
        title="Store Category"
        searchPlaceholder="Search categories…"
        items={STORE_CATEGORIES}
        selectedValue={category}
        onSelect={v=>{setCategory(v);setOpenSelector(null);}}
        onClose={()=>setOpenSelector(null)}
      />
      <SearchableModal
        visible={openSelector==='country'}
        title="Business Location"
        searchPlaceholder="Search countries…"
        items={COUNTRIES}
        selectedValue={country}
        onSelect={v=>{setCountry(v);setOpenSelector(null);}}
        onClose={()=>setOpenSelector(null)}
      />
      <SearchableModal
        visible={openSelector==='timezone'}
        title="Time Zone"
        searchPlaceholder="Search city or time zone…"
        items={TIMEZONES.map(t=>t.label)}
        selectedValue={timezone}
        onSelect={v=>{setTimezone(v);setOpenSelector(null);}}
        onClose={()=>setOpenSelector(null)}
        extraTopItem={{
          label:'Use Device Time Zone',
          onPress:()=>{setTimezone(getDeviceTimezoneLabel());setOpenSelector(null);},
        }}
      />
      <SearchableModal
        visible={openSelector==='currency'}
        title="Store Currency"
        searchPlaceholder="Search currency…"
        items={CURRENCIES.map(c=>c.code)}
        renderItem={code=>{const c=CURRENCIES.find(x=>x.code===code)!;return `${c.code} — ${c.name} — ${c.symbol}`;}}
        selectedValue={currency}
        onSelect={v=>{setCurrency(v);setOpenSelector(null);}}
        onClose={()=>setOpenSelector(null)}
      />
      <SearchableModal
        visible={openSelector==='language'}
        title="Store Language"
        searchPlaceholder="Search languages…"
        items={LANGUAGES}
        selectedValue={language}
        onSelect={v=>{setLanguage(v);setOpenSelector(null);}}
        onClose={()=>setOpenSelector(null)}
      />

    </SafeAreaView>
  );
}

// ─── SearchableModal ─────────────────────────────────────────────────────────

function SearchableModal({visible,title,searchPlaceholder,items,selectedValue,onSelect,onClose,renderItem,extraTopItem}:{
  visible:boolean;title:string;searchPlaceholder?:string;
  items:string[];selectedValue:string;
  onSelect:(v:string)=>void;onClose:()=>void;
  renderItem?:(item:string)=>string;
  extraTopItem?:{label:string;onPress:()=>void};
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? items.filter(i=>(renderItem?renderItem(i):i).toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'}}>
        <TouchableOpacity style={{flex:1}} activeOpacity={1} onPress={()=>{setQuery('');onClose();}}/>
        <View style={[s.modalSheet,{paddingBottom:Math.max(insets.bottom,16)+spacing.md}]}>
          <View style={s.modalHandle}/>
          {title?<Text style={s.modalTitle}>{title}</Text>:null}
          <View style={s.searchRow}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted}/>
            <TextInput
              style={s.searchInput} value={query} onChangeText={setQuery}
              placeholder={searchPlaceholder||'Search…'} placeholderTextColor={colors.textMuted}
            />
            {query?<TouchableOpacity onPress={()=>setQuery('')}><Ionicons name="close-circle" size={16} color={colors.textMuted}/></TouchableOpacity>:null}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {extraTopItem&&(
              <TouchableOpacity style={[s.optionRow,s.optionRowSpecial]} onPress={()=>{extraTopItem.onPress();setQuery('');}}>
                <Ionicons name="phone-portrait-outline" size={15} color={colors.primary}/>
                <Text style={[s.optionText,{color:colors.primary,fontWeight:'700',flex:1}]}>{extraTopItem.label}</Text>
              </TouchableOpacity>
            )}
            {filtered.map(item=>{
              const label = renderItem?renderItem(item):item;
              const isSelected = selectedValue===item;
              return (
                <TouchableOpacity key={item} style={[s.optionRow,isSelected&&s.optionRowActive]} onPress={()=>{onSelect(item);setQuery('');}}>
                  <Text style={[s.optionText,isSelected&&s.optionTextActive,{flex:1}]}>{label}</Text>
                  {isSelected&&<Ionicons name="checkmark" size={16} color={colors.primary}/>}
                </TouchableOpacity>
              );
            })}
            {filtered.length===0&&<Text style={s.noResults}>No results for "{query}"</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Label({text,required}:{text:string;required?:boolean}){
  return <Text style={s.label}>{text}{required&&<Text style={{color:colors.primary}}> *</Text>}</Text>;
}
function Input({value,onChangeText,placeholder,multiline,maxLength,keyboardType,style}:{
  value:string;onChangeText:(v:string)=>void;placeholder?:string;
  multiline?:boolean;maxLength?:number;keyboardType?:any;style?:any;
}){
  return <TextInput style={[s.input,multiline&&s.inputMulti,style]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textMuted} multiline={multiline} maxLength={maxLength} keyboardType={keyboardType??'default'}/>;
}
function CharCount({value,max}:{value:string;max:number}){
  return <Text style={s.charCount}>{value.length}/{max}</Text>;
}
function RuleRow({text}:{text:string}){
  return <View style={s.ruleRow}><Ionicons name="checkmark" size={14} color={colors.success}/><Text style={s.ruleText}>{text}</Text></View>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing.lg,paddingVertical:spacing.sm},
  headerTitle:{...typography.h2,color:colors.textPrimary},
  stepBar:{flexDirection:'row',justifyContent:'center',gap:6,paddingVertical:spacing.sm},
  stepDot:{width:8,height:8,borderRadius:4,backgroundColor:colors.border},
  stepDotActive:{backgroundColor:colors.primary,width:20},
  stepDotDone:{backgroundColor:colors.primary},
  stepContent:{padding:spacing.lg,paddingBottom:40},
  stepTitle:{fontSize:16,fontWeight:'800',color:colors.textPrimary,marginBottom:spacing.xs},
  stepSub:{fontSize:12,color:colors.textSecondary,lineHeight:17,marginBottom:spacing.md},
  label:{fontSize:11,fontWeight:'700',color:colors.textSecondary,marginBottom:spacing.xs,marginTop:spacing.md},
  hint:{fontSize:11,color:colors.textMuted,marginTop:spacing.xs,lineHeight:16},
  input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md,fontSize:13,color:colors.textPrimary},
  inputMulti:{minHeight:80,textAlignVertical:'top'},
  charCount:{fontSize:10,color:colors.textMuted,textAlign:'right',marginTop:2},
  dropdown:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,padding:spacing.md},
  dropdownText:{fontSize:13,color:colors.textPrimary,flex:1,marginRight:spacing.xs},
  illustrationRow:{flexDirection:'row',alignItems:'center',gap:spacing.md,marginBottom:spacing.lg},
  storeIllustration:{width:72,height:72,borderRadius:radii.xl,backgroundColor:'#FFF0E8',alignItems:'center',justifyContent:'center'},
  logoPicker:{height:130,backgroundColor:colors.card,borderWidth:1.5,borderStyle:'dashed',borderColor:colors.primary,borderRadius:radii.xl,alignItems:'center',justifyContent:'center',gap:spacing.xs},
  logoImage:{width:'100%',height:'100%',borderRadius:radii.xl},
  uploadLabel:{fontSize:13,fontWeight:'700',color:colors.primary},
  uploadSub:{fontSize:11,color:colors.textMuted},
  changeLink:{fontSize:12,fontWeight:'700',color:colors.primary,textAlign:'center',marginTop:spacing.xs,marginBottom:spacing.md},
  coverPicker:{height:140,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.xl,alignItems:'center',justifyContent:'center',overflow:'hidden'},
  coverImage:{width:'100%',height:'100%'},
  urlRow:{flexDirection:'row',alignItems:'center',backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radii.md,overflow:'hidden',marginBottom:spacing.sm},
  urlPrefix:{fontSize:13,color:colors.textSecondary,paddingHorizontal:spacing.sm,backgroundColor:'#F5F5F7'},
  urlRules:{gap:spacing.xs,marginBottom:spacing.md},
  ruleRow:{flexDirection:'row',alignItems:'center',gap:spacing.xs},
  ruleText:{fontSize:12,color:colors.textSecondary},
  urlPreviewBox:{backgroundColor:'#F0FFF4',borderRadius:radii.lg,padding:spacing.md,borderWidth:1,borderColor:colors.success+'40'},
  urlPreviewLabel:{fontSize:11,fontWeight:'700',color:colors.success,marginBottom:4},
  urlPreviewValue:{fontSize:12,color:colors.textPrimary,fontWeight:'600'},
  toggleRow:{flexDirection:'row',alignItems:'flex-start',paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
  toggleLabel:{fontSize:13,fontWeight:'700',color:colors.textPrimary},
  toggleSub:{fontSize:11,color:colors.textSecondary,marginTop:2},
  paymentCenter:{alignItems:'center',paddingVertical:spacing.xl,gap:spacing.md},
  stripeCircle:{width:80,height:80,borderRadius:40,backgroundColor:'#635BFF',alignItems:'center',justifyContent:'center'},
  stripeS:{fontSize:36,fontWeight:'900',color:'#fff'},
  paymentTitle:{fontSize:18,fontWeight:'800',color:colors.textPrimary,textAlign:'center'},
  paymentSub:{fontSize:13,color:colors.textSecondary,textAlign:'center',lineHeight:19},
  stripeBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm,backgroundColor:'#635BFF',borderRadius:radii.pill,paddingVertical:spacing.md+2,marginBottom:spacing.md},
  stripeBtnText:{color:'#fff',fontSize:15,fontWeight:'800'},
  connectedBadge:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:spacing.sm},
  connectedText:{fontSize:13,fontWeight:'700',color:colors.success},
  addProductsCenter:{alignItems:'center',paddingVertical:spacing.xl,gap:spacing.md},
  addProductsNowBtn:{backgroundColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md+2,alignItems:'center',marginBottom:spacing.sm},
  addProductsNowText:{color:'#fff',fontSize:15,fontWeight:'800'},
  reviewHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:spacing.md},
  editLink:{fontSize:13,fontWeight:'700',color:colors.primary},
  summaryCard:{backgroundColor:colors.card,borderRadius:radii.xl,padding:spacing.lg,marginBottom:spacing.md},
  summaryRow:{flexDirection:'row',paddingVertical:spacing.sm,borderBottomWidth:1,borderBottomColor:colors.border},
  summaryLabel:{width:120,fontSize:11,fontWeight:'700',color:colors.textSecondary},
  summaryValue:{flex:1,fontSize:12,color:colors.textPrimary,fontWeight:'600'},
  termsRow:{flexDirection:'row',alignItems:'flex-start',gap:spacing.sm,marginBottom:spacing.lg},
  termsText:{fontSize:12,color:colors.textSecondary,flex:1,lineHeight:18},
  termsLink:{color:colors.primary,fontWeight:'700',textDecorationLine:'underline'},
  publishBtn:{backgroundColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md+2,alignItems:'center',marginBottom:spacing.sm},
  publishBtnText:{color:'#fff',fontSize:15,fontWeight:'800'},
  draftBtn:{borderWidth:1,borderColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md+2,alignItems:'center'},
  draftBtnText:{color:colors.primary,fontSize:15,fontWeight:'700'},
  navRow:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border,backgroundColor:colors.card},
  continueBtn:{flex:1,backgroundColor:colors.primary,borderRadius:radii.pill,paddingVertical:spacing.md,alignItems:'center'},
  continueBtnText:{color:'#fff',fontSize:14,fontWeight:'800'},
  skipBtn:{flex:1,borderWidth:1,borderColor:colors.border,borderRadius:radii.pill,paddingVertical:spacing.md,alignItems:'center'},
  skipBtnText:{fontSize:14,fontWeight:'700',color:colors.textSecondary},
  modalSheet:{backgroundColor:colors.card,borderTopLeftRadius:radii.xl,borderTopRightRadius:radii.xl,padding:spacing.lg,maxHeight:'80%'},
  modalHandle:{width:40,height:4,borderRadius:2,backgroundColor:colors.border,alignSelf:'center',marginBottom:spacing.sm},
  modalTitle:{fontSize:15,fontWeight:'800',color:colors.textPrimary,marginBottom:spacing.md,textAlign:'center'},
  searchRow:{flexDirection:'row',alignItems:'center',gap:spacing.sm,backgroundColor:colors.background,borderRadius:radii.md,paddingHorizontal:spacing.md,paddingVertical:spacing.sm,marginBottom:spacing.sm,borderWidth:1,borderColor:colors.border},
  searchInput:{flex:1,fontSize:13,color:colors.textPrimary,padding:0},
  optionRow:{paddingVertical:13,borderBottomWidth:1,borderBottomColor:colors.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  optionRowActive:{backgroundColor:'#FFF0E8'},
  optionRowSpecial:{flexDirection:'row',gap:spacing.sm,backgroundColor:`${colors.primary}10`},
  optionText:{fontSize:13,color:colors.textPrimary},
  optionTextActive:{color:colors.primary,fontWeight:'700'},
  noResults:{fontSize:13,color:colors.textMuted,textAlign:'center',paddingVertical:spacing.xl},
});
