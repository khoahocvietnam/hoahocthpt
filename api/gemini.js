// api/gemini.js
export default async function handler(req, res) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
  }

  // Lấy API key từ environment variables (bảo mật)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key chưa được cấu hình' });
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
    // Gọi API Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
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
        error: 'Lỗi API Gemini', 
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
