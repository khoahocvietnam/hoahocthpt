// api/gemini.js - Phiên bản đơn giản để test
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Lấy API key từ environment
  const API_KEY = process.env.GEMINI_API_KEY;

  // KIỂM TRA API KEY CÓ TỒN TẠI KHÔNG
  if (!API_KEY) {
    console.log('ERROR: GEMINI_API_KEY not found in environment');
    return res.status(500).json({ 
      error: 'API key not configured',
      debug: 'GEMINI_API_KEY is missing from environment variables'
    });
  }

  console.log('API Key exists, calling Gemini...');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();
    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      return res.status(500).json({ 
        error: data.error?.message || 'Gemini API error',
        details: data
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
