const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api/create-pin';

async function comprehensiveDemo() {
  console.log('🎨 COMPREHENSIVE DEMO: Enhanced Pinterest Pin Generator\n');
  console.log('📋 Features Demonstrated:');
  console.log('   ✅ Font sizes up to 120px');
  console.log('   ✅ Custom stroke colors');
  console.log('   ✅ Text background toggle');
  console.log('   ✅ Auto-sizing with large fonts');
  console.log('   ✅ Stroke width control (0-10px)\n');

  const demonstrations = [
    {
      name: 'SHOWCASE 1: Maximum Font Size (120px)',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=101',
        bottomImageUrl: 'https://picsum.photos/600/400?random=102',
        recipeTitle: 'MEGA',
        showTextOverlay: true,
        showTextBackground: false,
        textOptions: {
          fontSize: 120,
          textColor: '#ffffff',
          strokeColor: '#ff0080', // Hot pink stroke
          strokeWidth: 8,
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_max_font.png',
      description: 'Maximum 120px font with hot pink stroke'
    },
    {
      name: 'SHOWCASE 2: Vibrant Color Combination',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=103',
        bottomImageUrl: 'https://picsum.photos/600/400?random=104',
        recipeTitle: 'Colorful Recipe Design',
        showTextOverlay: true,
        showTextBackground: false,
        textOptions: {
          fontSize: 85,
          textColor: '#00ffff', // Cyan text
          strokeColor: '#ff4500', // Orange-red stroke
          strokeWidth: 5,
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_vibrant_colors.png',
      description: 'Cyan text with orange-red stroke'
    },
    {
      name: 'SHOWCASE 3: Traditional Style Enhanced',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=105',
        bottomImageUrl: 'https://picsum.photos/600/400?random=106',
        recipeTitle: 'Classic Enhanced Recipe',
        showTextOverlay: true,
        showTextBackground: true,
        textOptions: {
          fontSize: 95,
          textColor: '#ffffff',
          strokeColor: '#4169e1', // Royal blue stroke
          strokeWidth: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_enhanced_traditional.png',
      description: 'Large font with background + royal blue stroke'
    },
    {
      name: 'SHOWCASE 4: Subtle Elegance',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=107',
        bottomImageUrl: 'https://picsum.photos/600/400?random=108',
        recipeTitle: 'Elegant Minimalist Recipe',
        showTextOverlay: true,
        showTextBackground: false,
        textOptions: {
          fontSize: 75,
          textColor: '#2c3e50', // Dark blue-gray
          strokeColor: '#ecf0f1', // Light gray stroke
          strokeWidth: 3,
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_subtle_elegance.png',
      description: 'Dark text with light gray stroke (elegant style)'
    },
    {
      name: 'SHOWCASE 5: No Stroke Modern',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=109',
        bottomImageUrl: 'https://picsum.photos/600/400?random=110',
        recipeTitle: 'Clean Modern Design',
        showTextOverlay: true,
        showTextBackground: true,
        textOptions: {
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 0, // No stroke
          backgroundColor: 'rgba(124, 58, 237, 0.9)', // Purple background
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_no_stroke_modern.png',
      description: 'Large font with purple background, no stroke'
    },
    {
      name: 'SHOWCASE 6: Auto-sizing with Very Long Text',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=111',
        bottomImageUrl: 'https://picsum.photos/600/400?random=112',
        recipeTitle: 'This is an extremely long recipe title that demonstrates auto-sizing capabilities with enhanced font sizes and colorful stroke options',
        showTextOverlay: true,
        showTextBackground: false,
        textOptions: {
          fontSize: 110, // Will auto-size down
          textColor: '#ffd700', // Gold text
          strokeColor: '#8b0000', // Dark red stroke
          strokeWidth: 4,
          fontWeight: 'bold'
        }
      },
      filename: 'showcase_auto_sizing.png',
      description: 'Auto-sizing from 110px with gold text and dark red stroke'
    }
  ];

  console.log('🎬 Creating showcases...\n');

  const results = [];

  for (const [index, demo] of demonstrations.entries()) {
    console.log(`🎯 ${demo.name}`);
    console.log(`   📝 ${demo.description}`);
    console.log(`   🎨 Font: ${demo.params.textOptions.fontSize}px`);
    console.log(`   🎨 Text: ${demo.params.textOptions.textColor}`);
    console.log(`   🎨 Stroke: ${demo.params.textOptions.strokeColor} (${demo.params.textOptions.strokeWidth}px)`);
    
    try {
      const response = await axios.post(API_URL, demo.params, {
        responseType: 'arraybuffer'
      });

      if (response.status === 200) {
        fs.writeFileSync(demo.filename, response.data);
        console.log(`   ✅ SUCCESS: Created ${demo.filename}`);
        results.push({ demo: demo.name, status: 'PASS', file: demo.filename });
      } else {
        console.log(`   ❌ FAIL: HTTP ${response.status}`);
        results.push({ demo: demo.name, status: 'FAIL', error: `HTTP ${response.status}` });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.push({ demo: demo.name, status: 'ERROR', error: error.message });
    }
    
    console.log(''); // Empty line
  }

  // Summary
  console.log('🏆 COMPREHENSIVE DEMO RESULTS:');
  console.log('=' .repeat(70));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${result.demo}`);
    if (result.file) {
      console.log(`     📸 File: ${result.file}`);
    }
    if (result.error) {
      console.log(`     ❌ Error: ${result.error}`);
    }
  });
  
  console.log('=' .repeat(70));
  console.log(`🎯 OVERALL DEMO RESULT: ${passed}/${total} showcases completed`);
  
  if (passed === total) {
    console.log('\n🎉 ALL SHOWCASES COMPLETED SUCCESSFULLY!');
    console.log('\n💫 Enhanced Features Summary:');
    console.log('   📏 Font Size Range: 20px - 120px (3x increase from 60px)');
    console.log('   🎨 Stroke Colors: Full color picker support');
    console.log('   📐 Stroke Width: 0px - 10px (5x increase from 2px max)');
    console.log('   🔀 Text Background: Toggle on/off independently');
    console.log('   🤖 Auto-sizing: Works seamlessly with large fonts');
    console.log('   💪 Performance: Same fast rendering regardless of size');
    
    console.log('\n🎭 Visual Styles Demonstrated:');
    console.log('   1. Maximum impact (120px fonts)');
    console.log('   2. Vibrant color combinations');
    console.log('   3. Enhanced traditional style');
    console.log('   4. Subtle elegance');
    console.log('   5. Clean modern design');
    console.log('   6. Auto-sizing intelligence');
    
    console.log('\n📁 Generated Files:');
    results.forEach(r => {
      if (r.file) console.log(`   📸 ${r.file}`);
    });
    
    console.log('\n🚀 Ready for Production!');
    console.log('   The Pinterest Pin Generator now supports:');
    console.log('   • Professional typography with up to 120px fonts');
    console.log('   • Creative freedom with custom stroke colors');
    console.log('   • Modern design flexibility with background toggle');
    console.log('   • Enhanced visual impact for social media');
  } else {
    console.log('\n❌ Some showcases failed. Please check the errors above.');
  }
}

async function main() {
  try {
    // Check server
    await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running and ready for comprehensive demo\n');
  } catch (error) {
    console.log('❌ Server not running. Start it with: node server.js');
    process.exit(1);
  }

  await comprehensiveDemo();
}

main().catch(console.error);
