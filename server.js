const express = require('express');
const sharp = require('sharp');
const { createCanvas, registerFont } = require('canvas');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Google Generative AI (Gemini)
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = require('./config.json');
const app = express();
const PORT = process.env.PORT || config.service.port || 3001;

// Pinterest pin dimensions from config
const PINTEREST_WIDTH = config.pinterest?.width || 1000;
const PINTEREST_HEIGHT = config.pinterest?.height || 2000;

// Gemini AI configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = config.gemini?.model || 'gemini-2.0-flash';
const MAX_TITLE_WORDS = config.gemini?.maxTitleWords || 6;

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized');
} else {
  console.warn('⚠️  GEMINI_API_KEY not set - title shortening disabled');
}

// Display fonts that only support single weight (no bold/weight variants)
const DISPLAY_FONTS = [
  'Luckiest Guy',
  'Bebas Neue', 
  'Yellowtail',
  'DM Serif Display',
  'Merriweather'
];

// ============================================================================
// FONT REGISTRATION
// ============================================================================

const fontsDir = path.join(__dirname, 'fonts');
const registeredFonts = new Map(); // Track registered fonts for /api/fonts endpoint

const fonts = [
  // Montserrat family
  { family: 'Montserrat', file: 'Montserrat-Regular.ttf', weight: '400' },
  { family: 'Montserrat', file: 'Montserrat-Bold.ttf', weight: '700' },
  { family: 'Montserrat', file: 'Montserrat-Black.ttf', weight: '900' },
  
  // Playfair Display family
  { family: 'Playfair Display', file: 'Playfair_Display_400.ttf', weight: '400' },
  { family: 'Playfair Display', file: 'Playfair_Display_700.ttf', weight: '700' },
  
  // Lato family
  { family: 'Lato', file: 'Lato_400.ttf', weight: '400' },
  { family: 'Lato', file: 'Lato_700.ttf', weight: '700' },
  
  // Open Sans family
  { family: 'Open Sans', file: 'Open_Sans_400.ttf', weight: '400' },
  { family: 'Open Sans', file: 'Open_Sans_700.ttf', weight: '700' },
  
  // Roboto family
  { family: 'Roboto', file: 'Roboto_400.ttf', weight: '400' },
  { family: 'Roboto', file: 'Roboto_700.ttf', weight: '700' },
  
  // Geom family
  { family: 'Geom', file: 'Geom-Regular.ttf', weight: '400' },
  { family: 'Geom', file: 'Geom-Bold.ttf', weight: '700' },
  { family: 'Geom', file: 'Geom-Black.ttf', weight: '900' },
  
  // Display fonts (single weight only) - using correct font file names
  { family: 'Luckiest Guy', file: 'LuckiestGuy-Regular.ttf', weight: 'normal' },
  { family: 'Bebas Neue', file: 'Bebas_Neue_400.ttf', weight: 'normal' },
  { family: 'Yellowtail', file: 'Yellowtail_400.ttf', weight: 'normal' },
  { family: 'DM Serif Display', file: 'DM_Serif_Display_400.ttf', weight: 'normal' },
  { family: 'Merriweather', file: 'Merriweather_400.ttf', weight: 'normal' },
];

// Register all fonts
console.log('\n🔤 Registering fonts...');
fonts.forEach(font => {
  const fontPath = path.join(fontsDir, font.file);
  if (fs.existsSync(fontPath)) {
    try {
      registerFont(fontPath, { family: font.family, weight: font.weight });
      
      // Track registered fonts
      if (!registeredFonts.has(font.family)) {
        registeredFonts.set(font.family, {
          name: font.family,
          weights: [],
          isDisplayFont: DISPLAY_FONTS.includes(font.family)
        });
      }
      registeredFonts.get(font.family).weights.push(font.weight);
      
      console.log(`  ✅ ${font.family} (${font.weight})`);
    } catch (error) {
      console.error(`  ❌ Failed: ${font.family} - ${error.message}`);
    }
  } else {
    console.warn(`  ⚠️  Not found: ${font.file}`);
  }
});

console.log(`\n✅ Registered ${registeredFonts.size} font families\n`);

// ============================================================================
// DIRECTORY SETUP
// ============================================================================

const uploadsDir = path.join(__dirname, 'uploads', 'pinterest-pins');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`📁 Created: ${uploadsDir}`);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Download image from URL or decode base64 data URL
 */
