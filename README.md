# lakhtech — Supabase + Vercel starter (हिंदी)

## इसमें क्या है
- `index.html`: मोबाइल-अनुकूल वेबसाइट, Supabase ईमेल/पासवर्ड लॉगिन/रजिस्ट्रेशन, सार्वजनिक कैंपेन गैलरी, डैशबोर्ड, फोटो/फ्रेम प्रीव्यू और PNG डाउनलोड।
- `supabase-config.js`: आपके Supabase Project URL और सार्वजनिक anon/publishable key के लिए कॉन्फ़िगरेशन।
- `schema.sql`: PostgreSQL टेबल, RLS सुरक्षा नीतियाँ और `campaign-frames` Storage bucket/policies।
- `vercel.json`: Vercel के लिए स्थिर वेबसाइट कॉन्फ़िगरेशन।

## 1. Supabase कॉन्फ़िगर करें
1. Supabase Dashboard में अपना प्रोजेक्ट खोलें।
2. Project Settings → API में Project URL और `anon`/publishable key कॉपी करें।
3. `supabase-config.js` में `YOUR_PROJECT_REF` और `YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY` बदलें।
4. Supabase Dashboard → SQL Editor खोलें, `schema.sql` की पूरी सामग्री चलाएँ।
5. Authentication → URL Configuration में बाद में अपनी Vercel वेबसाइट का URL `Site URL` और Redirect URLs में जोड़ें।
6. Authentication → Providers में Email provider चालू रखें। परीक्षण के दौरान ईमेल पुष्टि चालू हो तो signup के बाद ईमेल से पुष्टि करनी होगी।

## 2. Vercel पर अपलोड करें
1. इन फाइलों को GitHub repository में रखें: `index.html`, `supabase-config.js`, `schema.sql`, `vercel.json` और यह README।
2. Vercel में Add New → Project → GitHub repository import करें।
3. Framework Preset: Other चुनें। Build Command और Output Directory खाली/डिफ़ॉल्ट रखें।
4. Deploy दबाएँ। कोई build step आवश्यक नहीं है।
5. Vercel से मिला `https://...vercel.app` URL Supabase Authentication की Site URL और Redirect URLs में जोड़ें।
6. नई deployment के बाद signup, email confirmation, login, campaign creation, image upload और दूसरे अकाउंट से सार्वजनिक गैलरी जाँचें।

## 3. सुरक्षा और सीमाएँ
- `supabase-config.js` में केवल सार्वजनिक anon/publishable key रखें। `service_role` या secret key कभी भी ब्राउज़र या GitHub में न रखें।
- अभी कैंपेन बनाते समय प्रकाशित (`is_published=true`) होता है, इसलिए उसका नाम और फ्रेम सार्वजनिक गैलरी में दिख सकता है।
- फ्रेम अपलोड की सीमा 8 MB है। व्यक्तिगत फोटो ब्राउज़र में ही रहती है; यह वेबसाइट उसे सर्वर पर अपलोड नहीं करती।
- यह starter है। सार्वजनिक लॉन्च से पहले spam/rate limits, moderation, privacy policy, terms, password reset UX, logging और वास्तविक उपयोगकर्ता परीक्षण जोड़ें।
- Demo-only localStorage password login को Supabase Auth से बदल दिया गया है। `supabase-config.js` सेटअप न होने पर वेबसाइट चेतावनी दिखाएगी और वास्तविक auth/database क्रियाएँ नहीं चलेंगी।

## यदि कोई त्रुटि आए
- `Invalid API key`: Project URL या public anon/publishable key जाँचें।
- `relation campaigns does not exist`: `schema.sql` सफलतापूर्वक चलाएँ।
- `row-level security policy`: सही SQL policies और लॉगिन session जाँचें।
- ईमेल नहीं आता: Supabase Authentication email provider और SMTP/email settings देखें।
