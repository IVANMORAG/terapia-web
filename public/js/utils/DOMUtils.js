// DOM Utilities
class DOMUtils {
    static getElement(id) {
        return document.getElementById(id);
    }

    static getElements(selector) {
        return document.querySelectorAll(selector);
    }

    static show(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.classList.remove('hidden');
    }

    static hide(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.classList.add('hidden');
    }

    static toggle(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.classList.toggle('hidden');
    }

    static addClass(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.classList.add(className);
    }

    static removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.classList.remove(className);
    }

    static setContent(element, content) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.textContent = content;
        }
    }

    static setHTML(element, html) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.innerHTML = html;
        }
    }

    static getValue(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        return element?.value || '';
    }

    static setValue(element, value) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.value = value;
        }
    }

    static clearForm(formId) {
        const form = this.getElement(formId);
        if (form) {
            form.reset();
        }
    }

    static disableElement(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.disabled = true;
        }
    }

    static enableElement(element) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.disabled = false;
        }
    }

    static scrollToElement(element, behavior = 'smooth') {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        element?.scrollIntoView({ behavior });
    }

    static fadeIn(element, duration = 300) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (!element) return;

        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            
            element.style.opacity = percentage;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (!element) return;

        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = 1 - Math.min(progress / duration, 1);
            
            element.style.opacity = percentage;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    }

    static showModal(modalId) {
        const modal = this.getElement(modalId);
        if (modal) {
            modal.style.display = 'flex';
            this.addClass(modal, 'fade-in');
            document.body.style.overflow = 'hidden';
        }
    }

    static hideModal(modalId) {
        const modal = this.getElement(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.removeClass(modal, 'fade-in');
            document.body.style.overflow = '';
        }
    }

    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const icon = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
}