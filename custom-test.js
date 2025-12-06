// Manual test script - you can modify this and run it
const axios = require('axios');
const fs = require('fs');

async function customTest() {
  try {
    // Customize these values for your test
    const pinData = {
      topImageUrl: 'https://picsum.photos/600/400?random=10',
      bottomImageUrl: 'https://picsum.photos/600/400?random=11', 
      recipeTitle: 'Your Custom Recipe Title Here',
      textOptions: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)', // White background with 70% opacity
        textColor: '#000000', // Black text
        fontSize: 48,
        fontFamily: 'Impact',
        fontWeight: 'bold',
        strokeColor: '#ffffff',
        strokeWidth: 3
      }
    };

    console.log('🎨 Creating custom pin...');
    
    const response = await axios.post('http://localhost:3001/api/create-pin', pinData, {
      responseType: 'arraybuffer'
    });

    fs.writeFileSync('my-custom-pin.png', response.data);
    console.log('✅ Custom pin saved as my-custom-pin.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the custom test
customTest();
