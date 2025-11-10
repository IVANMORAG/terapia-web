// Validation Utilities
class ValidationUtils {
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        if (!password) return false;
        return password.length >= 6;
    }

    static validateRequired(value) {
        return value && value.trim().length > 0;
    }

    static validateLength(value, minLength, maxLength = Infinity) {
        if (!value) return false;
        const length = value.trim().length;
        return length >= minLength && length <= maxLength;
    }

    static validateMemoryForm(formData) {
        const errors = [];
        
        if (!this.validateRequired(formData.personas)) {
            errors.push('Por favor, describe las personas involucradas');
        }
        
        if (!this.validateRequired(formData.lugar)) {
            errors.push('Por favor, describe el lugar del recuerdo');
        }
        
        if (!this.validateRequired(formData.emociones)) {
            errors.push('Por favor, describe las emociones experimentadas');
        }
        
        if (!this.validateRequired(formData.detalles)) {
            errors.push('Por favor, proporciona detalles sensoriales');
        }
        
        if (formData.detalles && formData.detalles.length < 5) {
            errors.push('Los detalles sensoriales deben ser más descriptivos (mínimo 20 caracteres)');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
        
        return true;
    }

    static validateAuthForm(email, password, confirmPassword, isRegister) {
        const errors = [];
        
        if (!this.validateEmail(email)) {
            errors.push('Por favor, ingresa un email válido');
        }
        
        if (!this.validatePassword(password)) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (isRegister && password !== confirmPassword) {
            errors.push('Las contraseñas no coinciden');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
        
        return true;
    }

    static sanitizeInput(input) {
        if (!input) return '';
        
        // Remover caracteres potencialmente peligrosos
        return input
            .trim()
            .replace(/[<>]/g, '') // Remover < y >
            .replace(/javascript:/gi, '') // Remover javascript:
            .replace(/on\w+=/gi, ''); // Remover event handlers
    }

    static validateApiKey(apiKey) {
        if (!apiKey) return false;
        
        // Validar formato básico de OpenAI API key
        return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    static showValidationError(elementId, message) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.add('error');
        
        // Crear o actualizar mensaje de error
        let errorMsg = element.parentElement.querySelector('.error-msg');
        if (!errorMsg) {
            errorMsg = document.createElement('span');
            errorMsg.className = 'error-msg';
            element.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = message;
        
        // Remover error al escribir
        element.addEventListener('input', () => {
            element.classList.remove('error');
            if (errorMsg) errorMsg.remove();
        }, { once: true });
    }

    static clearValidationErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const errorElements = form.querySelectorAll('.error');
        errorElements.forEach(el => el.classList.remove('error'));
        
        const errorMessages = form.querySelectorAll('.error-msg');
        errorMessages.forEach(msg => msg.remove());
    }

    static formatErrorMessage(error) {
        // Convertir errores de Firebase a mensajes amigables
        const errorMessages = {
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/operation-not-allowed': 'Operación no permitida',
            'auth/weak-password': 'La contraseña es muy débil',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/user-not-found': 'No existe una cuenta con este correo',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
            'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
        };
        
        const errorCode = error.code;
        return errorMessages[errorCode] || error.message || 'Ha ocurrido un error';
    }
}