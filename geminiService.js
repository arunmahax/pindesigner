const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convert image URL to base64 data
 */
async function urlToBase64(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const base64 = buffer.toString('base64');
    
    // Detect mime type from URL or response headers
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    return {
      inlineData: {
        data: base64,
        mimeType: contentType
      }
    };
  } catch (error) {
    throw new Error(`Failed to convert image URL to base64: ${error.message}`);
  }
}

/**
 * Convert local file to base64 data
 */
function fileToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  
  return {
    inlineData: {
      data: base64,
      mimeType: mimeTypes[ext] || 'image/jpeg'
    }
  };
}

/**
 * Generate Pinterest pin with AI-powered text overlay
 * Uses Gemini 2.5 Flash Image to apply text matching a reference template style
 * 
 * @param {string} mergedImagePath - Path to the merged top+bottom image
 * @param {string} referenceTemplateUrl - URL to the reference Pinterest template
 * @param {string} recipeTitle - The recipe title to write on the image
 * @returns {Promise<Buffer>} - The generated image with text overlay (AI generates subtitle/tagline automatically)
 */
async function generatePinWithAI(mergedImagePath, referenceTemplateUrl, recipeTitle) {
  try {
    const sharp = require('sharp');
    
    // Initialize the Gemini 2.5 Flash Image model (GA version)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    
    // Get reference template and merged image data
    console.log('📦 Preparing images for Gemini...');
    const referenceBuffer = await axios.get(referenceTemplateUrl, { responseType: 'arraybuffer' })
      .then(res => Buffer.from(res.data));
    
    // Get dimensions (should already match)
    const [refMeta, mergedMeta] = await Promise.all([
      sharp(referenceBuffer).metadata(),
      sharp(mergedImagePath).metadata()
    ]);
    
    console.log(`✅ Reference: ${refMeta.width}x${refMeta.height}px, Merged: ${mergedMeta.width}x${mergedMeta.height}px`);
    
    // Convert images to base64
    const mergedImageData = fileToBase64(mergedImagePath);
    const referenceImageData = await urlToBase64(referenceTemplateUrl);
    
    // Build the prompt - Make it very specific and strict
    const prompt = `I need you to CREATE a Pinterest pin by adding text overlay to a recipe photo.

I'm providing:
- IMAGE 1: A recipe photo (${refMeta.width}x${refMeta.height}px) - USE THIS as the background
- IMAGE 2: A design reference showing text styling

YOUR JOB:
Create a NEW image by taking IMAGE 1 (the recipe photo) and adding text to it.

Study IMAGE 2 to see:
- What font sizes to use (small top text, large middle text, small bottom text)
- What text colors to use (likely white text)
- What background colors/boxes to add behind text
- Where to position the text vertically

RECIPE TITLE: "${recipeTitle}"

ADD THESE TEXT ELEMENTS TO IMAGE 1:
1. TOP: Create a short 2-4 word subtitle about "${recipeTitle}"
2. MIDDLE: Write "${recipeTitle}" in large bold letters
3. BOTTOM: Create a 3-5 word catchy tagline

DESIGN SPECIFICATIONS (copy from IMAGE 2):
- Use the same font sizes you see in IMAGE 2
- Use the same text colors (white or as shown)
- Use the same background boxes/overlays behind text
- Position text at similar Y-coordinates
- Center all text horizontally

IMPORTANT:
- Start with IMAGE 1 (recipe photo) as your canvas
- Add text on top of it (don't replace the photo)
- Match the text styling from IMAGE 2
- Output size: ${refMeta.width}x${refMeta.height}px

Return the recipe photo WITH text overlay added.`;

    // Generate content - IMPORTANT: Send merged image first so Gemini focuses on editing it
    console.log('📤 Sending to Gemini: Merged image (to edit) + Reference (for style)...');
    const result = await model.generateContent([
      mergedImageData,  // Send merged image FIRST (this is what gets edited)
      prompt,
      referenceImageData  // Send reference SECOND (for style reference only)
    ]);
    
    const response = await result.response;
    
    // Extract the generated image
    if (response.candidates && response.candidates[0].content.parts) {
      const imagePart = response.candidates[0].content.parts.find(
        part => part.inlineData && part.inlineData.mimeType.startsWith('image/')
      );
      
      if (imagePart) {
        // Convert base64 back to buffer
        const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
        return imageBuffer;
      }
    }
    
    throw new Error('No image generated in Gemini response');
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`Failed to generate pin with AI: ${error.message}`);
  }
}

/**
 * Simple test to verify Gemini API connection
 */
async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hello, Gemini!');
    const response = await result.response;
    return { success: true, message: response.text() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  generatePinWithAI,
  testGeminiConnection,
  urlToBase64,
  fileToBase64
};
