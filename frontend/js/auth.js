class AuthManager {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || 'http://localhost:5000/api';
        this.loginForm = document.getElementById('loginForm');
        this.loginMessage = document.getElementById('loginMessage');
        
        this.init();
    }
    
    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Check if already logged in
        this.checkAuth();
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save token and user info
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Login failed', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'danger');
        }
    }
    
    async checkAuth() {
        const token = localStorage.getItem('authToken');
        
        if (!token) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                // Already logged in, redirect to dashboard
                if (window.location.pathname.includes('admin-login.html')) {
                    window.location.href = 'admin-dashboard.html';
                }
            } else {
                // Invalid token, clear storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
    
    showMessage(text, type) {
        if (!this.loginMessage) return;
        
        this.loginMessage.textContent = text;
        this.loginMessage.className = `alert alert-${type}`;
        this.loginMessage.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.loginMessage.style.display = 'none';
        }, 5000);
    }
    
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'admin-login.html';
    }
    
    static getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    static getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        new AuthManager();
    }
});