async function downloadImage(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL: must be a non-empty string');
  }
  
  // Handle base64 data URLs
  if (url.startsWith('data:image/')) {
    try {
      // Extract base64 data from data URL (format: data:image/jpeg;base64,XXXX)
      const matches = url.match(/^data:image\/\w+;base64,(.+)$/);
      if (!matches || !matches[1]) {
        throw new Error('Invalid base64 data URL format');
      }
      console.log('  📦 Processing base64 image data');
      return Buffer.from(matches[1], 'base64');
    } catch (error) {
      throw new Error(`Failed to decode base64 image: ${error.message}`);
    }
  }
  
  // Handle HTTP/HTTPS URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Invalid URL format: ${url.substring(0, 50)}...`);
  }
  
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Pinterest-Pin-Generator/2.0'
      }
    });
    return Buffer.from(response.data);
  } catch (error) {
    const errorMessages = {
      'ENOTFOUND': `Cannot reach: ${url}`,
      'ECONNREFUSED': `Connection refused: ${url}`,
      'ETIMEDOUT': `Timeout: ${url}`,
      'ECONNABORTED': `Request aborted: ${url}`
    };
    
    throw new Error(
      errorMessages[error.code] || 
      (error.response ? `HTTP ${error.response.status}: ${url}` : error.message)
    );
  }
}

/**
 * Build canvas font string based on font family and weight
 */
function buildFontString(fontSize, fontFamily, fontWeight = '400') {
  let fontString;
  if (DISPLAY_FONTS.includes(fontFamily)) {
    fontString = `${fontSize}px "${fontFamily}"`;
  } else {
    fontString = `${fontWeight} ${fontSize}px "${fontFamily}"`;
  }
  console.log(`  🔤 Font: ${fontString}`);
  return fontString;
}

/**
 * Wrap text into multiple lines that fit within maxWidth
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Convert hex color to RGBA string
 */
