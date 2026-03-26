const express = require('express');
const sharp = require('sharp');
const { createCanvas, registerFont } = require('canvas');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = require('./config.json');
const app = express();
const PORT = process.env.PORT || config.service.port || 3001;

// Pinterest pin dimensions from config
const PINTEREST_WIDTH = config.pinterest?.width || 1000;
const PINTEREST_HEIGHT = config.pinterest?.height || 2000;

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

/**
 * Auto-split a recipe title into 3 lines for Pinterest pin layout
 * Returns: { line1: "EASY QUESO", line2: "CHICKEN", line3: "ENCHILADAS" }
 */
function autoSplitTitle(title) {
  if (!title) return { line1: '', line2: '', line3: '' };
  
  // Clean up the title - remove common suffixes and clean punctuation
  let cleaned = title
    .replace(/[-–—:]/g, ' ')
    .replace(/\s+(recipe|recipes|dish|meal|dinner|lunch|breakfast|idea|ideas)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  
  const words = cleaned.split(' ').filter(w => w.length > 0);
  
  // Remove filler words for main keyword detection
  const fillerWords = ['THE', 'A', 'AN', 'WITH', 'AND', 'IN', 'ON', 'FOR', 'TO', 'OF', 'BEST', 'EASY', 'SIMPLE', 'QUICK', 'DELICIOUS', 'HOMEMADE', 'PERFECT', 'ULTIMATE'];
  
  // Food keywords that should be emphasized (line 2)
  const foodKeywords = ['CHICKEN', 'BEEF', 'PORK', 'FISH', 'SALMON', 'SHRIMP', 'PASTA', 'RICE', 'SOUP', 'STEW', 'SALAD', 'CAKE', 'PIE', 'BREAD', 'COOKIE', 'COOKIES', 'BOWL', 'TACOS', 'BURGER', 'PIZZA', 'CURRY', 'NOODLES', 'WINGS', 'RIBS', 'STEAK', 'ENCHILADAS', 'CASSEROLE', 'SANDWICH', 'WRAP', 'QUESADILLA', 'MEATBALLS', 'LASAGNA', 'CHILI', 'GNOCCHI', 'POTATOES', 'VEGETABLES'];
  
  // Find the main food keyword
  let mainKeywordIndex = -1;
  let mainKeyword = '';
  
  for (let i = 0; i < words.length; i++) {
    if (foodKeywords.includes(words[i])) {
      mainKeywordIndex = i;
      mainKeyword = words[i];
      break;
    }
  }
  
  let line1 = '', line2 = '', line3 = '';
  
  if (mainKeywordIndex >= 0) {
    // Found a food keyword - use it as line 2
    line1 = words.slice(0, mainKeywordIndex).join(' ');
    line2 = mainKeyword;
    line3 = words.slice(mainKeywordIndex + 1).join(' ');
    
    // If line1 is empty, try to move some words from line3
    if (!line1 && line3) {
      const line3Words = line3.split(' ');
      if (line3Words.length > 2) {
        line1 = line3Words.slice(0, Math.ceil(line3Words.length / 2)).join(' ');
        line3 = line3Words.slice(Math.ceil(line3Words.length / 2)).join(' ');
      }
    }
  } else {
    // No food keyword found - split by word count
    const totalWords = words.length;
    
    if (totalWords <= 2) {
      line2 = words.join(' ');
    } else if (totalWords <= 4) {
      line1 = words[0];
      line2 = words.slice(1, -1).join(' ');
      line3 = words[words.length - 1];
    } else {
      // Split roughly: 30% / 40% / 30%
      const line1Count = Math.max(1, Math.floor(totalWords * 0.3));
      const line3Count = Math.max(1, Math.floor(totalWords * 0.3));
      const line2Count = totalWords - line1Count - line3Count;
      
      line1 = words.slice(0, line1Count).join(' ');
      line2 = words.slice(line1Count, line1Count + line2Count).join(' ');
      line3 = words.slice(line1Count + line2Count).join(' ');
    }
  }
  
  console.log(`  📝 Auto-split: "${line1}" | "${line2}" | "${line3}"`);
  
  return { line1, line2, line3 };
}

/**
 * Auto-generate Pinterest tags based on recipe title keywords
 */
function autoGenerateTags(title, maxTags = 2) {
  if (!title) return [];
  
  const titleLower = title.toLowerCase();
  const tags = [];
  
  // Tag rules: keyword -> tag text
  const tagRules = [
    // Cooking method tags
    { keywords: ['air fryer', 'airfryer'], tag: 'AIR FRYER' },
    { keywords: ['instant pot', 'pressure cooker'], tag: 'INSTANT POT' },
    { keywords: ['slow cooker', 'crockpot', 'crock pot'], tag: 'SLOW COOKER' },
    { keywords: ['one pot', 'one-pot', 'onepot'], tag: 'ONE POT' },
    { keywords: ['sheet pan', 'sheet-pan'], tag: 'SHEET PAN' },
    { keywords: ['grilled', 'grill', 'bbq', 'barbecue'], tag: 'GRILLED' },
    { keywords: ['baked', 'roasted'], tag: 'OVEN BAKED' },
    { keywords: ['fried', 'crispy'], tag: 'CRISPY' },
    
    // Diet/health tags
    { keywords: ['healthy', 'light', 'low calorie', 'diet'], tag: 'HEALTHY' },
    { keywords: ['keto', 'low carb', 'low-carb'], tag: 'KETO' },
    { keywords: ['vegan'], tag: 'VEGAN' },
    { keywords: ['vegetarian', 'veggie'], tag: 'VEGETARIAN' },
    { keywords: ['gluten free', 'gluten-free'], tag: 'GLUTEN FREE' },
    { keywords: ['high protein', 'protein'], tag: 'HIGH PROTEIN' },
    
    // Time/ease tags
    { keywords: ['easy', 'simple', 'quick', '30 minute', '30-minute', '15 minute', '20 minute'], tag: 'EASY RECIPE' },
    { keywords: ['weeknight', 'week night', 'busy'], tag: 'WEEKNIGHT DINNER' },
    
    // Meal type tags
    { keywords: ['breakfast', 'brunch', 'morning'], tag: 'BREAKFAST' },
    { keywords: ['lunch', 'midday'], tag: 'LUNCH' },
    { keywords: ['dinner', 'supper'], tag: 'EASY DINNER' },
    { keywords: ['dessert', 'sweet', 'cake', 'cookie', 'pie'], tag: 'DESSERT' },
    { keywords: ['appetizer', 'starter', 'snack'], tag: 'APPETIZER' },
    { keywords: ['soup', 'stew', 'chili'], tag: 'COMFORT FOOD' },
    
    // Cuisine tags
    { keywords: ['italian', 'pasta', 'pizza', 'lasagna'], tag: 'ITALIAN' },
    { keywords: ['mexican', 'taco', 'enchilada', 'burrito', 'quesadilla'], tag: 'MEXICAN' },
    { keywords: ['asian', 'chinese', 'japanese', 'thai', 'korean'], tag: 'ASIAN' },
    { keywords: ['indian', 'curry', 'tikka', 'masala'], tag: 'INDIAN' },
    { keywords: ['american', 'burger', 'bbq'], tag: 'AMERICAN' },
    { keywords: ['mediterranean', 'greek'], tag: 'MEDITERRANEAN' },
    { keywords: ['nigerian', 'african', 'jollof'], tag: 'AFRICAN' },
    
    // Flavor tags
    { keywords: ['spicy', 'hot', 'chili', 'jalapeno', 'buffalo'], tag: 'SPICY' },
    { keywords: ['creamy', 'cheesy', 'cheese'], tag: 'CHEESY' },
    { keywords: ['garlic', 'garlicky'], tag: 'GARLIC LOVER' },
    { keywords: ['honey', 'sweet and'], tag: 'SWEET & SAVORY' },
    
    // Protein tags
    { keywords: ['chicken'], tag: 'CHICKEN RECIPE' },
    { keywords: ['beef', 'steak'], tag: 'BEEF RECIPE' },
    { keywords: ['pork', 'bacon'], tag: 'PORK RECIPE' },
    { keywords: ['fish', 'salmon', 'shrimp', 'seafood'], tag: 'SEAFOOD' }
  ];
  
  // Find matching tags
  for (const rule of tagRules) {
    if (tags.length >= maxTags) break;
    
    for (const keyword of rule.keywords) {
      if (titleLower.includes(keyword) && !tags.includes(rule.tag)) {
        tags.push(rule.tag);
        break;
      }
    }
  }
  
  // If no tags found, add generic ones
  if (tags.length === 0) {
    tags.push('EASY RECIPE');
  }
  if (tags.length < maxTags) {
    tags.push('TRY THIS!');
  }
  
  console.log(`  🏷️  Auto-tags: ${tags.join(', ')}`);
  
  return tags;
}

/**
 * Build tag objects for rendering
 */
function buildTagObjects(tagTexts, colors = null) {
  const defaultColors = ['#FF6B35', '#4CAF50', '#E60023', '#0073B1', '#7C3AED', '#059669'];
  const tagColors = colors || defaultColors;
  
  return tagTexts.map((text, index) => ({
    text: text,
    backgroundColor: tagColors[index % tagColors.length],
    textColor: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Montserrat',
    fontWeight: '700',
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
    borderRadius: 25,
    position: { x: 30 + (index * 200), y: 30 }
  }));
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
 * Create smart 3-line text overlay with different sizes
 * Auto-scales text to fit within canvas width
 */
function createSmartTextOverlay(lines, options = {}) {
  const {
    width = PINTEREST_WIDTH,
    line1FontSize = 70,
    line2FontSize = 120,
    line3FontSize = 80,
    line1FontFamily = 'Montserrat',
    line2FontFamily = 'Montserrat',
    line3FontFamily = 'Montserrat',
    line1FontWeight = '400',
    line2FontWeight = '900',
    line3FontWeight = '400',
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
    paddingLeft = 40,
    paddingRight = 40,
    lineSpacing = 10,
    // Background stroke options
    backgroundStrokeTopColor = '#000000',
    backgroundStrokeTopWidth = 0,
    backgroundStrokeBottomColor = '#000000',
    backgroundStrokeBottomWidth = 0,
    lineHeight = 1.2,
    minFontSize = 60 // Minimum font size for auto-scaling
  } = options;

  // Helper function to calculate font size that fits width
  const measureCanvas = createCanvas(width, 100);
  const measureCtx = measureCanvas.getContext('2d');
  const maxTextWidth = width - paddingLeft - paddingRight;
  
  function fitTextToWidth(text, targetFontSize, fontFamily, fontWeight) {
    if (!text) return targetFontSize;
    
    let fontSize = targetFontSize;
    measureCtx.font = buildFontString(fontSize, fontFamily, fontWeight);
    let textWidth = measureCtx.measureText(text).width;
    
    // Reduce font size until text fits
    while (textWidth > maxTextWidth && fontSize > minFontSize) {
      fontSize -= 2;
      measureCtx.font = buildFontString(fontSize, fontFamily, fontWeight);
      textWidth = measureCtx.measureText(text).width;
    }
    
    if (fontSize !== targetFontSize) {
      console.log(`  📏 Auto-scaled "${text.substring(0, 20)}..." from ${targetFontSize}px to ${fontSize}px`);
    }
    
    return fontSize;
  }
  
  // Calculate actual font sizes (auto-scaled to fit)
  const actualLine1FontSize = fitTextToWidth(lines.line1, line1FontSize, line1FontFamily, line1FontWeight);
  const actualLine2FontSize = fitTextToWidth(lines.line2, line2FontSize, line2FontFamily, line2FontWeight);
  const actualLine3FontSize = fitTextToWidth(lines.line3, line3FontSize, line3FontFamily, line3FontWeight);

  // Calculate total height needed with actual font sizes
  const line1Height = lines.line1 ? actualLine1FontSize * lineHeight : 0;
  const line2Height = lines.line2 ? actualLine2FontSize * lineHeight : 0;
  const line3Height = lines.line3 ? actualLine3FontSize * lineHeight : 0;
  
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

  // Draw Line 1 (small - top) - using auto-scaled font size
  if (lines.line1) {
    ctx.font = buildFontString(actualLine1FontSize, line1FontFamily, line1FontWeight);
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

  // Draw Line 2 (HUGE - middle) - using auto-scaled font size
  if (lines.line2) {
    ctx.font = buildFontString(actualLine2FontSize, line2FontFamily, line2FontWeight);
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

  // Draw Line 3 (medium - bottom) - using auto-scaled font size
  if (lines.line3) {
    ctx.font = buildFontString(actualLine3FontSize, line3FontFamily, line3FontWeight);
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
    lines: lines,
    actualFontSizes: {
      line1: actualLine1FontSize,
      line2: actualLine2FontSize,
      line3: actualLine3FontSize
    }
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/create-pin - Create a Pinterest pin
 * 
 * For smart 3-line layout, provide smartLayoutLines: { line1, line2, line3 }
 * Example:
 * {
 *   "topImageUrl": "...",
 *   "bottomImageUrl": "...",
 *   "recipeTitle": "My Recipe Title",
 *   "smartLayoutLines": {
 *     "line1": "EASY QUESO",
 *     "line2": "CHICKEN ENCHILADAS",
 *     "line3": "CHEESY BAKE"
 *   },
 *   "textOptions": { ... },
 *   "smartLayoutOptions": { line1FontSize: 80, line2FontSize: 150, ... }
 * }
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
      smartLayoutLines = null, // { line1: "...", line2: "...", line3: "..." }
      smartLayoutOptions = {}, // Options for smart layout (fonts, colors, sizes)
      autoSplit = true, // Auto-split title into 3 lines (default: true)
      autoTags = true, // Auto-generate tags (default: true)
      tagColors = null // Custom tag colors array
    } = req.body;

    // Validate required fields
    if (!topImageUrl || !bottomImageUrl) {
      return res.status(400).json({
        error: 'Missing required fields: topImageUrl and bottomImageUrl are required'
      });
    }

    // Process title
    let recipeTitle = toTitleCase(rawRecipeTitle);
    
    // Use smart layout lines if provided, otherwise auto-split
    let smartLines = null;
    if (smartLayoutLines && (smartLayoutLines.line1 || smartLayoutLines.line2 || smartLayoutLines.line3)) {
      // Use provided lines
      smartLines = {
        line1: (smartLayoutLines.line1 || '').toUpperCase(),
        line2: (smartLayoutLines.line2 || '').toUpperCase(),
        line3: (smartLayoutLines.line3 || '').toUpperCase()
      };
      console.log(`🎨 Smart layout (manual): "${smartLines.line1}" | "${smartLines.line2}" | "${smartLines.line3}"`);
    } else if (autoSplit && recipeTitle) {
      // Auto-split the title
      smartLines = autoSplitTitle(recipeTitle);
      console.log(`🎨 Smart layout (auto): "${smartLines.line1}" | "${smartLines.line2}" | "${smartLines.line3}"`);
    }
    
    // Auto-generate tags if not provided
    let tagsToUse = topTags;
    if ((!topTags || topTags.length === 0) && autoTags && recipeTitle) {
      const generatedTagTexts = autoGenerateTags(recipeTitle, 2);
      tagsToUse = buildTagObjects(generatedTagTexts, tagColors);
    }

    if (showTextOverlay && !recipeTitle && !smartLines) {
      return res.status(400).json({
        error: 'recipeTitle or smartLayoutLines is required when showTextOverlay is true'
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
    if (showTextOverlay && (recipeTitle || smartLines)) {
      // Use smart 3-line layout if available
      if (smartLines) {
        // DEBUG: Log incoming options
        console.log(`\n📊 DEBUG - Incoming textOptions:`, JSON.stringify(textOptions, null, 2));
        console.log(`📊 DEBUG - Incoming smartLayoutOptions:`, JSON.stringify(smartLayoutOptions, null, 2));
        console.log(`📊 DEBUG - Merged textOptions:`, JSON.stringify(mergedTextOptions, null, 2));
        
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
        
        const finalSmartOptions = {
          width: PINTEREST_WIDTH,
          showBackground: showTextBackground,
          ...mappedSmartOptions,
          ...smartLayoutOptions // Allow explicit overrides
        };
        
        // DEBUG: Log final options being used
        console.log(`📊 DEBUG - Final smart layout options:`);
        console.log(`   line1: size=${finalSmartOptions.line1FontSize}, family=${finalSmartOptions.line1FontFamily}, weight=${finalSmartOptions.line1FontWeight}`);
        console.log(`   line2: size=${finalSmartOptions.line2FontSize}, family=${finalSmartOptions.line2FontFamily}, weight=${finalSmartOptions.line2FontWeight}`);
        console.log(`   line3: size=${finalSmartOptions.line3FontSize}, family=${finalSmartOptions.line3FontFamily}, weight=${finalSmartOptions.line3FontWeight}`);
        console.log(`   background: ${finalSmartOptions.backgroundColor}`);
        console.log(`   strokes: top=${finalSmartOptions.backgroundStrokeTopWidth}px ${finalSmartOptions.backgroundStrokeTopColor}, bottom=${finalSmartOptions.backgroundStrokeBottomWidth}px ${finalSmartOptions.backgroundStrokeBottomColor}\n`);
        
        const smartResult = createSmartTextOverlay(smartLines, finalSmartOptions);
        
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

    // Add tags (auto-generated or manual)
    const tagsToRender = tagsToUse?.length > 0 ? tagsToUse : (styleOverrides.topTags || []);
    
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
    
    // Build URL from request host or BASE_URL env variable
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = process.env.BASE_URL || req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const baseUrl = host.startsWith('http') ? host : `${protocol}://${host}`;
    const imageUrl = `${baseUrl}/uploads/pinterest-pins/${filename}`;
    console.log(`  ✅ Saved: ${filename}`);

    res.json({
      success: true,
      imageUrl,
      filename,
      dimensions: { width: PINTEREST_WIDTH, height: PINTEREST_HEIGHT },
      title: recipeTitle ? {
        original: toTitleCase(rawRecipeTitle),
        used: recipeTitle
      } : null,
      smartLayout: smartLines ? {
        enabled: true,
        autoGenerated: !smartLayoutLines,
        line1: smartLines.line1,
        line2: smartLines.line2,
        line3: smartLines.line3
      } : null,
      tags: tagsToRender.length > 0 ? {
        count: tagsToRender.length,
        autoGenerated: !topTags || topTags.length === 0,
        texts: tagsToRender.map(t => t.text)
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

// Bind to 0.0.0.0 for container/Docker deployments
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 ${config.service.name} v${config.service.version}`);
  console.log(`   📍 http://${HOST}:${PORT}`);
  console.log(`   📖 Docs: http://${HOST}:${PORT}/api/docs`);
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
