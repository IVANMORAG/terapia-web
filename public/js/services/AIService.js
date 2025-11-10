// AIService.js — ÚNICO SERVICIO DE IA
// Requiere: <script src="config.js"></script> antes

class AIService {
    static MODELS = [
        'gemini-2.5-flash',     // OFICIAL, GRATIS
        'gemini-2.5-pro'        // Si tienes acceso
    ];

    static delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    static async generateTherapeuticPrompt(personas, lugar, emociones, detalles) {
        const prompt = `You are an expert therapist specializing in memory work and visual therapy. Create a VIVID, DETAILED English prompt for generating a therapeutic image based on this memory:
People involved: ${personas}
Location: ${lugar}
Emotions felt: ${emociones}
Sensory details: ${detalles}
Create a prompt that:
- Is in ENGLISH
- Uses warm, healing colors
- Includes soft, comforting lighting
- Evokes peace and emotional wellness
- Maximum 100 words
- Focuses on the therapeutic and positive aspects
Respond ONLY with the image prompt, no explanations.`;

        for (const model of this.MODELS) {
            for (let i = 0; i < 3; i++) {
                try {
                    const result = await this.callGemini(prompt, model);
                    console.log(`Prompt generado con: ${model}`);
                    return result;
                } catch (err) {
                    if (err.message.includes('429') && i < 2) {
                        const wait = (2 ** i) * 2000;
                        console.log(`Rate limit. Esperando ${wait/1000}s...`);
                        await this.delay(wait);
                    }
                }
            }
        }
        throw new Error('Gemini no responde. Prueba más tarde.');
    }

    static async callGemini(prompt, model) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': CONFIG.GEMINI_API_KEY  // OFICIAL
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`HTTP ${response.status}: ${err.error?.message || 'Error'}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Respuesta vacía');
        return text.trim().replace(/^["'\n]+|["'\n]+$/g, '').trim();
    }

    static async testConnection() {
        console.log('Probando Gemini 2.5 Flash...');
        for (const model of this.MODELS) {
            try {
                await this.callGemini("Say 'OK'", model);
                console.log(`${model} → FUNCIONA`);
                return model;
            } catch (err) {
                console.log(`${model} → Falló (${err.message.split(':')[0]})`);
            }
        }
        console.log('Ningún modelo responde.');
        return null;
    }
}

// Hacer global
window.AIService = AIService;
console.log('AIService listo. Usa: AIService.testConnection()');