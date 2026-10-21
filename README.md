# Lakshtech Frame Studio — Custom Frame Upload

Simple mobile-friendly photo frame editor prototype for community events.

## Included
- Simple frame gallery and photo positioning/zoom controls
- Upload your own image design as a custom frame (transparent PNG recommended)
- Apply custom frame to the local photo editor and export a PNG
- Event creation/share-link demo UI
- Supabase starter schema and example configuration
- Vercel configuration

## Run
Open `index.html` in a browser, or deploy this folder to Vercel.

## Important limits
Custom frame upload currently runs in the browser and is not yet uploaded to cloud storage. The event link creation is still demo/local and will not make a custom frame available to every visitor/device until Supabase Storage + database persistence and public event page loading are connected. Do not put a Supabase service-role key in frontend code; use only the publishable/anon key and secure Row Level Security policies.

## Custom design tips
Use a 3:4 PNG (for example 600 × 800) with a transparent opening where the visitor's photo should show through. The frame is drawn on top of the photo.
