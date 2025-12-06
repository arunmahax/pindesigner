const express = require('express');
const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Load configuration
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'pinterest-pins');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${uploadsDir}`);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pinterest pin dimensions (typical ratios)
const PINTEREST_WIDTH = 600;
const PINTEREST_HEIGHT = 900;

// Download image from URL
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

// Create a rounded rectangle tag
function createTag(tagOptions) {
  // Get defaults from config (first tag as template)
  const configDefaults = config.defaults.topTags[0] || {};
  
  const {
    text,
    fontFamily = configDefaults.fontFamily || 'Montserrat',
    fontWeight = configDefaults.fontWeight || '700',
    fontSize = configDefaults.fontSize || 20,
    textColor = configDefaults.textColor || '#FFFFFF',
    backgroundColor = configDefaults.backgroundColor || '#3CB36B',
    paddingTop = configDefaults.paddingTop || 8,
    paddingBottom = configDefaults.paddingBottom || 8,
    paddingLeft = configDefaults.paddingLeft || 16,
    paddingRight = configDefaults.paddingRight || 16,
    borderRadius = configDefaults.borderRadius || 8
  } = tagOptions;

  // Calculate tag dimensions
  const tempCanvas = createCanvas(10, 10);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textMetrics = tempCtx.measureText(text);
  
  const tagWidth = Math.ceil(textMetrics.width) + paddingLeft + paddingRight;
  const tagHeight = fontSize + paddingTop + paddingBottom;

  // Create tag canvas
  const canvas = createCanvas(tagWidth, tagHeight);
  const ctx = canvas.getContext('2d');

  // Draw rounded rectangle background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, tagWidth, tagHeight, borderRadius);
  ctx.fill();

  // Draw text
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tagWidth / 2, tagHeight / 2);

  return { canvas, width: tagWidth, height: tagHeight };
}

// Create title band
function createTitleBand(text, bandOptions = {}) {
  const opts = config.defaults.titleBand.textOptions;
  const {
    fontSize = opts.fontSize,
    fontFamily = opts.fontFamily,
    fontWeight = opts.fontWeight,
    textColor = opts.textColor,
    backgroundColor = opts.backgroundColor,
    paddingTop = opts.paddingTop,
    paddingBottom = opts.paddingBottom,
    paddingLeft = opts.paddingLeft,
    paddingRight = opts.paddingRight,
    align = opts.align,
    width = PINTEREST_WIDTH
  } = { ...opts, ...bandOptions };

  // Calculate required height for text
  const tempCanvas = createCanvas(width, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Wrap text
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  const maxWidth = width - paddingLeft - paddingRight;

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = tempCtx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.2;
  const textHeight = lines.length * lineHeight;
  const bandHeight = textHeight + paddingTop + paddingBottom;

  // Create band canvas
  const canvas = createCanvas(width, bandHeight);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, bandHeight);

  // Text
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const textX = align === 'center' ? width / 2 : (align === 'right' ? width - paddingRight : paddingLeft);
  const startY = paddingTop;

  lines.forEach((line, i) => {
    ctx.fillText(line, textX, startY + (i * lineHeight));
  });

  return { canvas, width, height: bandHeight };
}

// Create text overlay with customizable styling, auto-sizing, and dynamic height
function createTextOverlay(text, options = {}) {
  // Merge with config defaults
  const defaults = config.defaults.textOptions;
  
  const {
    width = PINTEREST_WIDTH,
    height = 120,
    backgroundColor = defaults.backgroundColor,
    textColor = defaults.textColor,
    fontSize = defaults.fontSize,
    fontFamily = defaults.fontFamily,
    fontWeight = defaults.fontWeight,
    textAlign = 'center',
    padding = 1,
    paddingTop = defaults.paddingTop || 12,
    paddingBottom = defaults.paddingBottom || 12,
    backgroundStrokeTopColor = defaults.backgroundStrokeTopColor || '#000000',
    backgroundStrokeTopWidth = defaults.backgroundStrokeTopWidth || 0,
    backgroundStrokeBottomColor = defaults.backgroundStrokeBottomColor || '#000000',
    backgroundStrokeBottomWidth = defaults.backgroundStrokeBottomWidth || 0,
    backgroundStrokeLeftWidth = defaults.backgroundStrokeLeftWidth || 0,
    backgroundStrokeRightWidth = defaults.backgroundStrokeRightWidth || 0,
    strokeColor = defaults.strokeColor || '#FFFFFF',
    strokeWidth = defaults.strokeWidth || 0,
    showBackground = true // New option to control background layer
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Clear the canvas with transparency
  ctx.clearRect(0, 0, width, height);

  // Parse background color and apply transparency
  let bgColor = backgroundColor;
  if (backgroundColor && !backgroundColor.includes('rgba')) {
    // Convert hex or rgb to rgba with 70% opacity if not already specified
    if (backgroundColor.startsWith('#')) {
      const hex = backgroundColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      bgColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
    }
  }

  // Set semi-transparent background only if enabled
  if (showBackground) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw border strokes
    // Top stroke
    if (backgroundStrokeTopWidth > 0) {
      ctx.fillStyle = backgroundStrokeTopColor;
      ctx.fillRect(0, 0, width, backgroundStrokeTopWidth);
    }
    
    // Bottom stroke
    if (backgroundStrokeBottomWidth > 0) {
      ctx.fillStyle = backgroundStrokeBottomColor;
      ctx.fillRect(0, height - backgroundStrokeBottomWidth, width, backgroundStrokeBottomWidth);
    }
    
    // Left stroke
    if (backgroundStrokeLeftWidth > 0) {
      ctx.fillStyle = backgroundStrokeTopColor; // Use top color for sides
      ctx.fillRect(0, 0, backgroundStrokeLeftWidth, height);
    }
    
    // Right stroke
    if (backgroundStrokeRightWidth > 0) {
      ctx.fillStyle = backgroundStrokeTopColor; // Use top color for sides
      ctx.fillRect(width - backgroundStrokeRightWidth, 0, backgroundStrokeRightWidth, height);
    }
  }

  // Function to wrap text into multiple lines
  function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  // Function to calculate required height for text
  function calculateRequiredHeight(text, maxWidth, startSize = fontSize) {
    let currentSize = startSize;
    const minReadableSize = 24; // Minimum readable font size
    
    // Try to fit at minimum readable size
    ctx.font = `${fontWeight} ${minReadableSize}px ${fontFamily}`;
    const lines = wrapText(text, maxWidth - (padding * 2));
    const lineHeight = minReadableSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    
    return {
      requiredHeight: totalTextHeight + (padding * 2),
      lines: lines,
      fontSize: minReadableSize,
      lineHeight: lineHeight
    };
  }

  // Function to find the best font size that fits (with minimum readable size)
  function getOptimalFontSize(text, maxWidth, maxHeight, startSize = fontSize) {
    let currentSize = startSize;
    let lines = [];
    const minReadableSize = 24; // Minimum readable font size
    
    // Debug: Log the requested font size
    console.log(`🎯 [Font Debug] Requested fontSize: ${startSize}`);
    
    // If the user sets a large font size (over 60), respect their choice and don't auto-resize
    if (startSize > 60) {
      console.log(`🚨 [Font Debug] Large fontSize detected (${startSize}), using as-is without auto-resize!`);
      ctx.font = `${fontWeight} ${startSize}px ${fontFamily}`;
      lines = wrapText(text, maxWidth - (padding * 2));
      const lineHeight = startSize * 1.2;
      const totalTextHeight = lines.length * lineHeight;
      
      return { 
        size: startSize, 
        lines, 
        lineHeight, 
        totalHeight: totalTextHeight,
        fits: false, // Doesn't matter since we're forcing the size
        requiredHeight: totalTextHeight + (padding * 2)
      };
    }
    
    while (currentSize >= minReadableSize) {
      ctx.font = `${fontWeight} ${currentSize}px ${fontFamily}`;
      lines = wrapText(text, maxWidth - (padding * 2));
      
      const lineHeight = currentSize * 1.2;
      const totalTextHeight = lines.length * lineHeight;
      
      if (totalTextHeight <= maxHeight - (padding * 2)) {
        console.log(`🎯 [Font Debug] Using fontSize: ${currentSize} (fits within canvas)`);
        return { 
          size: currentSize, 
          lines, 
          lineHeight, 
          totalHeight: totalTextHeight,
          fits: true
        };
      }
      
      currentSize -= 2;
    }
    
    // If we can't fit even at minimum size, return info for dynamic height
    const heightInfo = calculateRequiredHeight(text, maxWidth, startSize);
    console.log(`🎯 [Font Debug] Using minimum fontSize: ${minReadableSize} (couldn't fit requested size)`);
    return { 
      size: minReadableSize, 
      lines: heightInfo.lines, 
      lineHeight: heightInfo.lineHeight, 
      totalHeight: heightInfo.requiredHeight - (padding * 2),
      fits: false,
      requiredHeight: heightInfo.requiredHeight
    };
  }

  // Get optimal font size and text lines (use paddingTop/paddingBottom)
  const maxTextWidth = width - (padding * 2);
  const maxTextHeight = height - paddingTop - paddingBottom;
  const textInfo = getOptimalFontSize(text, maxTextWidth, maxTextHeight);

  // Set optimized text properties
  ctx.font = `${fontWeight} ${textInfo.size}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate starting position for centered text block (account for top padding and strokes)
  const effectiveTop = paddingTop + backgroundStrokeTopWidth;
  const effectiveHeight = height - paddingTop - paddingBottom - backgroundStrokeTopWidth - backgroundStrokeBottomWidth;
  const startY = effectiveTop + (effectiveHeight - textInfo.totalHeight) / 2 + textInfo.lineHeight / 2;

  // Draw each line
  textInfo.lines.forEach((line, index) => {
    const x = width / 2;
    const y = startY + (index * textInfo.lineHeight);

    // Add text stroke for better readability
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, x, y);
    }

    // Add main text
    ctx.fillText(line, x, y);
  });

  // Return result with height information
  if (!textInfo.fits) {
    return {
      buffer: canvas.toBuffer('image/png'),
      needsMoreHeight: true,
      requiredHeight: textInfo.requiredHeight,
      actualHeight: height
    };
  }

  return {
    buffer: canvas.toBuffer('image/png'),
    needsMoreHeight: false,
    actualHeight: height
  };
}

// Helper function to capitalize first letter of each word
function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Main endpoint to create Pinterest pin
app.post('/api/create-pin', async (req, res) => {
  try {
    const {
      topImageUrl,
      bottomImageUrl,
      recipeTitle: rawRecipeTitle,
      textOptions = {},
      showTextOverlay = true, // Control entire text overlay visibility
      showTextBackground = true, // New option to control just the background layer
      titleBand = null, // Title band configuration
      topTags = null // Array of tag configurations
    } = req.body;

    // Capitalize recipe title
    const recipeTitle = toTitleCase(rawRecipeTitle);

    // Validate required fields
    if (!topImageUrl || !bottomImageUrl) {
      return res.status(400).json({
        error: 'Missing required fields: topImageUrl and bottomImageUrl are required'
      });
    }

    // If text overlay is enabled, recipe title is required
    if (showTextOverlay && !recipeTitle) {
      return res.status(400).json({
        error: 'recipeTitle is required when showTextOverlay is true'
      });
    }

    console.log('Creating pin:', showTextOverlay ? `with text: ${recipeTitle}` : 'without text overlay');

    // Download images
    const [topImageBuffer, bottomImageBuffer] = await Promise.all([
      downloadImage(topImageUrl),
      downloadImage(bottomImageUrl)
    ]);

    // Calculate image heights (each takes 50% of total height)
    const imageHeight = Math.floor(PINTEREST_HEIGHT * 0.5);
    
    let textOverlay = null;
    let textOverlayTop = 0;
    
    // Only create text overlay if enabled
    if (showTextOverlay && recipeTitle) {
      // Start with default text overlay height, but make it dynamic
      let textOverlayHeight = 120;
      
      // First, try to create text overlay with default height
      let textResult = createTextOverlay(recipeTitle, {
        ...textOptions,
        width: PINTEREST_WIDTH,
        height: textOverlayHeight,
        showBackground: showTextBackground // Pass the background toggle option
      });

      // If text needs more height, use dynamic height
      if (textResult.needsMoreHeight) {
        textOverlayHeight = Math.min(textResult.requiredHeight, PINTEREST_HEIGHT * 0.4); // Max 40% of total height
        
        // Recreate with dynamic height
        textResult = createTextOverlay(recipeTitle, {
          ...textOptions,
          width: PINTEREST_WIDTH,
          height: textOverlayHeight,
          showBackground: showTextBackground // Pass the background toggle option
        });
      }

      textOverlay = textResult.buffer;
      textOverlayTop = Math.floor((PINTEREST_HEIGHT - textOverlayHeight) / 2); // Center vertically
    }

    // Process images to fit Pinterest dimensions
    const topImage = await sharp(topImageBuffer)
      .resize(PINTEREST_WIDTH, imageHeight, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const bottomImage = await sharp(bottomImageBuffer)
      .resize(PINTEREST_WIDTH, imageHeight, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // Prepare composite layers - always include images
    const compositeLayers = [
      // Place images first (background)
      { input: topImage, top: 0, left: 0, blend: 'over' },
      { input: bottomImage, top: imageHeight, left: 0, blend: 'over' }
    ];

    // Add text overlay only if enabled
    if (showTextOverlay && textOverlay) {
      compositeLayers.push({
        input: textOverlay, 
        top: textOverlayTop, 
        left: 0, 
        blend: 'over'
      });
    }

    // Add title band if provided (uses recipeTitle automatically)
    if (titleBand && recipeTitle) {
      const band = createTitleBand(recipeTitle, titleBand.textOptions);
      const bandBuffer = band.canvas.toBuffer('image/png');
      
      // Position: default to middle (where text overlay usually is)
      const bandY = titleBand.position?.y || imageHeight;
      
      compositeLayers.push({
        input: bandBuffer,
        top: bandY,
        left: 0,
        blend: 'over'
      });
    }

    // Add top tags if provided
    if (topTags && Array.isArray(topTags)) {
      // Use config defaults if empty array
      const tagsToUse = topTags.length > 0 ? topTags : config.defaults.topTags;
      
      for (const tagConfig of tagsToUse) {
        const tag = createTag(tagConfig);
        const tagBuffer = tag.canvas.toBuffer('image/png');
        
        // Handle position
        let x = tagConfig.position?.x || 40;
        let y = tagConfig.position?.y || 40;
        
        // Handle right-aligned tags (e.g., "right-40")
        if (typeof x === 'string' && x.startsWith('right-')) {
          const offset = parseInt(x.replace('right-', ''));
          x = PINTEREST_WIDTH - tag.width - offset;
        }
        
        compositeLayers.push({
          input: tagBuffer,
          top: y,
          left: x,
          blend: 'over'
        });
      }
    }

    // Combine all elements
    const finalImage = await sharp({
      create: {
        width: PINTEREST_WIDTH,
        height: PINTEREST_HEIGHT,
        channels: 4, // Support transparency (RGBA)
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .composite(compositeLayers)
    .toBuffer();

    // Generate filename with timestamp
    const timestamp = Date.now();
    const baseFilename = recipeTitle ? 
      recipeTitle.replace(/[^a-zA-Z0-9]/g, '_') : 
      'pinterest_pin';
    const filename = `${baseFilename}_${timestamp}.png`;
    const filePath = path.join(uploadsDir, filename);

    // Save the image to the uploads directory
    fs.writeFileSync(filePath, finalImage);
    
    // Generate the URL that can be accessed from outside
    const imageUrl = `http://localhost:${PORT}/uploads/pinterest-pins/${filename}`;
    
    console.log(`✅ Pinterest pin saved to: ${filePath}`);
    console.log(`🔗 Accessible at: ${imageUrl}`);

    // Return JSON response with the image URL
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: filename,
      message: 'Pinterest pin created successfully'
    });

  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Pinterest Pin Generator', timestamp: new Date().toISOString() });
});

