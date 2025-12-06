const axios = require('axios');

async function testCanvaEndpoint() {
  try {
    console.log('🧪 Testing Canva endpoint...\n');
    
    const response = await axios.post('http://127.0.0.1:3001/api/create-pin-with-canva', {
      topImageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
      bottomImageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      recipeTitle: 'CREAMY TOMATO PASTA',
      accessToken: 'jaqjBFAIAIYErSJg-qDG_FMXIFdxCErvHdBIv28Fh05srxlFkA8MdQwUal8eI0eAFEb8zYZScyNPGqrGYf9Wl-q2Y154dPZNmSVhZL3vMWxfaGE1Lr6IM2YuF_fvxLpW'
    });
    
    console.log('✅ Success!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error occurred:\n');
    
    if (error.response) {
      // Server responded with error status
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
      console.error('Request:', error.request);
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

testCanvaEndpoint();