function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0, 0, 0, ${alpha})`;
  if (hex.includes('rgba')) return hex;
  
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Capitalize first letter of each word
 */
function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// CANVAS COMPONENTS
// ============================================================================

/**
 * Create a rounded rectangle tag
 */
function createTag(tagOptions) {
  const defaults = config.defaults.topTags?.[0] || {};
  
  const {
    text,
    fontFamily = defaults.fontFamily || 'Montserrat',
    fontWeight = defaults.fontWeight || '700',
    fontSize = defaults.fontSize || 18,
    textColor = defaults.textColor || '#FFFFFF',
    backgroundColor = defaults.backgroundColor || '#E60023',
    paddingTop = defaults.paddingTop || 8,
    paddingBottom = defaults.paddingBottom || 8,
    paddingLeft = defaults.paddingLeft || 16,
    paddingRight = defaults.paddingRight || 16,
    borderRadius = defaults.borderRadius || 6
  } = tagOptions;

  // Measure text
  const tempCanvas = createCanvas(10, 10);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = buildFontString(fontSize, fontFamily, fontWeight);
  const textMetrics = tempCtx.measureText(text);
  
  const tagWidth = Math.ceil(textMetrics.width) + paddingLeft + paddingRight;
  const tagHeight = fontSize + paddingTop + paddingBottom;

  // Create tag
  const canvas = createCanvas(tagWidth, tagHeight);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(0, 0, tagWidth, tagHeight, borderRadius);
  ctx.fill();

  // Text
  ctx.font = buildFontString(fontSize, fontFamily, fontWeight);
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tagWidth / 2, tagHeight / 2);

  return { canvas, width: tagWidth, height: tagHeight };
}

/**
 * Create title band (full-width text banner)
 */
function createTitleBand(text, bandOptions = {}) {
  const defaults = config.defaults.titleBand?.textOptions || {};
  
  const {
    fontSize = defaults.fontSize || 36,
    fontFamily = defaults.fontFamily || 'Montserrat',
    fontWeight = defaults.fontWeight || '700',
    textColor = defaults.textColor || '#FFFFFF',
    backgroundColor = defaults.backgroundColor || '#E60023',
    paddingTop = defaults.paddingTop || 20,
    paddingBottom = defaults.paddingBottom || 20,
    paddingLeft = defaults.paddingLeft || 30,
    paddingRight = defaults.paddingRight || 30,
    align = defaults.align || 'center',
    width = PINTEREST_WIDTH
  } = { ...defaults, ...bandOptions };

  // Calculate text wrapping
  const tempCanvas = createCanvas(width, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = buildFontString(fontSize, fontFamily, fontWeight);
  
  const maxWidth = width - paddingLeft - paddingRight;
  const lines = wrapText(tempCtx, text, maxWidth);
  const lineHeight = fontSize * 1.3;
  const bandHeight = (lines.length * lineHeight) + paddingTop + paddingBottom;

  // Create band
  const canvas = createCanvas(width, bandHeight);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, bandHeight);

  // Text
  ctx.font = buildFontString(fontSize, fontFamily, fontWeight);
  ctx.fillStyle = textColor;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const textX = align === 'center' ? width / 2 : (align === 'right' ? width - paddingRight : paddingLeft);
  
  lines.forEach((line, i) => {
    ctx.fillText(line, textX, paddingTop + (i * lineHeight));
  });

  return { canvas, width, height: bandHeight };
}

/**
 * Create text overlay with styling and auto-sizing
 */
function createTextOverlay(text, options = {}) {
  const defaults = config.defaults.textOptions || {};
  
  const {
    width = PINTEREST_WIDTH,
    height = 150,
    backgroundColor = defaults.backgroundColor || 'rgba(0, 0, 0, 0.7)',
    textColor = defaults.textColor || '#FFFFFF',
    fontSize = defaults.fontSize || 48,
    fontFamily = defaults.fontFamily || 'Montserrat',
    fontWeight = defaults.fontWeight || '700',
    paddingTop = defaults.paddingTop || 20,
    paddingBottom = defaults.paddingBottom || 20,
    paddingLeft = 20,
    paddingRight = 20,
    strokeColor = defaults.strokeColor || '#000000',
    strokeWidth = defaults.strokeWidth || 0,
    backgroundStrokeTopColor = defaults.backgroundStrokeTopColor || '#000000',
    backgroundStrokeTopWidth = defaults.backgroundStrokeTopWidth || 0,
    backgroundStrokeBottomColor = defaults.backgroundStrokeBottomColor || '#000000',
    backgroundStrokeBottomWidth = defaults.backgroundStrokeBottomWidth || 0,
    showBackground = true
  } = options;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // Background
  if (showBackground) {
    ctx.fillStyle = backgroundColor.includes('rgba') ? backgroundColor : hexToRgba(backgroundColor, 0.7);
    ctx.fillRect(0, 0, width, height);
    
    // Border strokes
    if (backgroundStrokeTopWidth > 0) {
      ctx.fillStyle = backgroundStrokeTopColor;
      ctx.fillRect(0, 0, width, backgroundStrokeTopWidth);
    }
    if (backgroundStrokeBottomWidth > 0) {
      ctx.fillStyle = backgroundStrokeBottomColor;
      ctx.fillRect(0, height - backgroundStrokeBottomWidth, width, backgroundStrokeBottomWidth);
    }
  }

  // Find optimal font size
  const maxTextWidth = width - paddingLeft - paddingRight;
  const maxTextHeight = height - paddingTop - paddingBottom - backgroundStrokeTopWidth - backgroundStrokeBottomWidth;
  const minFontSize = config.limits?.minFontSize || 16;
  
  let currentSize = fontSize;
  let lines = [];
  let lineHeight = currentSize * 1.2;
  let totalTextHeight = 0;
  let fits = false;

  // Try to fit text, reducing size if needed (unless fontSize > 60, then respect user choice)
  const respectUserSize = fontSize > 60;
  
  while (currentSize >= minFontSize) {
    ctx.font = buildFontString(currentSize, fontFamily, fontWeight);
    lines = wrapText(ctx, text, maxTextWidth);
    lineHeight = currentSize * 1.2;
    totalTextHeight = lines.length * lineHeight;
    
    if (totalTextHeight <= maxTextHeight || respectUserSize) {
      fits = totalTextHeight <= maxTextHeight;
      break;
    }
    
    currentSize -= 2;
  }

  // Draw text
  ctx.font = buildFontString(currentSize, fontFamily, fontWeight);
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const effectiveTop = paddingTop + backgroundStrokeTopWidth;
  const effectiveHeight = height - paddingTop - paddingBottom - backgroundStrokeTopWidth - backgroundStrokeBottomWidth;
  const startY = effectiveTop + (effectiveHeight - totalTextHeight) / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const x = width / 2;
    const y = startY + (index * lineHeight);

    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, x, y);
    }
    
    ctx.fillText(line, x, y);
  });

  return {
    buffer: canvas.toBuffer('image/png'),
    needsMoreHeight: !fits,
    requiredHeight: fits ? height : totalTextHeight + paddingTop + paddingBottom,
    actualHeight: height
  };
}

/**
 * Shorten a title using Gemini AI to max words while keeping essence
 */
async function shortenTitleWithGemini(title, maxWords = MAX_TITLE_WORDS) {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GEMINI_API_KEY in .env file');
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are a Pinterest title optimizer. Your task is to shorten recipe/food titles for Pinterest pins.

Rules:
1. Maximum ${maxWords} words (STRICT - never exceed)
2. Keep the most important/appetizing words
3. Maintain the food item and key descriptor (e.g., "Crispy", "Creamy", "Garlic")
4. Remove filler words like "with", "and", "the", "a", "simple", "easy", "best"
5. Output ONLY the shortened title, nothing else
6. Keep it catchy and appetizing
7. Use Title Case

Examples:
- "Crispy Italian Chicken with Garlic Butter Sauce – Simple Chicken Breast Dinner" → "Crispy Italian Garlic Butter Chicken"
- "The Best Ever Homemade Chocolate Chip Cookies Recipe" → "Best Homemade Chocolate Chip Cookies"
- "Easy 30-Minute Creamy Tuscan Shrimp Pasta Recipe" → "Creamy Tuscan Shrimp Pasta"
- "Simple and Delicious Honey Garlic Glazed Salmon" → "Honey Garlic Glazed Salmon"

Now shorten this title (max ${maxWords} words):
"${title}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const shortenedTitle = response.text().trim().replace(/^["']|["']$/g, '');
    
    // Verify word count
    const wordCount = shortenedTitle.split(/\s+/).length;
    
    if (wordCount > maxWords) {
      // If still too long, take first maxWords
      return shortenedTitle.split(/\s+/).slice(0, maxWords).join(' ');
    }
    
    return shortenedTitle;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw new Error(`Failed to shorten title: ${error.message}`);
  }
}

/**
 * Generate Pinterest tags using Gemini AI based on recipe title
 */
async function generateTagsWithGemini(title, maxTags = 2) {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GEMINI_API_KEY in .env file');
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are a Pinterest recipe category expert. Generate ${maxTags} recipe CATEGORY tags based on the recipe title.

Rules:
1. Maximum 3 words per tag
2. Focus on recipe CATEGORIES like meal type, difficulty, diet, or time
3. Common categories: "Easy Dinner", "Quick Recipe", "Healthy Meal", "High Protein", "Weeknight Dinner", "Budget Friendly", "Family Meal", "30 Minute Recipe"
4. Output ONLY the category tags separated by commas
5. Use Title Case
6. Be specific to the recipe ingredients and style

Examples:
- "Crispy Italian Chicken" → "Easy Dinner, High Protein"
- "Quick Pasta Recipe" → "Quick Recipe, Weeknight Dinner"
- "Healthy Salmon Bowl" → "Healthy Meal, High Protein"

Recipe Title: "${title}"

Generate ${maxTags} category tags (comma-separated):`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tagsText = response.text().trim();
    
    // Parse comma-separated tags
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim().replace(/^["']|["']$/g, ''))
      .filter(tag => tag.length > 0)
      .slice(0, maxTags);
    
    // Verify word count for each tag
    const validTags = tags.filter(tag => tag.split(/\s+/).length <= 3);
    
    if (validTags.length === 0) {
      throw new Error('Generated tags exceeded word limit');
    }
    
    return validTags;
  } catch (error) {
    console.error('Gemini tag generation error:', error.message);
    throw error;
  }
}

