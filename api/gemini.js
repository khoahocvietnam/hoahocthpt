// api/gemini.js - Sử dụng Gemini 2.5 Flash Lite
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

  if (!GEMINI_API_KEY) {
    console.error('MISSING API KEY');
    return res.status(500).json({ 
      error: 'API key chưa được cấu hình',
      reply: '⚠️ Chưa cấu hình API Key. Vui lòng thêm GEMINI_API_KEY vào Environment Variables trên Vercel.'
    });
  }

  // Prompt chuyên về Hóa học
  const prompt = `Bạn là trợ lý AI chuyên về Hóa học, hỗ trợ học sinh THPT (lớp 10, 11, 12). 
Hãy trả lời câu hỏi sau một cách chi tiết, dễ hiểu, có giải thích rõ ràng.
- Nếu là bài tập tính toán, hướng dẫn phương pháp giải và đưa ra đáp số.
- Nếu là câu hỏi lý thuyết, giải thích ngắn gọn nhưng đầy đủ.
- Nếu là cân bằng phương trình, viết phương trình cân bằng và giải thích.
Trả lời bằng tiếng Việt.

Câu hỏi: ${message}

Trả lời:`;

  // Danh sách các model Gemini 2.5 và 2.0
  const models = [
    'gemini-2.5-flash-lite-preview-04-09',  // Gemini 2.5 Flash Lite (mới nhất)
    'gemini-2.5-flash-lite',                 // Gemini 2.5 Flash Lite
    'gemini-2.0-flash-lite',                 // Gemini 2.0 Flash Lite
    'gemini-1.5-flash',                      // Fallback: Gemini 1.5 Flash
    'gemini-1.5-pro'                         // Fallback cuối cùng
  ];

  async function callGemini(model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
        }
      })
    });
    
    const data = await response.json();
    return { response, data };
  }

  try {
    console.log('Calling Gemini API with models...');
    let lastError = null;
    
    // Thử từng model
    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
      try {
        const { response, data } = await callGemini(model);
        
        if (response.ok) {
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            console.log(`✅ Success with model: ${model}`);
            return res.status(200).json({ reply });
          }
        } else {
          console.log(`❌ Model ${model} failed: ${data.error?.message || 'Unknown error'}`);
          lastError = data.error?.message;
        }
      } catch (err) {
        console.log(`❌ Model ${model} error: ${err.message}`);
        lastError = err.message;
      }
    }
    
    // Nếu tất cả model đều thất bại
    console.error('All models failed. Last error:', lastError);
    return res.status(500).json({ 
      error: 'All models failed',
      reply: `❌ Không thể kết nối đến Gemini API. Lỗi: ${lastError || 'Vui lòng thử lại sau'}`
    });
    
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: error.message,
      reply: '❌ Đã có lỗi xảy ra. Vui lòng thử lại sau!'
    });
  }
}
