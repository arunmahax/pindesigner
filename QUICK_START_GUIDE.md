# Quick Start Guide - Pinterest Pin Generator

## What You Have Now
✅ A powerful Pinterest pin generator that can:
- Combine TWO images into one beautiful Pinterest pin
- Add custom text with beautiful styling
- Work with your existing single-image workflow
- Process images automatically

## Step 1: Start Your Pinterest Pin Service

1. **Open PowerShell/Terminal**
   - Press `Windows + R`, type `powershell`, press Enter

2. **Navigate to your service folder**
   ```powershell
   cd "c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte"
   ```

3. **Start the service**
   ```powershell
   npm start
   ```

4. **Look for this message:**
   ```
   Server running on port 3000
   Pinterest Pin Generator ready!
   ```

5. **Test it works** - Open your browser and go to:
   ```
   http://localhost:3000
   ```
   You should see a web interface for testing.

## Step 2: Keep the Service Running

**IMPORTANT:** Keep this PowerShell window open while you use your other app. The service needs to stay running.

## Step 3: Connect Your Other App

### If Your Other App is React:
1. Copy the file `usePinterestPinGenerator.js` to your React app
2. Follow the instructions in `SIMPLE_INTEGRATION_GUIDE.md`

### If Your Other App is Something Else:
Your app just needs to make HTTP requests to:
```
http://localhost:3000/api/create-pin
```

## Step 4: Test Everything Works

1. **Single Image Test** (your existing workflow):
   - Send one image URL to the service
   - It will create a pin just like before

2. **Dual Image Test** (new feature):
   - Send two image URLs to the service
   - It will combine them into one Pinterest pin

## Example API Call

Your other app can call the service like this:

**For Single Image (existing workflow):**
```javascript
fetch('http://localhost:3000/api/create-pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image1: 'https://your-image-url.jpg',
    text: 'Your title text',
    fontSize: 48,
    fontColor: '#FFFFFF'
  })
})
```

**For Dual Images (new feature):**
```javascript
fetch('http://localhost:3000/api/create-pin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image1: 'https://your-first-image.jpg',
    image2: 'https://your-second-image.jpg',
    text: 'Your title text',
    fontSize: 48,
    fontColor: '#FFFFFF'
  })
})
```

## What Happens Next?

1. **Backward Compatibility:** Your existing single-image workflow continues to work exactly as before
2. **New Dual-Image Feature:** You can now create pins with two images when you want to
3. **Smart Processing:** The service automatically detects if you send 1 or 2 images and handles both

## Need Help?

- Check `SIMPLE_INTEGRATION_GUIDE.md` for detailed React integration
- Check `ENHANCED_FEATURES.md` for all available features
- Test with the web interface at `http://localhost:3000`

## Quick Status Check

✅ Service running on port 3000  
✅ Web interface working  
✅ API responding to requests  
✅ Ready to integrate with your other app  

**Next Step:** Tell me what type of app you want to integrate with (React, HTML/JavaScript, mobile app, etc.) and I'll give you specific instructions!