/**
 * Split a recipe title into smart 3-line layout using Gemini AI
 * Returns: { line1: "ONE POT GNOCCHI", line2: "CHICKEN", line3: "POT PIE" }
 */
async function splitTitleForPin(title) {
  if (!genAI) {
    throw new Error('Gemini API not configured. Set GEMINI_API_KEY in .env file');
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are a Pinterest pin text designer. Your job is to split recipe titles into 3 lines for maximum visual impact and Pinterest SEO.

LAYOUT RULES:
- Line 1 (TOP - small): Descriptive prefix (2-4 words) - cooking method, style, or modifier
- Line 2 (MIDDLE - HUGE): Main food keyword (1-2 words MAX) - the hero ingredient/dish
- Line 3 (BOTTOM - medium): Recipe type or suffix (1-3 words)

SEO RULES:
- Line 2 MUST be the most searchable food keyword (CHICKEN, BEEF, PASTA, SOUP, etc.)
- Use ALL CAPS for output
- Remove filler words (the, a, an, with, and, for, etc.)
- Keep it punchy and appetizing

EXAMPLES:
Input: "One-Pot Gnocchi Chicken Pot Pie: Easy Comfort Food with Chicken and Dumplings"
Output:
LINE1: ONE POT GNOCCHI
LINE2: CHICKEN
LINE3: POT PIE

Input: "Creamy Marry Me Chicken Soup Recipe - Best Comfort Food"
Output:
LINE1: MARRY ME
LINE2: CHICKEN
LINE3: SOUP

Input: "Easy Air Fryer Crispy Roasted Potatoes with Garlic"
Output:
LINE1: AIR FRYER
LINE2: ROASTED POTATOES
LINE3: CRISPY GARLIC

Input: "High Protein Hot Honey Beef Bowl - Spicy Sweet Meal Prep"
Output:
LINE1: HIGH PROTEIN
LINE2: HOT HONEY BEEF BOWL
LINE3: SPICY SWEET MEAL PREP

Input: "Caramelised Soy Chicken in Garlic Ginger Sauce"
Output:
LINE1: CARAMELISED SOY
LINE2: CHICKEN
LINE3: IN GARLIC GINGER

Now split this title:
"${title}"

Output ONLY in this exact format:
LINE1: [text]
LINE2: [text]
LINE3: [text]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parse the response
    const lines = {
      line1: '',
      line2: '',
      line3: ''
    };
    
    const line1Match = text.match(/LINE1:\s*(.+)/i);
    const line2Match = text.match(/LINE2:\s*(.+)/i);
    const line3Match = text.match(/LINE3:\s*(.+)/i);
    
    if (line1Match) lines.line1 = line1Match[1].trim().toUpperCase();
    if (line2Match) lines.line2 = line2Match[1].trim().toUpperCase();
    if (line3Match) lines.line3 = line3Match[1].trim().toUpperCase();
    
    // Validate we got something
    if (!lines.line2) {
      throw new Error('Failed to extract main keyword');
    }
    
    console.log(`  📝 Smart split: "${lines.line1}" | "${lines.line2}" | "${lines.line3}"`);
    
    return lines;
  } catch (error) {
    console.error('Gemini title split error:', error.message);
    throw new Error(`Failed to split title: ${error.message}`);
  }
}

