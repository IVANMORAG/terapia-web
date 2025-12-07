// config.js — CONFIGURACIÓN USANDO VARIABLES DE ENTORNO
const CONFIG = {
    GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY,
    HF_TOKEN: process.env.REACT_APP_HF_TOKEN,
    
    FIREBASE: {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
    },
    
    STRIPE: {
        PAYMENT_LINKS: {
            basic: process.env.REACT_APP_STRIPE_BASIC_LINK,
            premium: process.env.REACT_APP_STRIPE_PREMIUM_LINK,
            enterprise: process.env.REACT_APP_STRIPE_ENTERPRISE_LINK
        }
    },
    
    ENDPOINTS: {
        GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        HUGGINGFACE: 'https://router.huggingface.co/hf-inference/models/',
        PROXY: 'https://corsproxy.io/?',
        DEEPAI: 'https://api.deepai.org/api/text2img',
        OPENAI: 'https://api.openai.com/v1/images/generations'
    },
    
    HF_MODELS: [
        "black-forest-labs/FLUX.1-dev",
        "runwayml/stable-diffusion-v1-5",
        "CompVis/stable-diffusion-v1-4",
        "stabilityai/stable-diffusion-xl-base-1.0"
    ],
    
    LIMITS: {
        free: { 
            images: 3,
            name: "Gratis",
            price: 0,
            features: [
                "3 imágenes por mes",
                "Modelos básicos de IA",
                "Calidad estándar",
                "Soporte por email"
            ]
        },
        basic: { 
            images: 10,
            name: "Básico",
            price: 9.99,
            priceId: 'basic',
            features: [
                "10 imágenes por mes",
                "Todos los modelos de IA",
                "Calidad HD",
                "Soporte prioritario",
                "Sin marca de agua"
            ]
        },
        premium: { 
            images: 100,
            name: "Premium",
            price: 24.99,
            priceId: 'premium',
            features: [
                "100 imágenes por mes",
                "Todos los modelos premium",
                "Calidad 4K",
                "Soporte 24/7",
                "Galería privada",
                "Descargas ilimitadas"
            ]
        },
        enterprise: { 
            images: -1,
            name: "Enterprise",
            price: 99.99,
            priceId: 'enterprise',
            features: [
                "Imágenes ilimitadas",
                "API personalizada",
                "Modelos exclusivos",
                "Soporte dedicado",
                "Integración empresarial",
                "Analytics avanzados"
            ]
        }
    }
};

function validateConfig() {
    const warnings = [];
    if (!CONFIG.GEMINI_API_KEY) warnings.push("Gemini API Key");
    if (!CONFIG.HF_TOKEN) warnings.push("Hugging Face Token");
    if (!CONFIG.FIREBASE.apiKey) warnings.push("Firebase API Key");
    if (!CONFIG.STRIPE.PAYMENT_LINKS.basic) warnings.push("Stripe Payment Links");
    
    if (warnings.length > 0) {
        console.warn("⚠️ Variables de entorno faltantes:", warnings);
        console.warn("⚠️ Asegúrate de crear un archivo .env en la raíz del proyecto");
    } else {
        console.log("✅ Configuración validada correctamente");
    }
}

validateConfig();
window.CONFIG = CONFIG;