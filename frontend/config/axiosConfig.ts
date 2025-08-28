import axios from "axios";
import { API_URL } from "./env";
import * as SecureStore from 'expo-secure-store';

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Accept': 'application/json',
    },
    withCredentials: false,
});

axiosInstance.interceptors.request.use(
   async (config) => {
    const token = await SecureStore.getItemAsync('Session');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
(error) => {
    // Handle errors
    return Promise.reject(error);
});

export default axiosInstance;