/**
 * Create smart 3-line text overlay with different sizes
 */
function createSmartTextOverlay(lines, options = {}) {
  const {
    width = PINTEREST_WIDTH,
    line1FontSize = 48,
    line2FontSize = 120,
    line3FontSize = 56,
    line1FontFamily = 'Montserrat',
    line2FontFamily = 'Montserrat',
    line3FontFamily = 'Montserrat',
    line1FontWeight = '700',
    line2FontWeight = '900',
    line3FontWeight = '700',
    line1Color = '#FFFFFF',
    line2Color = '#FFFFFF',
    line3Color = '#FFFFFF',
    line1StrokeColor = '#000000',
    line2StrokeColor = '#000000',
    line3StrokeColor = '#000000',
    line1StrokeWidth = 0,
    line2StrokeWidth = 3,
    line3StrokeWidth = 0,
    backgroundColor = 'rgba(0, 0, 0, 0.6)',
    showBackground = true,
    paddingTop = 30,
    paddingBottom = 30,
    lineSpacing = 10,
    // Background stroke options
    backgroundStrokeTopColor = '#000000',
    backgroundStrokeTopWidth = 0,
    backgroundStrokeBottomColor = '#000000',
    backgroundStrokeBottomWidth = 0,
    lineHeight = 1.2
  } = options;

  // Calculate total height needed
  const line1Height = lines.line1 ? line1FontSize * lineHeight : 0;
  const line2Height = lines.line2 ? line2FontSize * lineHeight : 0;
  const line3Height = lines.line3 ? line3FontSize * lineHeight : 0;
  
  const spacing1 = lines.line1 && lines.line2 ? lineSpacing : 0;
  const spacing2 = lines.line2 && lines.line3 ? lineSpacing : 0;
  
  const totalTextHeight = line1Height + line2Height + line3Height + spacing1 + spacing2;
  const height = totalTextHeight + paddingTop + paddingBottom + backgroundStrokeTopWidth + backgroundStrokeBottomWidth;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // Background
  if (showBackground) {
    ctx.fillStyle = backgroundColor.includes('rgba') ? backgroundColor : hexToRgba(backgroundColor, 0.6);
    ctx.fillRect(0, 0, width, height);
    
    // Background stroke top
    if (backgroundStrokeTopWidth > 0) {
      ctx.fillStyle = backgroundStrokeTopColor;
      ctx.fillRect(0, 0, width, backgroundStrokeTopWidth);
    }
    
    // Background stroke bottom
    if (backgroundStrokeBottomWidth > 0) {
      ctx.fillStyle = backgroundStrokeBottomColor;
      ctx.fillRect(0, height - backgroundStrokeBottomWidth, width, backgroundStrokeBottomWidth);
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let currentY = paddingTop + backgroundStrokeTopWidth;

  // Draw Line 1 (small - top)
  if (lines.line1) {
    ctx.font = buildFontString(line1FontSize, line1FontFamily, line1FontWeight);
    const y = currentY + line1Height / 2;
    
    if (line1StrokeWidth > 0) {
      ctx.strokeStyle = line1StrokeColor;
      ctx.lineWidth = line1StrokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(lines.line1, width / 2, y);
    }
    ctx.fillStyle = line1Color;
    ctx.fillText(lines.line1, width / 2, y);
    
    currentY += line1Height + spacing1;
  }

  // Draw Line 2 (HUGE - middle)
  if (lines.line2) {
    ctx.font = buildFontString(line2FontSize, line2FontFamily, line2FontWeight);
    const y = currentY + line2Height / 2;
    
    if (line2StrokeWidth > 0) {
      ctx.strokeStyle = line2StrokeColor;
      ctx.lineWidth = line2StrokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(lines.line2, width / 2, y);
    }
    ctx.fillStyle = line2Color;
    ctx.fillText(lines.line2, width / 2, y);
    
    currentY += line2Height + spacing2;
  }

  // Draw Line 3 (medium - bottom)
  if (lines.line3) {
    ctx.font = buildFontString(line3FontSize, line3FontFamily, line3FontWeight);
    const y = currentY + line3Height / 2;
    
    if (line3StrokeWidth > 0) {
      ctx.strokeStyle = line3StrokeColor;
      ctx.lineWidth = line3StrokeWidth;
      ctx.lineJoin = 'round';
      ctx.strokeText(lines.line3, width / 2, y);
    }
    ctx.fillStyle = line3Color;
    ctx.fillText(lines.line3, width / 2, y);
  }

  return {
    buffer: canvas.toBuffer('image/png'),
    height: height,
    lines: lines
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/split-title - Split a title into smart 3-line layout using Gemini AI
 */
app.post('/api/split-title', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const lines = await splitTitleForPin(title);
    
    console.log(`🎨 Title split: "${title}" → ${JSON.stringify(lines)}`);

    res.json({
      original: title,
      lines: lines,
      success: true
    });

  } catch (error) {
    console.error('Error splitting title:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shorten-title - Shorten a title using Gemini AI
 */
app.post('/api/shorten-title', async (req, res) => {
  try {
    const { title, maxWords } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if title is already short enough
    const wordCount = title.split(/\s+/).length;
    const targetWords = maxWords || MAX_TITLE_WORDS;
    
    if (wordCount <= targetWords) {
      return res.json({
        original: title,
        shortened: title,
        wasShortened: false,
        wordCount: wordCount
      });
    }

    const shortened = await shortenTitleWithGemini(title, targetWords);
    
    console.log(`📝 Title shortened: "${title}" → "${shortened}"`);

    res.json({
      original: title,
      shortened: shortened,
      wasShortened: true,
      wordCount: shortened.split(/\s+/).length
    });

  } catch (error) {
    console.error('Error shortening title:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/create-pin - Create a Pinterest pin
 */
app.post('/api/create-pin', async (req, res) => {
  try {
    const {
      topImageUrl,
      bottomImageUrl,
      recipeTitle: rawRecipeTitle,
      textOptions = {},
      showTextOverlay = true,
      showTextBackground = true,
      titleBand = null,
      topTags = null,
      styleOverrides = {},
      autoShortenTitle = false, // Auto-shorten with Gemini
      autoGenerateTags = true, // Auto-generate tags with Gemini (enabled by default)
      maxTags = 2, // Number of tags to generate (default 2)
      smartLayout = true, // Use smart 3-line layout with Gemini (DEFAULT: true)
      smartLayoutOptions = {} // Options for smart layout (fonts, colors, sizes)
    } = req.body;

    // Validate required fields
    if (!topImageUrl || !bottomImageUrl) {
      return res.status(400).json({
        error: 'Missing required fields: topImageUrl and bottomImageUrl are required'
      });
    }

    // Process title - optionally shorten with Gemini
    let recipeTitle = toTitleCase(rawRecipeTitle);
    let titleWasShortened = false;
    let generatedTags = null;
    let smartLines = null; // For smart layout
    
    // Smart layout mode - split title into 3 lines using Gemini
    if (smartLayout && recipeTitle && genAI) {
      try {
        smartLines = await splitTitleForPin(recipeTitle);
        console.log(`🎨 Smart layout enabled`);
      } catch (err) {
        console.warn(`⚠️  Could not split title for smart layout: ${err.message}`);
        // Fall back to regular layout
      }
    } else if (autoShortenTitle && recipeTitle && genAI) {
      const wordCount = recipeTitle.split(/\s+/).length;
      if (wordCount > MAX_TITLE_WORDS) {
        try {
          const shortened = await shortenTitleWithGemini(recipeTitle);
          console.log(`📝 Auto-shortened: "${recipeTitle}" → "${shortened}"`);
          recipeTitle = shortened;
          titleWasShortened = true;
        } catch (err) {
          console.warn(`⚠️  Could not auto-shorten title: ${err.message}`);
        }
      }
    }

    // Generate tags with Gemini if requested
    if (autoGenerateTags && recipeTitle && genAI) {
      try {
        generatedTags = await generateTagsWithGemini(recipeTitle, maxTags);
        console.log(`🏷️  Generated tags: ${generatedTags.join(', ')}`);
      } catch (err) {
        console.warn(`⚠️  Could not generate tags: ${err.message}`);
      }
    }

    if (showTextOverlay && !recipeTitle) {
      return res.status(400).json({
        error: 'recipeTitle is required when showTextOverlay is true'
      });
    }

    console.log(`📌 Creating pin${recipeTitle ? `: ${recipeTitle}` : ''}`);

    // Download images in parallel
    const [topImageBuffer, bottomImageBuffer] = await Promise.all([
      downloadImage(topImageUrl),
      downloadImage(bottomImageUrl)
    ]);

    // Merge options
    const mergedTextOptions = {
      ...config.defaults.textOptions,
      ...styleOverrides.textOptions,
      ...textOptions
    };

    // Calculate layout
    const imageHeight = Math.floor(PINTEREST_HEIGHT * 0.5);
    
    // Process images
    const [topImage, bottomImage] = await Promise.all([
      sharp(topImageBuffer)
        .resize(PINTEREST_WIDTH, imageHeight, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer(),
      sharp(bottomImageBuffer)
        .resize(PINTEREST_WIDTH, imageHeight, { fit: 'cover', position: 'center' })
        .png()
        .toBuffer()
    ]);

    // Build composite layers
    const compositeLayers = [
      { input: topImage, top: 0, left: 0 },
      { input: bottomImage, top: imageHeight, left: 0 }
    ];

    // Add text overlay
    if (showTextOverlay && recipeTitle) {
      // Use smart 3-line layout if available
      if (smartLines) {
        // Map textOptions to smart layout format (apply to all lines by default)
        const mappedSmartOptions = {
          // Font settings from textOptions apply to all lines
          line1FontFamily: mergedTextOptions.fontFamily,
          line2FontFamily: mergedTextOptions.fontFamily,
          line3FontFamily: mergedTextOptions.fontFamily,
          line1FontWeight: mergedTextOptions.fontWeight || '700',
          line2FontWeight: mergedTextOptions.fontWeight || '900',
          line3FontWeight: mergedTextOptions.fontWeight || '700',
          // Font sizes - scale from base fontSize if provided
          line1FontSize: mergedTextOptions.fontSize ? Math.round(mergedTextOptions.fontSize * 0.4) : 48,
          line2FontSize: mergedTextOptions.fontSize || 120,
          line3FontSize: mergedTextOptions.fontSize ? Math.round(mergedTextOptions.fontSize * 0.47) : 56,
          // Colors from textOptions
          line1Color: mergedTextOptions.textColor,
          line2Color: mergedTextOptions.textColor,
          line3Color: mergedTextOptions.textColor,
          // Stroke from textOptions
          line1StrokeColor: mergedTextOptions.strokeColor,
          line2StrokeColor: mergedTextOptions.strokeColor,
          line3StrokeColor: mergedTextOptions.strokeColor,
          line1StrokeWidth: mergedTextOptions.strokeWidth || 0,
          line2StrokeWidth: mergedTextOptions.strokeWidth || 3,
          line3StrokeWidth: mergedTextOptions.strokeWidth || 0,
          // Background
          backgroundColor: mergedTextOptions.backgroundColor,
          paddingTop: mergedTextOptions.paddingTop || 30,
          paddingBottom: mergedTextOptions.paddingBottom || 30,
          // Background strokes
          backgroundStrokeTopColor: mergedTextOptions.backgroundStrokeTopColor,
          backgroundStrokeTopWidth: mergedTextOptions.backgroundStrokeTopWidth || 0,
          backgroundStrokeBottomColor: mergedTextOptions.backgroundStrokeBottomColor,
          backgroundStrokeBottomWidth: mergedTextOptions.backgroundStrokeBottomWidth || 0,
          // Line height
          lineHeight: mergedTextOptions.lineHeight || 1.2
        };
        
        const smartResult = createSmartTextOverlay(smartLines, {
          width: PINTEREST_WIDTH,
          showBackground: showTextBackground,
          ...mappedSmartOptions,
          ...smartLayoutOptions // Allow explicit overrides
        });
        
        compositeLayers.push({
          input: smartResult.buffer,
          top: Math.floor((PINTEREST_HEIGHT - smartResult.height) / 2),
          left: 0
        });
      } else {
        // Regular single-block text overlay
        let textOverlayHeight = 150;
        let textResult = createTextOverlay(recipeTitle, {
          ...mergedTextOptions,
          width: PINTEREST_WIDTH,
          height: textOverlayHeight,
          showBackground: showTextBackground
        });

        // Expand height if needed
        if (textResult.needsMoreHeight) {
          textOverlayHeight = Math.min(textResult.requiredHeight, PINTEREST_HEIGHT * 0.4);
          textResult = createTextOverlay(recipeTitle, {
            ...mergedTextOptions,
            width: PINTEREST_WIDTH,
            height: textOverlayHeight,
            showBackground: showTextBackground
          });
        }

        compositeLayers.push({
          input: textResult.buffer,
          top: Math.floor((PINTEREST_HEIGHT - textOverlayHeight) / 2),
          left: 0
        });
      }
    }

    // Add title band
    if (titleBand && recipeTitle) {
      const band = createTitleBand(recipeTitle, titleBand.textOptions);
      compositeLayers.push({
        input: band.canvas.toBuffer('image/png'),
        top: titleBand.position?.y || imageHeight,
        left: 0
      });
    }

    // Add AI-generated category tags at the top
    if (generatedTags && generatedTags.length > 0) {
      const tagColors = ['#E60023', '#0073B1', '#7C3AED', '#DC2626', '#059669', '#EA580C', '#DB2777'];
      const tagSpacing = 20; // Space between tags
      const topMargin = 40; // Margin from top edge
      let currentX = 40; // Start from left with margin
      const tagY = topMargin; // Fixed Y position at top
      
      for (let i = 0; i < generatedTags.length; i++) {
        const tagText = generatedTags[i];
        const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];
        
        const tag = createTag({
          text: tagText.toUpperCase(),
          fontFamily: 'Montserrat',
          fontWeight: '700',
          fontSize: 42,
          textColor: '#FFFFFF',
          backgroundColor: randomColor,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 42,
          paddingRight: 42,
          borderRadius: 45
        });
        
        // Position tags horizontally at the top
        compositeLayers.push({
          input: tag.canvas.toBuffer('image/png'),
          top: tagY,
          left: currentX
        });
        
        currentX += tag.width + tagSpacing; // Move to the right for next tag
      }
    }

    // Add manual tags (if provided)
    const tagsToRender = topTags?.length > 0 ? topTags : (styleOverrides.topTags || []);
    
    for (const tagConfig of tagsToRender) {
      if (!tagConfig.text) continue;
      
      const tag = createTag(tagConfig);
      let x = tagConfig.position?.x ?? 24;
      const y = tagConfig.position?.y ?? 24;
      
      // Handle right-aligned position
      if (typeof x === 'string' && x.startsWith('right-')) {
        const offset = parseInt(x.replace('right-', ''));
        x = PINTEREST_WIDTH - tag.width - offset;
      }
      
      compositeLayers.push({
        input: tag.canvas.toBuffer('image/png'),
        top: y,
        left: x
      });
    }

    // Compose final image
    const finalImage = await sharp({
      create: {
        width: PINTEREST_WIDTH,
        height: PINTEREST_HEIGHT,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .composite(compositeLayers)
    .toBuffer();

    // Save file
    const timestamp = Date.now();
    const safeTitle = recipeTitle ? recipeTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'pinterest_pin';
    const filename = `${safeTitle}_${timestamp}.png`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, finalImage);
    
    const imageUrl = `http://localhost:${PORT}/uploads/pinterest-pins/${filename}`;
    console.log(`  ✅ Saved: ${filename}`);

    res.json({
      success: true,
      imageUrl,
      filename,
      dimensions: { width: PINTEREST_WIDTH, height: PINTEREST_HEIGHT },
      title: {
        original: toTitleCase(rawRecipeTitle),
        used: recipeTitle,
        wasShortened: titleWasShortened
      },
      smartLayout: smartLines ? {
        enabled: true,
        line1: smartLines.line1,
        line2: smartLines.line2,
        line3: smartLines.line3
      } : null,
      tags: generatedTags ? {
        generated: generatedTags,
        count: generatedTags.length
      } : null
    });

  } catch (error) {
    console.error('❌ Error creating pin:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: config.service.name,
    version: config.service.version,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/fonts - Get available fonts
 */
app.get('/api/fonts', (req, res) => {
  const fonts = Array.from(registeredFonts.values()).map(font => ({
    name: font.name,
    weights: [...new Set(font.weights)].sort(),
    isDisplayFont: font.isDisplayFont
  }));
  
  res.json({ fonts });
});

/**
 * GET /api/config - Get current configuration
 */
app.get('/api/config', (req, res) => {
  res.json({
    dimensions: {
      width: PINTEREST_WIDTH,
      height: PINTEREST_HEIGHT
    },
    defaults: config.defaults,
    limits: config.limits
  });
});

/**
 * GET /api/docs - API documentation
 */
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Pinterest Pin Generator API',
    version: config.service.version,
    endpoints: {
      'POST /api/create-pin': {
        description: 'Create a Pinterest-style pin',
        body: {
          topImageUrl: 'string (required)',
          bottomImageUrl: 'string (required)',
          recipeTitle: 'string (required if showTextOverlay is true)',
          showTextOverlay: 'boolean (default: true)',
          showTextBackground: 'boolean (default: true)',
          textOptions: {
            fontSize: `number (${config.limits.minFontSize}-${config.limits.maxFontSize})`,
            fontFamily: 'string',
            fontWeight: 'string (400, 700, 900)',
            textColor: 'string (hex)',
            backgroundColor: 'string (hex or rgba)',
            strokeColor: 'string (hex)',
            strokeWidth: 'number'
          },
          topTags: 'array of tag objects',
          titleBand: 'object with textOptions and position'
        }
      },
      'GET /api/health': 'Health check',
      'GET /api/fonts': 'Available fonts list',
      'GET /api/config': 'Current configuration'
    }
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`\n🚀 ${config.service.name} v${config.service.version}`);
  console.log(`   📍 http://localhost:${PORT}`);
  console.log(`   📖 Docs: http://localhost:${PORT}/api/docs`);
  console.log(`   📐 Pin size: ${PINTEREST_WIDTH}x${PINTEREST_HEIGHT}px\n`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  server.close(() => console.log('✅ Server closed'));
});

module.exports = app;
