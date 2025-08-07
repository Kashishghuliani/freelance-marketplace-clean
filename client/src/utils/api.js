import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // should resolve to your render.com URL
  withCredentials: true, // Optional: only if you’re using cookies
});

export default API;
