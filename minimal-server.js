// Minimal test server
const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ status: 'ok' });
});

const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server on http://0.0.0.0:${PORT}`);
  console.log(`Also available at http://localhost:${PORT}`);
  console.log('Server is running and ready to accept connections');
});
