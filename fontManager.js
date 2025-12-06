const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { registerFont } = require('canvas');

const FONTS_DIR = path.join(__dirname, 'fonts');
const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css2';

// Ensure fonts directory exists
if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true });
}

// Cache of registered fonts to avoid re-registering
const registeredFonts = new Set();

/**
 * Get Google Font CSS URL
 */
function getGoogleFontUrl(fontFamily, weights = [400, 700]) {
  const familyParam = fontFamily.replace(/ /g, '+');
  const weightsParam = weights.join(';');
  return `${GOOGLE_FONTS_API}?family=${familyParam}:wght@${weightsParam}&display=swap`;
}

/**
 * Extract font file URL from Google Fonts CSS
 */
async function extractFontFileUrl(fontFamily, weight = 400) {
  try {
    const cssUrl = getGoogleFontUrl(fontFamily, [weight]);
    const response = await axios.get(cssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const css = response.data;
    
    // Extract TTF font URL from CSS
    const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
    
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    
    throw new Error(`Could not extract font URL for ${fontFamily}`);
  } catch (error) {
    throw new Error(`Failed to fetch font CSS: ${error.message}`);
  }
}

/**
 * Download font file from Google Fonts
 */
async function downloadFont(fontFamily, weight = 400) {
  try {
    const fontUrl = await extractFontFileUrl(fontFamily, weight);
    const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
    
    const fontFileName = `${fontFamily.replace(/ /g, '_')}_${weight}.ttf`;
    const fontPath = path.join(FONTS_DIR, fontFileName);
    
    fs.writeFileSync(fontPath, response.data);
    
    return fontPath;
  } catch (error) {
    throw new Error(`Failed to download font: ${error.message}`);
  }
}

/**
 * Map font weight to proper Canvas weight value
 */
function mapFontWeight(weight) {
  const weightMap = {
    '100': 'Thin',
    '200': 'ExtraLight', 
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black',
    'normal': 'Regular',
    'bold': 'Bold',
    'bolder': 'ExtraBold',
    'lighter': 'Light'
  };
  
  return weightMap[weight.toString()] || 'Regular';
}

/**
 * Get or download and register a Google Font
 */
async function getFont(fontFamily, weight = 400) {
  // Use original font name for file operations (may have spaces)
  const originalFontName = fontFamily;
  // Use safe name for Canvas registration (no spaces)
  const safeFontFamily = fontFamily.replace(/\s+/g, '');
  const fontKey = `${safeFontFamily}_${weight}`;
  
  // Check if already registered
  if (registeredFonts.has(fontKey)) {
    return safeFontFamily;
  }
  
  // Font files are saved with underscores instead of spaces
  const fontFileName = `${originalFontName.replace(/\s+/g, '_')}_${weight}.ttf`;
  const fontPath = path.join(FONTS_DIR, fontFileName);
  
  // Check if font file exists locally
  if (!fs.existsSync(fontPath)) {
    console.log(`📥 Downloading Google Font: ${originalFontName} (weight: ${weight})...`);
    await downloadFont(originalFontName, weight);
    console.log(`✅ Downloaded: ${originalFontName}`);
  }
  
  // Register the font with Canvas using safe name (no spaces)
  try {
    const mappedWeight = mapFontWeight(weight);
    
    // Only register with the safe name (no spaces) to avoid Pango issues
    registerFont(fontPath, { 
      family: safeFontFamily, 
      weight: mappedWeight,
      style: 'normal'
    });
    
    registeredFonts.add(fontKey);
    console.log(`✅ Registered font: ${safeFontFamily} (${mappedWeight})`);
    
    // Return the safe font name for use in Canvas
    return safeFontFamily;
  } catch (error) {
    throw new Error(`Failed to register font: ${error.message}`);
  }
}

/**
 * Check if a font is a system font (fallback to system fonts)
 */
function isSystemFont(fontFamily) {
  const systemFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Courier New',
    'Palatino', 'Garamond', 'Bookman', 'Arial Black'
  ];
  
  return systemFonts.includes(fontFamily);
}

/**
 * Convert fontWeight string/number to numeric weight
 */
function normalizeWeight(weight) {
  if (typeof weight === 'number') return weight;
  
  const weightMap = {
    'thin': 100,
    'extralight': 200,
    'light': 300,
    'normal': 400,
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'extrabold': 800,
    'black': 900,
    'bolder': 700,
    'lighter': 300
  };
  
  const normalized = weightMap[weight.toString().toLowerCase()];
  return normalized || 400;
}

/**
 * Get font with automatic fallback
 * - System fonts: use directly
 * - Google Fonts: download and register
 */
async function getFontWithFallback(fontFamily, weight = 400) {
  // Normalize weight to numeric value
  const numericWeight = normalizeWeight(weight);
  
  // If it's a system font, return as-is
  if (isSystemFont(fontFamily)) {
    return fontFamily;
  }
  
  // Try to get Google Font
  try {
    return await getFont(fontFamily, numericWeight);
  } catch (error) {
    console.warn(`⚠️ Could not load font "${fontFamily}", falling back to Arial`);
    return 'Arial'; // Fallback to Arial
  }
}

/**
 * Pre-download popular fonts for faster first use
 */
async function preloadPopularFonts() {
  const popularFonts = [
    { name: 'Montserrat', weights: [400, 700] },
    { name: 'Roboto', weights: [400, 700] },
    { name: 'Open Sans', weights: [400, 700] },
    { name: 'Lato', weights: [400, 700] },
    { name: 'Playfair Display', weights: [400, 700] },
    { name: 'Bebas Neue', weights: [400] }
  ];
  
  console.log('📥 Preloading popular Google Fonts...');
  
  for (const font of popularFonts) {
    for (const weight of font.weights) {
      try {
        await getFont(font.name, weight);
      } catch (error) {
        console.warn(`⚠️ Could not preload ${font.name} (${weight}):`, error.message);
      }
    }
  }
  
  console.log('✅ Popular fonts preloaded');
}

/**
 * List all downloaded fonts
 */
function listDownloadedFonts() {
  if (!fs.existsSync(FONTS_DIR)) {
    return [];
  }
  
  return fs.readdirSync(FONTS_DIR)
    .filter(file => file.endsWith('.ttf'))
    .map(file => {
      const match = file.match(/(.+)_(\d+)\.ttf/);
      if (match) {
        return {
          family: match[1].replace(/_/g, ' '),
          weight: parseInt(match[2]),
          file: file
        };
      }
      return null;
    })
    .filter(Boolean);
}

module.exports = {
  getFont,
  getFontWithFallback,
  isSystemFont,
  preloadPopularFonts,
  listDownloadedFonts,
  FONTS_DIR
};
