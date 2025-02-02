import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
    }),
    actions: {
        async login(credentials) {
            const response = await axios.post('http://localhost:8000/api/token/', credentials);
            this.token = response.data.access;
            localStorage.setItem('token', this.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        },
        logout() {
            this.token = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        },
    },
});