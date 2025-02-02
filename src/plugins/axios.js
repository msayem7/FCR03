import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:8000/api/';
axios.defaults.headers.common['Authorization'] = localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '';

export default axios;

