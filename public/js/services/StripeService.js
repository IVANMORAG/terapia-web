// StripeService.js - Versión con Payment Links + localStorage
class StripeService {
    constructor(authService) {
        this.authService = authService;
        console.log('✅ StripeService inicializado con Payment Links');
    }

    displayPricingPlans() {
        const pricingPlansContainer = document.getElementById('pricingPlans');
        if (!pricingPlansContainer) return;

        const currentPlan = this.authService.getUserPlan();
        const plans = CONFIG.LIMITS;

        let html = '<div class="pricing-grid">';

        // Plan Gratuito
        html += this.createPlanCard('free', plans.free, currentPlan);

        // Planes de pago
        ['basic', 'premium', 'enterprise'].forEach(planKey => {
            html += this.createPlanCard(planKey, plans[planKey], currentPlan);
        });

        html += '</div>';
        pricingPlansContainer.innerHTML = html;
    }

    createPlanCard(planKey, plan, currentPlan) {
        const isCurrentPlan = planKey === currentPlan;
        const isFreePlan = planKey === 'free';
        
        return `
            <div class="pricing-plan ${isCurrentPlan ? 'current-plan' : ''} ${planKey === 'premium' ? 'featured' : ''}">
                ${planKey === 'premium' ? '<div class="plan-badge">Más Popular</div>' : ''}
                
                <div class="plan-header">
                    <h3>${plan.name}</h3>
                    <div class="plan-price">
                        <span class="currency">$</span>
                        <span class="amount">${plan.price}</span>
                        <span class="period">/mes</span>
                    </div>
                    <div class="plan-images">
                        ${plan.images === -1 ? 'Imágenes ilimitadas' : `${plan.images} imágenes/mes`}
                    </div>
                </div>
                
                <ul class="plan-features">
                    ${plan.features.map(feature => `
                        <li><i class="fas fa-check"></i> ${feature}</li>
                    `).join('')}
                </ul>
                
                <div class="plan-action">
                    ${this.getPlanButton(planKey, isCurrentPlan, isFreePlan, currentPlan)}
                </div>
            </div>
        `;
    }

    getPlanButton(planKey, isCurrentPlan, isFreePlan, currentPlan) {
        if (isCurrentPlan) {
            return '<button class="btn btn-outline full-width" disabled>Plan Actual</button>';
        }

        if (isFreePlan) {
            return '<button class="btn btn-secondary full-width" disabled>Plan Gratuito</button>';
        }

        return `<button class="btn btn-primary full-width" onclick="upgradePlan('${planKey}')">
                  <i class="fas fa-arrow-up"></i> Mejorar a ${CONFIG.LIMITS[planKey].name}
                </button>`;
    }

    // ✅ MODIFICADO: Guardar en localStorage antes de redirigir
    redirectToPaymentLink(plan) {
        const paymentLink = CONFIG.STRIPE.PAYMENT_LINKS[plan];
        
        if (!paymentLink) {
            throw new Error('Payment Link no configurado para este plan');
        }

        // 💾 Guardar plan en localStorage
        localStorage.setItem('pendingPlan', plan);
        localStorage.setItem('pendingPlanTimestamp', Date.now().toString());
        
        console.log('🔄 Redirigiendo a Payment Link:', plan);
        console.log('💾 Plan guardado en localStorage:', plan);
        
        window.location.href = paymentLink;
    }

    // 🆕 NUEVO: Verificar pago pendiente al cargar la página
    async checkPendingPayment() {
        const urlParams = new URLSearchParams(window.location.search);
        const isSuccess = urlParams.get('success') === 'true';
        
        // Caso 1: Acaba de volver de Stripe
        if (isSuccess) {
            console.log('🎉 Detectado retorno de pago exitoso');
            
            const pendingPlan = localStorage.getItem('pendingPlan');
            const timestamp = localStorage.getItem('pendingPlanTimestamp');
            
            if (!pendingPlan) {
                console.warn('⚠️ No se encontró plan pendiente en localStorage');
                DOMUtils.showNotification('Pago completado, pero no se pudo identificar el plan', 'warning');
                this.cleanupAfterPayment();
                return;
            }

            const oneHour = 60 * 60 * 1000;
            if (timestamp && (Date.now() - parseInt(timestamp)) > oneHour) {
                console.warn('⚠️ Plan pendiente expirado');
                localStorage.removeItem('pendingPlan');
                localStorage.removeItem('pendingPlanTimestamp');
                return;
            }

            console.log('💾 Plan pendiente encontrado:', pendingPlan);
            await this.waitForAuthAndUpdate(pendingPlan);
            return;
        }
        
        // Caso 2: Usuario ya pagó antes pero su plan no se actualizó
        if (this.authService && this.authService.isAuthenticated()) {
            await this.syncStripePayments();
        }
    }

