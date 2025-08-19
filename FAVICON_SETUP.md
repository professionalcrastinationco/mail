## Favicon Setup Instructions

Your favicon PNG files are configured and ready in the `/public` folder. 

### Current Setup:
- ✅ Favicon metadata is configured in `app/layout.tsx`
- ✅ PNG favicons are in `/public` folder (16px, 32px, 64px, 128px, 256px)
- ✅ These will work in most modern browsers

### To Get Full Browser Support:

Some older browsers (and some services like bookmarks) still prefer `.ico` format. Here's how to create one:

#### Option 1: Online Converter (Easiest)
1. Go to https://www.icoconverter.com/
2. Upload your `public/favicon-256.png` file
3. Download the generated `favicon.ico`
4. Place it in the `app/` directory (replace the placeholder file)

#### Option 2: Command Line (if you have ImageMagick)
```bash
# From your nextjs-supabase-app directory
magick convert public/favicon-256.png -define icon:auto-resize=64,48,32,16 app/favicon.ico
```

#### Option 3: Using your logo directly
If you want to use your full logo as the favicon:
1. Take `public/mail-review-logo-v1.png`
2. Crop it to a square aspect ratio (just the icon part)
3. Convert it using one of the methods above

### Testing Your Favicon:
1. Clear your browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Check the browser tab - you should see your icon

### Troubleshooting:
- If favicon doesn't update: Clear browser cache completely
- Try incognito/private browsing mode
- Some browsers cache favicons aggressively - may take time to update
- Next.js dev server sometimes needs restart: `npm run dev`

### Current Browser Support:
✅ Chrome, Edge, Firefox, Safari (modern versions) - PNG favicons work
⚠️ Older browsers, some bookmark services - may need .ico file
