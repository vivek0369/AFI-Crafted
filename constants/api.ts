import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get the local IP address for development
// Replace this with your actual Render/Heroku URL after deployment
const PRODUCTION_URL = 'https://your-app-name.onrender.com/api';

const getBaseUrl = () => {
  if (__DEV__) {
    // Use machine IP for local development (mobile)
    const host = Constants.expoConfig?.hostUri?.split(':').shift();
    return host ? `http://${host}:5000/api` : 'http://localhost:5000/api';
  }
  return PRODUCTION_URL;
};

const BASE_URL = getBaseUrl();

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
  const token = await AsyncStorage.getItem('afi_token');
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    signup: (data: any) => apiRequest('/auth/signup', 'POST', data),
    login: (data: any) => apiRequest('/auth/login', 'POST', data),
    me: () => apiRequest('/auth/me'),
  },
  reports: {
    list: () => apiRequest('/reports'),
    get: (id: string) => apiRequest(`/reports/${id}`),
    create: (data: any) => apiRequest('/reports', 'POST', data),
    update: (id: string, data: any) => apiRequest(`/reports/${id}`, 'PUT', data),
    delete: (id: string) => apiRequest(`/reports/${id}`, 'DELETE'),
    getPDF: async (id: string) => {
      const token = await AsyncStorage.getItem('afi_token');
      const baseUrl = BASE_URL;
      
      const response = await fetch(`${baseUrl}/reports/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      return await response.blob();
    }
  }
};
