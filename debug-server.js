// Quick debug test for server crash
const express = require('express');
const app = express();

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

app.use(express.json());

const canvaService = require('./canvaService');

app.post('/test', async (req, res) => {
  try {
    console.log('Request received:', req.body);
    
    // Test basic functionality
    console.log('canvaService.createPinterestPin exists:', typeof canvaService.createPinterestPin);
    
    res.json({ success: true, message: 'Test passed' });
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server running on http://localhost:${PORT}`);
});
