// ImageGenerationService.js
class ImageGenerationService {
    static async generateWithHuggingFace(prompt) {
        console.log('Generando con Hugging Face (2025 API)...');
        const models = CONFIG.HF_MODELS;

        for (const model of models) {
            try {
                console.log(`Probando: ${model}`);

                // NUEVA URL 2025
                const hfUrl = `${CONFIG.ENDPOINTS.HUGGINGFACE}${model}`;
                const proxyUrl = `${CONFIG.ENDPOINTS.PROXY}${encodeURIComponent(hfUrl)}`;

                const response = await fetch(proxyUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONFIG.HF_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            negative_prompt: 'blurry, ugly, low quality, dark, scary',
                            num_inference_steps: 28,
                            guidance_scale: 7.5
                        }
                    })
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    console.log(`Error ${response.status}:`, err.error || err);
                    continue;
                }

                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                console.log(`IMAGEN GENERADA: ${model}`);
                return imageUrl;

            } catch (error) {
                console.log(`Falló ${model}:`, error.message);
            }
        }

        throw new Error('No se pudo generar la imagen con Hugging Face');
    }
}

window.ImageGenerationService = ImageGenerationService;