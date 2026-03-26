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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
  }

  // Lấy API key từ environment variables (BẢO MẬT)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    console.error('Missing API key');
    return res.status(500).json({ 
      error: 'Chưa cấu hình API Key',
      reply: '⚠️ API Key chưa được cấu hình. Vui lòng liên hệ quản trị viên để cài đặt API Key trên Vercel.'
    });
  }

  // Prompt chuyên về Hóa học
  const prompt = `Bạn là trợ lý AI chuyên về Hóa học, hỗ trợ học sinh THPT (lớp 10, 11, 12). 
  Hãy trả lời câu hỏi sau một cách chi tiết, dễ hiểu, có giải thích rõ ràng.
  Nếu là bài tập, hướng dẫn phương pháp giải.
  Nếu là lý thuyết, trình bày ngắn gọn đầy đủ.
  Trả lời bằng tiếng Việt.

  Câu hỏi: ${message}

  Trả lời:`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(500).json({ 
        error: 'Lỗi từ Gemini API',
        reply: 'Xin lỗi, API đang gặp vấn đề. Vui lòng thử lại sau!'
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi chưa có câu trả lời cho câu hỏi này.';

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Lỗi server',
      reply: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!'
    });
  }
}
