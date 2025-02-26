import { defineStore } from 'pinia';
import axios from '../plugins/axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
    }),
    actions: {
        async initialize() {
            try {
                if (this.token) {
                    // Replace with your actual user endpoint
                    const response = await axios.get('http://localhost:8000/api/user/')
                    this.user = response.data
                    axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
                }
            } catch (error) {
                this.logout()
            }
        },    
        async login(credentials) {
            try {
                const response = await axios.post('http://localhost:8000/api/token/', credentials);
                
                if (response.data.access && response.data.user) {
                    this.token = response.data.access;
                    this.user = response.data.user;
                    localStorage.setItem('token', this.token);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                    return true;
                }
                throw new Error('Invalid response format');
            } catch (error) {
                console.error('Login error:', error.response?.data || error.message);
                this.logout();
                throw error;
            }
        },
        // async login(credentials) {
        //     //should handle error
        //     const response = await axios.post('http://localhost:8000/api/token/', credentials);
            
        //     this.token = response.data.access;
        //     this.user = response.data.user; // need to check what backend return
        //     console.log('logged in user', this.user,'Resposne User:', response.data.user);
        //     localStorage.setItem('token', this.token);
        //     axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        // },
        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        },
    },
});