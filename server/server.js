import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 8080; // This is the fix for the port error
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '10mb' }));

// API Proxy for the front-end to call securely
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server.' });
  }

  try {
    const { model, contents, config } = req.body;
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { contents, generationConfig: config },
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(geminiResponse.data);
  } catch (error) {
    const errData = error.response?.data?.error || {};
    console.error('Error proxying to Gemini API:', errData.message);
    res.status(errData.code || 500).json({ error: errData.message || 'Internal Server Error' });
  }
});

// Serve the built React application files
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});