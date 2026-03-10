import { create } from 'zustand';
import axios from 'axios';

const useCartStore = create((set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchCart: async (token) => {
        set({ loading: true });
        try {
            const res = await axios.get('http://localhost:5000/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ items: res.data, loading: false, error: null });
        } catch (err) {
            set({ error: err.response?.data?.message || err.message, loading: false });
        }
    },

    addToCart: async (productId, quantity, token) => {
        set({ loading: true });
        try {
             await axios.post('http://localhost:5000/api/cart/add', 
                { productId, quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await get().fetchCart(token);
        } catch (err) {
             set({ error: err.response?.data?.message || err.message, loading: false });
             throw err; // For UI feedback
        }
    },

    updateQuantity: async (cartId, quantity, token) => {
        set({ loading: true });
        try {
            await axios.put(`http://localhost:5000/api/cart/${cartId}`,
                { quantity },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await get().fetchCart(token);
        } catch (err) {
             set({ error: err.response?.data?.message || err.message, loading: false });
        }
    },

    removeFromCart: async (cartId, token) => {
        set({ loading: true });
        try {
             await axios.delete(`http://localhost:5000/api/cart/${cartId}`, {
                 headers: { Authorization: `Bearer ${token}` }
             });
             set(state => ({ items: state.items.filter(item => item.cart_id !== cartId), loading: false }));
        } catch (err) {
             set({ error: err.response?.data?.message || err.message, loading: false });
        }
    },

    clearCartState: () => {
        set({ items: [], loading: false, error: null });
    }
}));

export default useCartStore;
