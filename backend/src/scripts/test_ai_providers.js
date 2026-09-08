require('dotenv').config();

async function testProvider(name, fn) {
  try {
    const start = Date.now();
    const res = await fn();
    console.log(`✅ [${name}] SUCCESS in ${Date.now() - start}ms:`, (res || '').slice(0, 100).replace(/\n/g, ' '));
    return true;
  } catch (err) {
    console.log(`❌ [${name}] FAILED:`, err.message);
    return false;
  }
}

async function run() {
  console.log('Testing Multi-Agent API Keys from .env...\n');
  
  // 1. DeepSeek 1
  await testProvider('DeepSeek 1 (deepseek-chat)', async () => {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 30
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  });

  // 2. DeepSeek 2
  await testProvider('DeepSeek 2 (deepseek-chat)', async () => {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY_2}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 30
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  });

  // 3. Grok 1 (xAI)
  await testProvider('Grok 1 (x.ai grok-2-latest)', async () => {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 30
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  });

  // 4. Grok 2 (xAI)
  await testProvider('Grok 2 (x.ai grok-2)', async () => {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY_2}`
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 30
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  });

  // 5. Groq Cloud (Llama 3.3 70B)
  await testProvider('Groq Cloud (Llama 3.3 70B)', async () => {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 30
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  });

  // 6. Gemini 1
  await testProvider('Gemini 1 (gemini-3.1-flash-lite)', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const res = await model.generateContent('Say hello in 5 words');
    return res.response.text();
  });

  // 7. Gemini 2
  await testProvider('Gemini 2 (gemini-3.1-flash-lite)', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const res = await model.generateContent('Say hello in 5 words');
    return res.response.text();
  });
}

run();
