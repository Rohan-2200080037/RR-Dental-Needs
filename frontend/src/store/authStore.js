import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

const useAuthStore = create((set) => ({
    user: null, // {id, name, email, role, sellerId}
    token: null,
    isAuthenticated: false,
    
    login: (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData, token, isAuthenticated: true });
    },
    
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },
    
    checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                const decodedToken = jwtDecode(token);
                // Check if expired
                if (decodedToken.exp * 1000 < Date.now()) {
                     localStorage.removeItem('token');
                     localStorage.removeItem('user');
                     set({ user: null, token: null, isAuthenticated: false });
                     return;
                }
                
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true });
            } catch (error) {
                console.error("Token decode error:", error);
                set({ user: null, token: null, isAuthenticated: false });
            }
        }
    }
}));

export default useAuthStore;
