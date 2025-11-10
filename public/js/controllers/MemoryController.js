// Memory Controller
class MemoryController {
    constructor(authService) {
        this.authService = authService;
        this.currentImageUrl = null;
        this.currentPrompt = null;
        this.initEventListeners();
    }

    initEventListeners() {
        const memoryForm = DOMUtils.getElement('memoryForm');
        const apiRadios = DOMUtils.getElements('input[name="apiChoice"]');
        
        if (memoryForm) {
            memoryForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        apiRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleAPIChange());
        });
    }

    handleAPIChange() {
        const selectedAPI = document.querySelector('input[name="apiChoice"]:checked').value;
        const apiConfig = DOMUtils.getElement('apiConfig');
        
        if (selectedAPI === 'openai') {
            DOMUtils.show(apiConfig);
        } else {
            DOMUtils.hide(apiConfig);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.authService.isAuthenticated()) {
            DOMUtils.showNotification('Debes iniciar sesión para generar imágenes', 'error');
            return;
        }

        // Verificar límite de imágenes
        const canGenerate = await this.authService.canGenerateImage();
        if (!canGenerate) {
            DOMUtils.showNotification(
                'Has alcanzado el límite de imágenes de tu plan. Mejora tu plan para continuar.',
                'warning',
                5000
            );
            showPricingModal();
            return;
        }
        
        try {
            const formData = this.getFormData();
            
            // Sanitizar inputs
            formData.personas = ValidationUtils.sanitizeInput(formData.personas);
            formData.lugar = ValidationUtils.sanitizeInput(formData.lugar);
            formData.emociones = ValidationUtils.sanitizeInput(formData.emociones);
            formData.detalles = ValidationUtils.sanitizeInput(formData.detalles);
            
            ValidationUtils.validateMemoryForm(formData);
            
            this.showLoading();
            
            // Paso 1: Generar prompt terapéutico
            this.updateLoadingMessage('Generando descripción terapéutica con IA...');
            const therapeuticPrompt = await AIService.generateTherapeuticPrompt(
                formData.personas,
                formData.lugar,
                formData.emociones,
                formData.detalles
            );
            
            this.currentPrompt = therapeuticPrompt;
            this.displayPrompt(therapeuticPrompt);
            
            // Paso 2: Generar imagen
            this.updateLoadingMessage('Creando tu imagen terapéutica...');
            const imageUrl = await this.generateImage(
                therapeuticPrompt,
                formData.apiChoice,
                formData.apiKey
            );
            
            this.currentImageUrl = imageUrl;
            
            // Paso 3: Incrementar contador
            await this.authService.incrementImageUsage();
            
            this.displayResult(imageUrl);
            
            DOMUtils.showNotification('¡Imagen generada exitosamente!', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        return {
            personas: DOMUtils.getValue('personas'),
            lugar: DOMUtils.getValue('lugar'),
            emociones: DOMUtils.getValue('emociones'),
            detalles: DOMUtils.getValue('detalles'),
            apiChoice: document.querySelector('input[name="apiChoice"]:checked').value,
            apiKey: DOMUtils.getValue('apiKey')
        };
    }

    async generateImage(prompt, apiChoice, apiKey) {
        switch (apiChoice) {
            case 'huggingface':
                return await ImageGenerationService.generateWithHuggingFace(prompt);
            case 'deepai':
                return await ImageGenerationService.generateWithDeepAI(prompt);
            case 'openai':
                if (!apiKey || !ValidationUtils.validateApiKey(apiKey)) {
                    throw new Error('Necesitas ingresar una API key válida de OpenAI (formato: sk-...)');
                }
                return await ImageGenerationService.generateWithOpenAI(prompt, apiKey);
            default:
                throw new Error('API no seleccionada');
        }
    }

    showLoading() {
        DOMUtils.show('resultsContainer');
        DOMUtils.show('loadingState');
        DOMUtils.hide('resultsContent');
        DOMUtils.hide('errorContainer');
        
        const generateBtn = DOMUtils.getElement('generateBtn');
        if (generateBtn) {
            DOMUtils.disableElement(generateBtn);
            DOMUtils.setHTML(generateBtn, '<i class="fas fa-spinner fa-spin"></i><span>Generando...</span>');
        }

        // Scroll a resultados
        DOMUtils.scrollToElement('resultsContainer');
    }

    hideLoading() {
        DOMUtils.hide('loadingState');
        DOMUtils.show('resultsContent');
        
        const generateBtn = DOMUtils.getElement('generateBtn');
        if (generateBtn) {
            DOMUtils.enableElement(generateBtn);
            DOMUtils.setHTML(generateBtn, '<i class="fas fa-magic"></i><span>Generar Recuerdo Terapéutico</span>');
        }
    }

    updateLoadingMessage(message) {
        DOMUtils.setContent('loadingMessage', message);
    }

    displayPrompt(prompt) {
        DOMUtils.setHTML('generatedPrompt', `<p>"${prompt}"</p>`);
    }

    displayResult(imageUrl) {
        const generatedImage = DOMUtils.getElement('generatedImage');
        if (generatedImage) {
            generatedImage.src = imageUrl;
            generatedImage.alt = 'Tu recuerdo terapéutico';
            
            // Agregar evento de carga
            generatedImage.onload = () => {
                console.log('✅ Imagen cargada correctamente');
            };
            
            generatedImage.onerror = () => {
                console.error('❌ Error al cargar imagen');
                this.showError('No se pudo cargar la imagen. Intenta de nuevo.');
            };
        }
    }

    showError(message) {
        DOMUtils.show('errorContainer');
        DOMUtils.setContent('errorMessage', message);
        DOMUtils.hide('resultsContainer');
        
        // Scroll al error
        DOMUtils.scrollToElement('errorContainer');
    }

    hideError() {
        DOMUtils.hide('errorContainer');
    }

    resetForm() {
        DOMUtils.clearForm('memoryForm');
        DOMUtils.hide('resultsContainer');
        DOMUtils.hide('errorContainer');
        this.currentImageUrl = null;
        this.currentPrompt = null;
        
        // Scroll al inicio del formulario
        DOMUtils.scrollToElement('memoryForm');
    }
}

// Funciones globales
function resetForm() {
    if (window.memoryController) {
        window.memoryController.resetForm();
    }
}

function hideError() {
    if (window.memoryController) {
        window.memoryController.hideError();
    }
}

function downloadImage() {
    const generatedImage = DOMUtils.getElement('generatedImage');
    if (generatedImage && generatedImage.src) {
        const link = document.createElement('a');
        link.href = generatedImage.src;
        link.download = `recuerdo-terapeutico-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        DOMUtils.showNotification('Imagen descargada', 'success');
    }
}

async function shareImage() {
    const generatedImage = DOMUtils.getElement('generatedImage');
    if (!generatedImage || !generatedImage.src) return;

    // Intentar Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Mi Recuerdo Terapéutico',
                text: 'Mira esta imagen terapéutica que creé con IA',
                url: window.location.href
            });
            DOMUtils.showNotification('Compartido exitosamente', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error al compartir:', error);
            }
        }
    } else {
        // Fallback: copiar al portapapeles
        try {
            await navigator.clipboard.writeText(generatedImage.src);
            DOMUtils.showNotification('Enlace copiado al portapapeles', 'success');
        } catch (error) {
            DOMUtils.showNotification('No se pudo compartir la imagen', 'error');
        }
    }
}