// Authentication Service con Firebase
class AuthService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.userPlan = 'free';
        this.imagesUsed = 0;
        this.initFirebase();
    }

    initFirebase() {
        try {
            console.log('🔥 Inicializando Firebase...');
            
            // Inicializar Firebase
            firebase.initializeApp(CONFIG.FIREBASE);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            console.log('✅ Firebase inicializado correctamente');
            
            // Setup auth listener
            this.setupAuthListener();
            
        } catch (error) {
            console.error('❌ Error al inicializar Firebase:', error);
            
            // Si ya está inicializado, obtener la instancia
            if (error.code === 'app/duplicate-app') {
                console.log('ℹ️ Firebase ya estaba inicializado, usando instancia existente');
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.setupAuthListener();
            }
        }
    }

    setupAuthListener() {
        if (!this.auth) {
            console.error('❌ Auth no disponible para listener');
            return;
        }
        
        console.log('👂 Configurando listener de autenticación...');
        
        this.auth.onAuthStateChanged(async (user) => {
            console.log('🔄 Estado de autenticación cambió:', user ? user.email : 'Sin usuario');
            
            this.currentUser = user;
            
            if (user) {
                console.log('✅ Usuario autenticado:', user.email);
                await this.loadUserData(user);
                this.onAuthSuccess(user);
            } else {
                console.log('ℹ️ No hay usuario autenticado');
                this.onAuthLogout();
            }
        });
    }

    async loadUserData(user) {
        try {
            console.log('📊 Cargando datos del usuario...');
            
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userPlan = userData.plan || 'free';
                this.imagesUsed = userData.imagesUsed || 0;
                console.log('✅ Datos cargados:', { 
                    plan: this.userPlan, 
                    imagesUsed: this.imagesUsed,
                    uid: user.uid 
                });
            } else {
                console.log('📝 Usuario nuevo, creando documento...');
                await this.createUserDocument(user);
            }
            
            this.updateUsageDisplay();
            
        } catch (error) {
            console.error('❌ Error al cargar datos del usuario:', error);
        }
    }

    async createUserDocument(user) {
        try {
            await this.db.collection('users').doc(user.uid).set({
                email: user.email,
                plan: 'free',
                imagesUsed: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                subscriptionStatus: 'active'
            });
            
            this.userPlan = 'free';
            this.imagesUsed = 0;
            
            console.log('✅ Documento de usuario creado');
        } catch (error) {
            console.error('❌ Error al crear documento de usuario:', error);
        }
    }

    onAuthSuccess(user) {
        console.log('🎉 Autenticación exitosa, actualizando UI...');
        
        // Ocultar modal de login
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.style.display = 'none';
        }
        
        // Mostrar aplicación principal
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.remove('hidden');
            mainApp.style.display = 'block';
        }
        
        // Actualizar email del usuario
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }
        
        // Mostrar plan (si existe el elemento)
        const userPlanEl = document.getElementById('userPlan');
        if (userPlanEl) {
            const planBadge = `<span class="plan-badge plan-${this.userPlan}">${CONFIG.LIMITS[this.userPlan].name}</span>`;
            userPlanEl.innerHTML = planBadge;
        }
        
        this.updateUsageDisplay();
        
        console.log('✅ UI actualizada correctamente');
    }

    onAuthLogout() {
        console.log('👋 Sesión cerrada, actualizando UI...');
        
        // Ocultar aplicación principal
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.add('hidden');
            mainApp.style.display = 'none';
        }
        
        // Mostrar modal de login
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.style.display = 'flex';
        }
        
        this.userPlan = 'free';
        this.imagesUsed = 0;
        
        console.log('✅ UI actualizada para usuario no autenticado');
    }

    async signIn(email, password) {
        if (!this.auth) {
            throw new Error('Firebase no inicializado');
        }
        
        console.log('🔐 Intentando iniciar sesión:', email);
        
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Inicio de sesión exitoso');
            return result;
        } catch (error) {
            console.error('❌ Error en signIn:', error.code, error.message);
            throw error;
        }
    }

    async signUp(email, password) {
        if (!this.auth) {
            throw new Error('Firebase no inicializado');
        }
        
        console.log('📝 Intentando registrar usuario:', email);
        
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ Registro exitoso');
            return result;
        } catch (error) {
            console.error('❌ Error en signUp:', error.code, error.message);
            throw error;
        }
    }

    async signOut() {
        if (!this.auth) {
            throw new Error('Firebase no inicializado');
        }
        
        console.log('👋 Cerrando sesión...');
        
        try {
            await this.auth.signOut();
            console.log('✅ Sesión cerrada correctamente');
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            throw error;
        }
    }

    isAuthenticated() {
        const authenticated = !!this.currentUser;
        console.log('🔍 isAuthenticated:', authenticated);
        return authenticated;
    }

    async canGenerateImage() {
        const limit = CONFIG.LIMITS[this.userPlan].images;
        
        // -1 significa ilimitado
        if (limit === -1) return true;
        
        const canGenerate = this.imagesUsed < limit;
        console.log('🖼️ Puede generar imagen:', canGenerate, `(${this.imagesUsed}/${limit})`);
        return canGenerate;
    }

    async incrementImageUsage() {
        if (!this.currentUser) {
            console.warn('⚠️ No se puede incrementar uso sin usuario');
            return;
        }
        
        try {
            this.imagesUsed++;
            
            await this.db.collection('users').doc(this.currentUser.uid).update({
                imagesUsed: this.imagesUsed,
                lastImageAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.updateUsageDisplay();
            
            console.log(`📊 Uso actualizado: ${this.imagesUsed} imágenes`);
        } catch (error) {
            console.error('❌ Error al actualizar uso:', error);
        }
    }

    updateUsageDisplay() {
        const limit = CONFIG.LIMITS[this.userPlan].images;
        const usageCounter = document.getElementById('usageCounter');
        
        if (!usageCounter) {
            console.log('ℹ️ usageCounter no encontrado en DOM');
            return;
        }
        
        if (limit === -1) {
            usageCounter.innerHTML = `
                <div class="usage-info">
                    <i class="fas fa-infinity"></i>
                    <span>Imágenes ilimitadas</span>
                </div>
            `;
        } else {
            const percentage = (this.imagesUsed / limit) * 100;
            const remaining = limit - this.imagesUsed;
            
            usageCounter.innerHTML = `
                <div class="usage-info">
                    <div class="usage-text">
                        <i class="fas fa-image"></i>
                        <span>${remaining} de ${limit} imágenes restantes este mes</span>
                    </div>
                    <div class="usage-bar">
                        <div class="usage-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
            
            // Alerta si está cerca del límite
            usageCounter.classList.remove('usage-warning', 'usage-limit');
            
            if (remaining <= 2 && remaining > 0) {
                usageCounter.classList.add('usage-warning');
            }
            
            if (remaining === 0) {
                usageCounter.classList.add('usage-limit');
            }
        }
        
        console.log('📊 Display de uso actualizado');
    }

    // ✅ MEJORADO: Mejor logging y manejo de errores
    async updateUserPlan(plan) {
        if (!this.currentUser) {
            const error = 'No se puede actualizar plan sin usuario autenticado';
            console.error('❌', error);
            throw new Error(error);
        }
        
        try {
            console.log(`🔄 Actualizando plan de "${this.userPlan}" a "${plan}"...`);
            console.log(`  - UID: ${this.currentUser.uid}`);
            console.log(`  - Email: ${this.currentUser.email}`);
            
            // Actualizar en Firestore
            await this.db.collection('users').doc(this.currentUser.uid).update({
                plan: plan,
                imagesUsed: 0,
                planUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar variables locales
            this.userPlan = plan;
            this.imagesUsed = 0;
            
            // Actualizar UI
            this.updateUsageDisplay();
            
            console.log(`✅ Plan actualizado exitosamente a: ${plan}`);
            console.log(`📊 Nuevo estado: plan="${this.userPlan}", imagesUsed=${this.imagesUsed}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar plan en Firestore:', error);
            console.error('  - UID intentado:', this.currentUser?.uid);
            console.error('  - Plan destino:', plan);
            console.error('  - Código de error:', error.code);
            console.error('  - Mensaje:', error.message);
            throw error;
        }
    }

    getUserPlan() {
        return this.userPlan;
    }

    getImagesRemaining() {
        const limit = CONFIG.LIMITS[this.userPlan].images;
        if (limit === -1) return Infinity;
        return Math.max(0, limit - this.imagesUsed);
    }
}