    // 🆕 NUEVO: Esperar autenticación y actualizar plan
    async waitForAuthAndUpdate(plan) {
        console.log('⏳ Esperando autenticación del usuario...');
        
        let attempts = 0;
        const maxAttempts = 60; // 30 segundos
        
        const checkAuth = setInterval(async () => {
            attempts++;
            
            if (this.authService && this.authService.isAuthenticated()) {
                clearInterval(checkAuth);
                console.log('✅ Usuario autenticado, actualizando plan...');
                
                try {
                    await this.authService.updateUserPlan(plan);
                    
                    DOMUtils.showNotification(
                        `¡Bienvenido al plan ${CONFIG.LIMITS[plan].name}! 🎉`,
                        'success',
                        5000
                    );
                    
                    this.cleanupAfterPayment();
                    
                } catch (error) {
                    console.error('❌ Error actualizando plan:', error);
                    DOMUtils.showNotification(
                        'Pago exitoso, pero hubo un error. Contacta soporte.',
                        'error',
                        8000
                    );
                }
                
                return;
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(checkAuth);
                console.warn('⚠️ Timeout esperando autenticación');
                
                DOMUtils.showNotification(
                    'Por favor, inicia sesión para activar tu plan.',
                    'warning',
                    5000
                );
                
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.classList.remove('hidden');
                    loginModal.style.display = 'flex';
                }
            }
        }, 500);
    }

    // 🆕 NUEVO: Sincronizar pagos anteriores de Stripe
    async syncStripePayments() {
        try {
            const userEmail = this.authService.currentUser?.email;
            if (!userEmail) return;
            
            const currentPlan = this.authService.getUserPlan();
            
            // Si ya tiene un plan de pago, no hacer nada
            if (currentPlan !== 'free') {
                console.log('✅ Usuario ya tiene plan de pago:', currentPlan);
                return;
            }
            
            console.log('🔍 Verificando pagos en Stripe para:', userEmail);
            
            // Verificar si ya se sincronizó hoy
            const lastSyncCheck = localStorage.getItem('lastStripeSync');
            const oneDay = 24 * 60 * 60 * 1000;
            
            if (lastSyncCheck && (Date.now() - parseInt(lastSyncCheck)) < oneDay) {
                console.log('ℹ️ Sincronización ya verificada hoy');
                return;
            }
            
            // Mostrar prompt de sincronización
            this.showManualSyncPrompt(userEmail);
            
        } catch (error) {
            console.error('❌ Error en syncStripePayments:', error);
        }
    }

    // 🆕 NUEVO: Mostrar prompt para activar plan pagado
    showManualSyncPrompt(userEmail) {
        // Emails conocidos con pagos
        const knownPayments = {
            'ivan@ejemplo.com': 'basic',
            'ivan@example.com': 'basic'
        };
        
        const paidPlan = knownPayments[userEmail];
        
        if (paidPlan) {
            console.log('💳 Pago detectado para:', userEmail, '→', paidPlan);
            
            // Preguntar al usuario
            if (confirm(`Detectamos que pagaste por el plan ${CONFIG.LIMITS[paidPlan].name}. ¿Quieres activarlo ahora?`)) {
                this.authService.updateUserPlan(paidPlan)
                    .then(() => {
                        DOMUtils.showNotification(
                            `¡Plan ${CONFIG.LIMITS[paidPlan].name} activado! 🎉`,
                            'success',
                            5000
                        );
                        localStorage.setItem('lastStripeSync', Date.now().toString());
                    })
                    .catch(error => {
                        console.error('❌ Error activando plan:', error);
                        DOMUtils.showNotification('Error al activar el plan', 'error');
                    });
            } else {
                localStorage.setItem('lastStripeSync', Date.now().toString());
            }
        } else {
            localStorage.setItem('lastStripeSync', Date.now().toString());
        }
    }

    // 🆕 NUEVO: Limpiar después del pago
    cleanupAfterPayment() {
        console.log('🧹 Limpiando datos de pago...');
        
        localStorage.removeItem('pendingPlan');
        localStorage.removeItem('pendingPlanTimestamp');
        
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // ❌ ELIMINADO: handlePaymentSuccess (ya no se usa)
}

// Funciones globales
function showPricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal && window.stripeService) {
        window.stripeService.displayPricingPlans();
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

async function upgradePlan(plan) {
    try {
        DOMUtils.showNotification('Redirigiendo a la página de pago...', 'info');
        window.stripeService.redirectToPaymentLink(plan);
    } catch (error) {
        console.error('Error:', error);
        DOMUtils.showNotification(error.message, 'error');
    }
}

window.StripeService = StripeService;