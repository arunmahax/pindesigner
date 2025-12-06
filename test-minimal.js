const axios = require('axios');

async function testMinimalServer() {
  console.log('Waiting 2 seconds for server to fully start...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    console.log('Sending request...');
    const response = await axios.get('http://localhost:8000/test');
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMinimalServer();
