import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Add this

console.log(`process.env.VUE_APP_API_BASE_URL: ${process.env.VUE_APP_API_BASE_URL}`)
console.log(`process.env.baseURL: ${process.env}`)
const instance = axios.create({
  baseURL: `${process.env.VUE_APP_API_BASE_URL}`,
})

instance.interceptors.request.use((config)=>{
  const token = localStorage.getItem('token')
  if(token){
    // Check token expiration before sending requests
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      window.location.href = '/';  // Redirect to login
      return config;
    }
    config.headers.Authorization= `Bearer ${token}`;
  }
  return config;
});

export default instance;

