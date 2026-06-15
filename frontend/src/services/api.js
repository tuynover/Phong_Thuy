import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const calculateDivination = (lines, userId, question, now) => axios.post(`${API_URL}/calculate`, { lines, userId, question, now });
export const getConcept = (term) => axios.get(`${API_URL}/concept/${term}`);
export const getHexagramHistory = (userId) => axios.get(`${API_URL}/history/hexagrams/${userId}`);
export const getHexagramRecord = (id) => axios.get(`${API_URL}/history/hexagrams/record/${id}`);
export const getBaziHistory = (userId) => axios.get(`${API_URL}/history/bazi/${userId}`);
export const getHexagramChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/history/hexagrams/${id}/messages?page=${page}&limit=${limit}`);
export const getBaziChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/history/bazi/${id}/messages?page=${page}&limit=${limit}`);
export const rateHexagram = (id, rating, feedback) => axios.put(`${API_URL}/history/hexagrams/${id}/rate`, { rating, feedback });
export const rateBazi = (id, rating, feedback) => axios.put(`${API_URL}/history/bazi/${id}/rate`, { rating, feedback });
export const linkHexagram = (id, userId) => axios.put(`${API_URL}/history/hexagrams/${id}/link`, { userId });
export const linkBazi = (id, userId) => axios.put(`${API_URL}/history/bazi/${id}/link`, { userId });

// Notifications API
export const getNotifications = () => axios.get(`${API_URL}/notifications`);
export const markNotificationRead = (id) => axios.put(`${API_URL}/notifications/${id}/read`);
export const markAllNotificationsRead = () => axios.put(`${API_URL}/notifications/read-all`);
export const updateBaziInfo = (userId, day, month, year, hour, minute) => axios.put(`${API_URL}/auth/bazi`, { userId, day, month, year, hour, minute });
export const updateProfile = (profileData) => axios.put(`${API_URL}/auth/profile`, profileData);
export const analyzeBazi = (date, time, gender, userId) => axios.post(`${API_URL}/bazi/analyze`, { date, time, gender, userId });
export const interpretHexagram = (id) => axios.post(`${API_URL}/history/hexagrams/${id}/interpret`);
export const getInterpretationStreamUrl = (type, id) => {
  if (type === 'tu_vi') return `${API_URL}/tu-vi/${id}/interpret`;
  return `${API_URL}/history/${type}/${id}/interpret`;
};
export const getChatStreamUrl = (type, id) => {
  if (type === 'tu_vi') return `${API_URL}/tu-vi/${id}/chat`;
  return `${API_URL}/history/${type}/${id}/chat`;
};

// Tử Vi API Endpoints
export const createTuViChart = (date, hour, gender, userId) => axios.post(`${API_URL}/tu-vi`, { date, hour, gender, userId });
export const interpretTuVi = (id) => axios.post(`${API_URL}/tu-vi/${id}/interpret`);
export const checkTuViJob = (jobId) => axios.get(`${API_URL}/tu-vi/jobs/${jobId}`);
export const getTuViHistory = (userId) => axios.get(`${API_URL}/tu-vi/history/${userId}`);
export const getTuViRecord = (id) => axios.get(`${API_URL}/tu-vi/${id}`);
export const rateTuVi = (id, rating, feedback) => axios.put(`${API_URL}/tu-vi/${id}/rate`, { rating, feedback });
export const getTuViChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/tu-vi/${id}/messages?page=${page}&limit=${limit}`);

