// Application initialization
class App {
    constructor() {
        this.authService = null;
        this.stripeService = null;
        this.authController = null;
        this.memoryController = null;
        this.init();
    }

    async init() {
        console.log('%c╔══════════════════════════════════════╗', 'color: #4CAF50; font-weight: bold');
        console.log('%c║ MemoryTherapy - Terapia de Recuerdos ║', 'color: #4CAF50; font-weight: bold');
        console.log('%c║           Versión 1.0.0              ║', 'color: #4CAF50; font-weight: bold');
        console.log('%c╚══════════════════════════════════════╝', 'color: #4CAF50; font-weight: bold');
        console.log('🚀 Iniciando aplicación...');
        
        try {
            // Inicializar servicios
            console.log('📦 Inicializando servicios...');
            this.authService = new AuthService();
            
            // Esperar un poco para que Firebase se inicialice completamente
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.stripeService = new StripeService(this.authService);
            this.authController = new AuthController(this.authService);
            this.memoryController = new MemoryController(this.authService);

            // Hacer servicios globalmente disponibles
            window.authService = this.authService;
            window.stripeService = this.stripeService;
            window.authController = this.authController;
            window.memoryController = this.memoryController;

            // Setup event listeners
            this.setupEventListeners();
            
            // Test de conexiones
            await this.runDiagnostics();
            
            console.log('✅ Aplicación inicializada correctamente');
            
            // Medir tiempo de carga
            if ('performance' in window) {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                    console.log(`⚡ Tiempo de carga: ${loadTime.toFixed(2)}ms`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar aplicación:', error);
            this.showCriticalError('Error al inicializar la aplicación. Por favor, recarga la página.');
        }
    }

    setupEventListeners() {
        console.log('🎧 Configurando event listeners...');
        
        // Modal de login
        const loginModal = DOMUtils.getElement('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    // Solo cerrar si hay usuario autenticado
                    if (this.authService && this.authService.isAuthenticated()) {
                        closeModal();
                    }
                }
            });
        }

        // Modal de pricing
        const pricingModal = DOMUtils.getElement('pricingModal');
        if (pricingModal) {
            pricingModal.addEventListener('click', (e) => {
                if (e.target === pricingModal) {
                    closePricingModal();
                }
            });
        }

        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Solo cerrar si hay usuario autenticado
                if (this.authService && this.authService.isAuthenticated()) {
                    closeModal();
                    closePricingModal();
                }
            }
        });

        // Tab switching para auth
        const tabBtns = DOMUtils.getElements('.tab-btn');
        tabBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const mode = index === 0 ? 'login' : 'register';
                switchTab(mode);
            });
        });

        // Prevenir submit default en formularios
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
            });
        });
        
        console.log('✅ Event listeners configurados');
    }

    async runDiagnostics() {
        console.log('🔍 Ejecutando diagnósticos...');
        
        const diagnostics = {
            firebase: false,
            stripe: false,
            gemini: false
        };
        
        // Test Firebase
        try {
            if (this.authService && this.authService.auth) {
                diagnostics.firebase = true;
                console.log('✅ Firebase: Conectado');
            } else {
                console.warn('⚠️ Firebase: No configurado');
            }
        } catch (error) {
            console.error('❌ Firebase: Error', error);
        }

        // Test Stripe
        try {
            if (this.stripeService) {
                diagnostics.stripe = true;
                console.log('✅ Stripe: Conectado (Payment Links)');
            } else {
                console.log('ℹ️ Stripe: No configurado');
            }
        } catch (error) {
            console.warn('⚠️ Stripe: No disponible');
        }

        // Test Gemini
        try {
            const geminiWorks = await AIService.testConnection();
            diagnostics.gemini = geminiWorks;
            if (geminiWorks) {
                console.log('✅ Gemini API: Funcionando');
            } else {
                console.warn('⚠️ Gemini API: Error de conexión');
            }
        } catch (error) {
            console.warn('⚠️ Gemini API: Error', error.message);
        }

        console.log('📊 Diagnósticos completados:', diagnostics);
        
        return diagnostics;
    }
    
    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            text-align: center;
        `;
        
        errorDiv.innerHTML = `
            <h2 style="margin: 0 0 15px 0;">⚠️ Error Crítico</h2>
            <p style="margin: 0 0 20px 0;">${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #f44336;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Recargar Página</button>
        `;
        
        document.body.appendChild(errorDiv);
    }
}

// ==================== Funciones globales de navegación ====================

function navigateTo(page) {
    console.log('🔗 Navegando a:', page);
    if (page === 'login') {
        showModal();
    }
}

function showModal() {
    console.log('📂 Abriendo modal de login');
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
        loginModal.style.display = 'flex';
    }
}

function closeModal() {
    console.log('📂 Cerrando modal de login');
    const loginModal = document.getElementById('loginModal');
    if (loginModal && window.authService && window.authService.isAuthenticated()) {
        loginModal.classList.add('hidden');
        loginModal.style.display = 'none';
    } else {
        console.log('ℹ️ No se puede cerrar - usuario debe autenticarse');
    }
}

function switchTab(mode) {
    console.log('🔄 Cambiando tab a:', mode);
    if (window.authController) {
        window.authController.switchTab(mode);
    }
}

function scrollToDemo() {
    console.log('📜 Scroll a demo');
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function logout() {
    console.log('👋 Intentando cerrar sesión');
    if (window.authService) {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            window.authService.signOut();
            DOMUtils.showNotification('Sesión cerrada', 'info');
        }
    }
}

function closePricingModal() {
    const pricingModal = document.getElementById('pricingModal');
    if (pricingModal) {
        pricingModal.classList.add('hidden');
        pricingModal.style.display = 'none';
    }
}

function downloadImage() {
    if (window.memoryController) {
        window.memoryController.downloadImage();
    }
}

function shareImage() {
    if (window.memoryController) {
        window.memoryController.shareImage();
    }
}

function resetForm() {
    if (window.memoryController) {
        window.memoryController.resetForm();
    }
}

function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
    }
}

// ==================== Manejo de errores globales ====================

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rechazado:', event.reason);
    
    // Mostrar error amigable al usuario
    if (window.memoryController) {
        const message = event.reason?.message || 'Ha ocurrido un error inesperado';
        window.memoryController.showError(message);
    }
});

window.addEventListener('error', (event) => {
    console.error('❌ Error global:', event.error);
    
    // Manejar errores críticos
    if (event.error && event.error.message.includes('Firebase')) {
        console.error('🔥 Error crítico de Firebase detectado');
        DOMUtils.showNotification(
            'Error de conexión con el servidor. Por favor, recarga la página.',
            'error',
            5000
        );
    }
});

// ==================== Monitoreo de conexión ====================

window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    DOMUtils.showNotification('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
    console.log('📴 Sin conexión');
    DOMUtils.showNotification('Sin conexión a internet', 'warning', 5000);
});

// ==================== Service Worker ====================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch(error => {
                console.log('ℹ️ Error SW:', error.message);
            });
    });
}

// ==================== Inicializar aplicación ====================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new App();
    });
} else {
    window.app = new App();
}
// Exportar para uso en consola (debugging)
window.App = App;

// ==================== Manejar retorno de Stripe ====================
window.addEventListener('DOMContentLoaded', () => {
    const checkStripeService = setInterval(() => {
        if (window.stripeService) {
            clearInterval(checkStripeService);
            window.stripeService.checkPendingPayment();
        }
    }, 100);
    
    setTimeout(() => clearInterval(checkStripeService), 5000);
});