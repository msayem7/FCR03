import axios from 'axios';

// axios.defaults.baseURL = 'http://localhost:8000/api/';
// axios.defaults.headers.common['Authorization'] = localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '';

console.log(`process.env.VUE_APP_API_BASE_URL: ${process.env.VUE_APP_API_BASE_URL}`)
console.log(`process.env.VUE_APP_API_BASE_URL: ${process.env}`)
const instance = axios.create({
  //baseURL:'http://localhost:8000/v1/chq',
  baseURL: `${process.env.VUE_APP_API_BASE_URL}/v1/chq`,
})

instance.interceptors.request.use((config)=>{
  const token = localStorage.getItem('token')
  if(token){
    config.headers.Authorization= `Bearer ${token}`;
  }
  return config;
});

export default instance;

