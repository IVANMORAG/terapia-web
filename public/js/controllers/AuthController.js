// Auth Controller
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.currentMode = 'login';
        this.initEventListeners();
        console.log('✅ AuthController inicializado');
    }

    initEventListeners() {
        const submitBtn = DOMUtils.getElement('submitBtn');
        const authForm = DOMUtils.getElement('authForm');
        
        console.log('🎯 Configurando event listeners de AuthController...');
        console.log('  - submitBtn:', submitBtn ? '✅' : '❌');
        console.log('  - authForm:', authForm ? '✅' : '❌');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                console.log('🖱️ Click en submitBtn');
                this.handleSubmit(e);
            });
        } else {
            console.error('❌ submitBtn no encontrado en DOM');
        }
        
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                console.log('📝 Submit del formulario authForm');
                e.preventDefault();
                this.handleSubmit(e);
            });
        } else {
            console.error('❌ authForm no encontrado en DOM');
        }

        // Enter key en los campos
        ['email', 'password', 'confirmPassword'].forEach(id => {
            const input = DOMUtils.getElement(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('⏎ Enter presionado en', id);
                        this.handleSubmit(e);
                    }
                });
            }
        });
        
        console.log('✅ Event listeners de AuthController configurados');
    }

    switchTab(mode) {
        console.log('🔄 Cambiando a modo:', mode);
        this.currentMode = mode;
        
        const tabs = DOMUtils.getElements('.tab-btn');
        const registerFields = DOMUtils.getElement('registerFields');
        const submitBtn = DOMUtils.getElement('submitBtn');
        
        // Actualizar tabs
        tabs.forEach((tab, index) => {
            if ((mode === 'login' && index === 0) || (mode === 'register' && index === 1)) {
                DOMUtils.addClass(tab, 'active');
            } else {
                DOMUtils.removeClass(tab, 'active');
            }
        });
        
        // Mostrar/ocultar campos de registro
        if (mode === 'register') {
            if (registerFields) {
                registerFields.classList.remove('hidden');
                registerFields.style.display = 'block';
            }
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i><span id="submitText">Registrarse</span>';
            }
        } else {
            if (registerFields) {
                registerFields.classList.add('hidden');
                registerFields.style.display = 'none';
            }
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span id="submitText">Iniciar Sesión</span>';
            }
        }
        
        this.clearErrors();
        ValidationUtils.clearValidationErrors('authForm');
        
        console.log('✅ Tab cambiado a:', mode);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        console.log('🚀 handleSubmit - Modo:', this.currentMode);
        
        // Obtener elementos
        const emailInput = DOMUtils.getElement('email');
        const passwordInput = DOMUtils.getElement('password');
        const confirmPasswordInput = DOMUtils.getElement('confirmPassword');
        const submitBtn = DOMUtils.getElement('submitBtn');
        
        // Verificar que los elementos existen
        if (!emailInput || !passwordInput) {
            console.error('❌ Faltan campos requeridos');
            this.showError('Error en el formulario. Por favor recarga la página.');
            return;
        }
        
        // Obtener valores
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';
        
        console.log('📝 Datos del formulario:', {
            email,
            password: password ? '***' : '(vacío)',
            confirmPassword: confirmPassword ? '***' : '(vacío)',
            mode: this.currentMode
        });
        
        try {
            this.clearErrors();
            
            // Validar entrada
            console.log('✅ Validando formulario...');
            ValidationUtils.validateAuthForm(
                email, 
                password, 
                confirmPassword, 
                this.currentMode === 'register'
            );
            console.log('✅ Validación exitosa');
            
            // Deshabilitar botón y mostrar loading
            if (submitBtn) {
                DOMUtils.disableElement(submitBtn);
                DOMUtils.setHTML(submitBtn, '<i class="fas fa-spinner fa-spin"></i><span>Procesando...</span>');
            }
            
            // Autenticar
            if (this.currentMode === 'login') {
                console.log('🔐 Iniciando sesión...');
                await this.authService.signIn(email, password);
                console.log('✅ Login exitoso');
                DOMUtils.showNotification('¡Bienvenido de vuelta!', 'success');
            } else {
                console.log('📝 Registrando usuario...');
                await this.authService.signUp(email, password);
                console.log('✅ Registro exitoso');
                DOMUtils.showNotification('¡Cuenta creada exitosamente!', 'success');
            }
            
            // Limpiar formulario
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            
        } catch (error) {
            console.error('❌ Error de autenticación:', error);
            console.error('  - Code:', error.code);
            console.error('  - Message:', error.message);
            
            const friendlyMessage = ValidationUtils.formatErrorMessage(error);
            this.showError(friendlyMessage);
            
            // Reactivar botón
            if (submitBtn) {
                DOMUtils.enableElement(submitBtn);
                const icon = this.currentMode === 'login' ? 'sign-in-alt' : 'user-plus';
                const text = this.currentMode === 'login' ? 'Iniciar Sesión' : 'Registrarse';
                DOMUtils.setHTML(submitBtn, `<i class="fas fa-${icon}"></i><span id="submitText">${text}</span>`);
            }
        }
    }

    showError(message) {
        console.log('🚨 Mostrando error:', message);
        
        const errorElement = DOMUtils.getElement('authError');
        if (errorElement) {
            DOMUtils.setContent(errorElement, message);
            errorElement.classList.remove('hidden');
            errorElement.style.display = 'block';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                this.clearErrors();
            }, 5000);
        } else {
            console.error('❌ authError element no encontrado');
            // Fallback: usar notificación
            DOMUtils.showNotification(message, 'error', 5000);
        }
    }

    clearErrors() {
        const errorElement = DOMUtils.getElement('authError');
        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.style.display = 'none';
        }
    }
}