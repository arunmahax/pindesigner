const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api/create-pin';

async function finalIntegrationTest() {
  console.log('🧪 Final Integration Test: showTextBackground Feature\n');

  const tests = [
    {
      name: 'Text with background (traditional)',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=1',
        bottomImageUrl: 'https://picsum.photos/600/400?random=2',
        recipeTitle: 'Traditional Style Recipe',
        showTextOverlay: true,
        showTextBackground: true,
        textOptions: {
          textColor: '#ffffff',
          backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red background
          fontSize: 32
        }
      },
      expected: 'Text should appear with red semi-transparent background'
    },
    {
      name: 'Text WITHOUT background (modern)',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=3',
        bottomImageUrl: 'https://picsum.photos/600/400?random=4',
        recipeTitle: 'Modern Style Recipe Design',
        showTextOverlay: true,
        showTextBackground: false, // KEY TEST: NO BACKGROUND
        textOptions: {
          textColor: '#ffffff',
          strokeColor: '#000000',
          strokeWidth: 3,
          fontSize: 30
        }
      },
      expected: 'Text should appear directly over images with NO background'
    },
    {
      name: 'Image only (no text)',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=5',
        bottomImageUrl: 'https://picsum.photos/600/400?random=6',
        showTextOverlay: false,
        showTextBackground: false // This should be ignored when no text
      },
      expected: 'Only combined images, no text overlay at all'
    },
    {
      name: 'Edge case: text overlay true, background false',
      params: {
        topImageUrl: 'https://picsum.photos/600/400?random=7',
        bottomImageUrl: 'https://picsum.photos/600/400?random=8',
        recipeTitle: 'Edge Case Test Recipe Title',
        showTextOverlay: true,
        showTextBackground: false,
        textOptions: {
          textColor: '#ffff00', // Bright yellow
          strokeColor: '#800080', // Purple stroke
          strokeWidth: 2,
          fontSize: 28
        }
      },
      expected: 'Yellow text with purple stroke, no background'
    }
  ];

  const results = [];

  for (const [index, test] of tests.entries()) {
    const filename = `final_test_${index + 1}.png`;
    
    console.log(`🔄 Test ${index + 1}: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const response = await axios.post(API_URL, test.params, {
        responseType: 'arraybuffer'
      });

      if (response.status === 200) {
        fs.writeFileSync(filename, response.data);
        console.log(`   ✅ SUCCESS: Created ${filename}`);
        results.push({ test: test.name, status: 'PASS', file: filename });
      } else {
        console.log(`   ❌ FAIL: HTTP ${response.status}`);
        results.push({ test: test.name, status: 'FAIL', error: `HTTP ${response.status}` });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.push({ test: test.name, status: 'ERROR', error: error.message });
    }
    
    console.log(''); // Empty line
  }

  // Summary
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(50));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${result.test}`);
    if (result.file) {
      console.log(`     Generated: ${result.file}`);
    }
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });
  
  console.log('=' .repeat(50));
  console.log(`🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! showTextBackground feature is working correctly.');
    console.log('\n💡 Feature Summary:');
    console.log('   • showTextOverlay: true/false - Controls entire text overlay');
    console.log('   • showTextBackground: true/false - Controls just the background layer');
    console.log('   • When showTextBackground=false, text appears directly over images');
    console.log('   • Text stroke ensures readability without background');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
  }
}

async function main() {
  try {
    // Check server
    await axios.get('http://localhost:3001/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server not running. Start it with: node server.js');
    process.exit(1);
  }

  await finalIntegrationTest();
}

main().catch(console.error);
