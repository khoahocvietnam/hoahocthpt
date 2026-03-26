// api/gemini.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Xử lý preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
  }

  // Lấy API key từ environment variables
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // Kiểm tra API key
  if (!GEMINI_API_KEY) {
    console.error('MISSING API KEY');
    return res.status(500).json({ 
      error: 'API key chưa được cấu hình',
      reply: '⚠️ Chưa cấu hình API Key. Vui lòng thêm GEMINI_API_KEY vào Environment Variables trên Vercel.'
    });
  }

  const prompt = `Bạn là trợ lý AI chuyên về Hóa học, hỗ trợ học sinh THPT (lớp 10, 11, 12). 
Hãy trả lời câu hỏi sau một cách chi tiết, dễ hiểu, có giải thích rõ ràng.
Trả lời bằng tiếng Việt.

Câu hỏi: ${message}

Trả lời:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(500).json({ 
        error: data.error?.message || 'Gemini API error',
        reply: '❌ Lỗi từ Gemini API. Vui lòng thử lại sau.'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi chưa có câu trả lời.';
    
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: error.message,
      reply: '❌ Đã có lỗi xảy ra. Vui lòng thử lại sau!'
    });
  }
}
