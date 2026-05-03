import 'dotenv/config';

async function testGrokAPI() {
  console.log('🧪 Iniciando pruebas del chatbot Gaia...\n');

  const API_KEY = process.env.GROK_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ ERROR: GROK_API_KEY no está configurada en .env');
    return;
  }

  console.log('✅ API Key encontrada:', API_KEY.substring(0, 10) + '...');

  // Test 1: Verificar disponibilidad de la API
  console.log('\n📡 Test 1: Verificando disponibilidad de API de Groq');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: 'Eres Gaia, la diosa ambientalista. Responde siempre en español.' 
          },
          { 
            role: 'user', 
            content: 'Hola' 
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 50
      })
    });

    clearTimeout(timeoutId);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en API de Groq: ${response.status}`);
      console.error('Respuesta:', errorText.substring(0, 200));
      console.error('\n⚠️ Posibles problemas:');
      console.error('- API key inválida o expirada');
      console.error('- Modelo no disponible');
      console.error('- Límite de cuota alcanzado');
      return;
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('❌ Respuesta inválida de Grok:');
      console.error(JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ API de Groq funcionando correctamente');
    console.log('Respuesta:', data.choices[0].message.content.substring(0, 100));

  } catch (error: any) {
    console.error('❌ Error de conexión a Groq:', error.message);
    if (error.name === 'AbortError') {
      console.error('La solicitud tardó demasiado (timeout)');
    }
    return;
  }

  console.log('\n✨ ¡Test completado!');
}

testGrokAPI();
