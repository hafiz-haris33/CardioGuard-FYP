import axios from 'axios';
import { fetchHistoricalData } from './firebaseService';

// APNA IP ADDRESS YAHAN VERIFY KAR LEN
const BASE_URL = 'http://10.141.212.143:8000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

export const healthService = {
  getLatestSpO2: async () => {
    return { oxygen_level: 98 };
  },
  
  getAverageHeartRate: async () => {
    return { average_bpm: 64 };
  },

  getHistoricalStats: async (deviceId: string, days: number) => {
    const dataPoints = days === 1 ? 24 : 30;
    const fallback = {
      hrHistory: Array(dataPoints).fill(72),
      spo2History: Array(dataPoints).fill(98),
      avgHr: 72,
      avgSpO2: 98
    };

    // Agar deviceId 'unknown' hai to Firebase par ja kar time zaya mat karo
    if (!deviceId || deviceId === 'unknown') {
        return fallback;
    }

    const data = await fetchHistoricalData(deviceId, days);
    return data || fallback;
  }
};

export const insightsService = {
  getLatestInsight: async () => {
    return {
      title: 'CardioGuard Insight',
      description: 'Your cardiac health analysis',
      recommendation: 'Your cardiac rhythm is steady. Consider a light 15-minute walk to maintain your resting heart rate goal.'
    };
  }
};