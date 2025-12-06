# 📋 Simple Integration Guide (Non-Developer Friendly)

## 🎯 What You Have

### The Main Service File
**File: `server.js`** 
- **What it does**: This is the "brain" of your Pinterest pin generator
- **Location**: `c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\server.js`
- **What it needs**: Node.js to run (like a program that makes it work)

### The Web Interface Files  
**File: `public/index.html`**
- **What it does**: A simple web page where you can test making pins
- **Location**: `c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\public\index.html`
- **What it needs**: Just a web browser to open

### The Integration Files (For Your Other App)
**File: `usePinterestPinGenerator.js`**
- **What it does**: A "connector" that helps your other app talk to this service
- **Location**: `c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte\usePinterestPinGenerator.js`
- **What it needs**: Your other app needs to be a React app

## 🚀 Step-by-Step Integration (Simple)

### Step 1: Start the Pinterest Pin Service
1. Open **Command Prompt** (Windows key + R, type `cmd`, press Enter)
2. Navigate to your folder:
   ```
   cd "c:\Users\21264\Desktop\Pinterst picts\pintereset tempalte"
   ```
3. Start the service:
   ```
   node server.js
   ```
4. You should see: "Pinterest Pin Generator Service running on port 3001"
5. **Keep this window open** - this is your service running

### Step 2: Test That It Works
1. Open your web browser
2. Go to: `http://localhost:3001`
3. You should see a web page with image upload fields
4. Try creating a pin to make sure it works

### Step 3: Connect It to Your Other App
**This part depends on what kind of app you have:**

#### If your other app is a **React app**:
1. Copy the file `usePinterestPinGenerator.js` to your other app's folder
2. Find the person who built your other app (or whoever maintains it)
3. Give them this file and tell them to use it to connect to: `http://localhost:3001/api/create-pin`

#### If your other app is a **different type** (not React):
1. Your other app needs to send requests to: `http://localhost:3001/api/create-pin`
2. The request needs to include:
   - Top image URL
   - Bottom image URL  
   - Recipe title
   - Text styling options

### Step 4: Make It Permanent
Right now, the service only works when you run the command. To make it always available:

1. **Option A**: Always keep the command prompt open with `node server.js` running
2. **Option B**: Ask someone technical to set it up as a "service" that starts automatically
3. **Option C**: Put it on a web server so multiple people can use it

## 📞 What to Tell Your Developer/Tech Person

If you have someone technical helping you, tell them:

### The Service
- "I have a Pinterest Pin Generator microservice"
- "It runs on `http://localhost:3001/api/create-pin`"
- "It takes 2 image URLs and combines them into a Pinterest pin"
- "The main file is `server.js`"

### The Integration
- "I need to connect this to our existing app"
- "There's a React hook called `usePinterestPinGenerator.js` ready to use"
- "It's backward compatible with single-image workflows"
- "All the documentation is in the folder"

### The API
- "The service accepts POST requests to `/api/create-pin`"
- "It needs `topImageUrl`, `bottomImageUrl`, and `recipeTitle`"
- "It returns a PNG image"
- "There are options for font size (up to 120px), stroke colors, and text styling"

## 🆘 Common Problems and Solutions

### "node is not recognized"
**Problem**: You don't have Node.js installed
**Solution**: Download and install Node.js from https://nodejs.org

### "Cannot find module"
**Problem**: Missing dependencies
**Solution**: Run `npm install` in the folder first

### "Port 3001 is already in use"
**Problem**: Something else is using that port
**Solution**: Either stop the other program or change the port in `server.js`

### "CORS error" in browser
**Problem**: Your other app can't connect due to security settings
**Solution**: The service already has CORS enabled, but your app might need adjustments

## 📋 Quick Reference

### Service Status
- **Running**: Command prompt shows "running on port 3001"
- **Stopped**: Command prompt is closed or shows errors
- **Test URL**: http://localhost:3001

### API Endpoint
- **URL**: `http://localhost:3001/api/create-pin`
- **Method**: POST
- **Input**: JSON with image URLs and text
- **Output**: PNG image file

### File Locations
- **Main service**: `server.js`
- **Web interface**: `public/index.html`
- **React integration**: `usePinterestPinGenerator.js`
- **Documentation**: `README.md`

## 🎯 Next Steps

1. **Get it running** (Steps 1-2 above)
2. **Test it works** (Step 2 above)
3. **Identify your other app type** (React, PHP, etc.)
4. **Connect them** (Step 3 above)
5. **Make it permanent** (Step 4 above)

## 💡 Need Help?

If you get stuck:
1. Make sure Node.js is installed
2. Make sure you're in the right folder
3. Check that port 3001 isn't being used by something else
4. Ask someone technical to help with the integration part

The service is ready to use - you just need to connect it to your other app!
