const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api/create-pin';

// Test with different image types for contrast demonstration
const TEST_IMAGES = {
  bright: 'https://picsum.photos/600/400?random=10', // Bright image
  dark: 'https://picsum.photos/600/400?random=20'   // Different dark image
};

async function demonstrateTextBackgroundOption() {
  console.log('🎨 Demonstrating Text Background Toggle Feature\n');

  const demonstrations = [
    {
      name: 'COMPARISON: White text with black background vs no background',
      tests: [
        {
          filename: 'demo_with_background.png',
          params: {
            topImageUrl: TEST_IMAGES.bright,
            bottomImageUrl: TEST_IMAGES.dark,
            recipeTitle: 'Amazing Recipe Title',
            showTextOverlay: true,
            showTextBackground: true,
            textOptions: {
              textColor: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              fontSize: 36,
              strokeWidth: 2,
              strokeColor: '#000000'
            }
          }
        },
        {
          filename: 'demo_no_background.png',
          params: {
            topImageUrl: TEST_IMAGES.bright,
            bottomImageUrl: TEST_IMAGES.dark,
            recipeTitle: 'Amazing Recipe Title',
            showTextOverlay: true,
            showTextBackground: false, // NO BACKGROUND
            textOptions: {
              textColor: '#ffffff',
              fontSize: 36,
              strokeWidth: 4, // Thicker stroke for better contrast
              strokeColor: '#000000'
            }
          }
        }
      ]
    },
    {
      name: 'COMPARISON: Bright yellow text with vs without background',
      tests: [
        {
          filename: 'demo_yellow_with_bg.png',
          params: {
            topImageUrl: TEST_IMAGES.bright,
            bottomImageUrl: TEST_IMAGES.dark,
            recipeTitle: 'Bright & Bold Recipe',
            showTextOverlay: true,
            showTextBackground: true,
            textOptions: {
              textColor: '#ffff00',
              backgroundColor: 'rgba(128, 0, 128, 0.7)', // Purple background
              fontSize: 32
            }
          }
        },
        {
          filename: 'demo_yellow_no_bg.png',
          params: {
            topImageUrl: TEST_IMAGES.bright,
            bottomImageUrl: TEST_IMAGES.dark,
            recipeTitle: 'Bright & Bold Recipe',
            showTextOverlay: true,
            showTextBackground: false, // NO BACKGROUND
            textOptions: {
              textColor: '#ffff00', // Bright yellow
              fontSize: 32,
              strokeWidth: 3,
              strokeColor: '#000000'
            }
          }
        }
      ]
    }
  ];

  for (const demo of demonstrations) {
    console.log(`🎯 ${demo.name}`);
    
    for (const test of demo.tests) {
      console.log(`  📸 Creating: ${test.filename}`);
      
      try {
        const response = await axios.post(API_URL, test.params, {
          responseType: 'arraybuffer'
        });

        if (response.status === 200) {
          fs.writeFileSync(test.filename, response.data);
          console.log(`  ✅ Success: ${test.filename}`);
        } else {
          console.log(`  ❌ Failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.response?.data || error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎯 Demo Results:');
  console.log('✅ demo_with_background.png - Traditional text with background');
  console.log('✅ demo_no_background.png - Modern text overlay without background');
  console.log('✅ demo_yellow_with_bg.png - Colorful text with purple background');
  console.log('✅ demo_yellow_no_bg.png - Bold yellow text directly over images');
  console.log('\n💡 Key Benefits of showTextBackground=false:');
  console.log('  • More modern, minimalist design');
  console.log('  • Text integrates naturally with images');
  console.log('  • Better for artistic/creative layouts');
  console.log('  • Text stroke ensures readability');
  console.log('\n📋 Best Practices:');
  console.log('  • Use strong stroke colors for contrast');
  console.log('  • Choose text colors that complement your images');
  console.log('  • Test readability with different image backgrounds');
}

async function main() {
  console.log('📋 Text Background Toggle Demonstration\n');
  
  try {
    const healthCheck = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server not running. Please start it with: node server.js\n');
    process.exit(1);
  }

  await demonstrateTextBackgroundOption();
}

main().catch(console.error);
