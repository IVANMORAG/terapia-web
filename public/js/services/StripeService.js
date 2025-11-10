// Simplified Service - Sin funcionalidad de pagos
class StripeService {
    constructor(authService) {
        this.authService = authService;
        console.log('ℹ️ Modo sin pagos - Todos los usuarios tienen acceso completo');
    }

    displayPricingPlans() {
        // No se muestra ningún plan de pago
        const pricingPlansContainer = document.getElementById('pricingPlans');
        
        if (!pricingPlansContainer) return;

        pricingPlansContainer.innerHTML = `
            <div class="pricing-plan current-plan">
                <div class="plan-header">
                    <h3>Plan Gratuito</h3>
                    <div class="plan-price">
                        <span class="currency">$</span>
                        <span class="amount">0</span>
                        <span class="period">/mes</span>
                    </div>
                    <div class="plan-images">
                        10 imágenes por mes
                    </div>
                </div>
                
                <ul class="plan-features">
                    <li><i class="fas fa-check"></i> 10 imágenes por mes</li>
                    <li><i class="fas fa-check"></i> Todos los modelos de IA</li>
                    <li><i class="fas fa-check"></i> Calidad HD</li>
                    <li><i class="fas fa-check"></i> Soporte por email</li>
                </ul>
                
                <div class="plan-action">
                    <button class="btn btn-outline full-width" disabled>Plan Actual</button>
                </div>
            </div>
        `;
    }
}

// Funciones globales simplificadas
function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal && window.stripeService) {
        window.stripeService.displayPricingPlans();
        modal.style.display = 'flex';
        modal.classList.add('fade-in');
    }
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('fade-in');
    }
}

// Funciones vacías para evitar errores
function upgradePlan(plan) {
    alert('Los planes de pago no están disponibles en esta versión.');
    closePricingModal();
}

function downgradePlan(plan) {
    alert('Los planes de pago no están disponibles en esta versión.');
    closePricingModal();
}