// Get available fonts endpoint
app.get('/api/fonts', (req, res) => {
  const availableFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact'
  ];
  
  res.json({ fonts: availableFonts });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  const docs = {
    title: 'Pinterest Pin Generator API',
    version: '1.0.0',
    endpoints: {
      'POST /api/create-pin': {
        description: 'Create a Pinterest-style pin with two images and optional text overlay',
        body: {
          topImageUrl: 'string (required) - URL of the top image',
          bottomImageUrl: 'string (required) - URL of the bottom image',
          recipeTitle: 'string (optional) - Text to display in the overlay (required if showTextOverlay is true)',
          showTextOverlay: 'boolean (optional) - Whether to show text overlay (default: true)',
          textOptions: {
            backgroundColor: 'string (optional) - Background color of text overlay (default: "rgba(0, 0, 0, 0.7)")',
            textColor: 'string (optional) - Color of the text (default: "#ffffff")',
            fontSize: 'number (optional) - Font size in pixels (default: 36, minimum: 24)',
            fontFamily: 'string (optional) - Font family (default: "Arial")',
            fontWeight: 'string (optional) - Font weight (default: "bold")',
            strokeColor: 'string (optional) - Text stroke color (default: "#000000")',
            strokeWidth: 'number (optional) - Text stroke width (default: 2)'
          }
        },
        response: 'PNG image file'
      },
      'GET /api/health': {
        description: 'Health check endpoint',
        response: 'JSON with service status'
      },
      'GET /api/fonts': {
        description: 'Get list of available fonts',
        response: 'JSON array of font names'
      }
    }
  };
  
  res.json(docs);
});

app.listen(PORT, () => {
  console.log(`🚀 Pinterest Pin Generator Service running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
