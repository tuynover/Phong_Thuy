import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const calculateDivination = (lines, userId, question) => axios.post(`${API_URL}/calculate`, { lines, userId, question });
export const getConcept = (term) => axios.get(`${API_URL}/concept/${term}`);
export const getHexagramHistory = (userId) => axios.get(`${API_URL}/history/hexagrams/${userId}`);
export const getBaziHistory = (userId) => axios.get(`${API_URL}/history/bazi/${userId}`);
export const rateHexagram = (id, rating, feedback) => axios.put(`${API_URL}/history/hexagrams/${id}/rate`, { rating, feedback });
export const rateBazi = (id, rating, feedback) => axios.put(`${API_URL}/history/bazi/${id}/rate`, { rating, feedback });
export const linkHexagram = (id, userId) => axios.put(`${API_URL}/history/hexagrams/${id}/link`, { userId });
export const linkBazi = (id, userId) => axios.put(`${API_URL}/history/bazi/${id}/link`, { userId });
export const updateBaziInfo = (userId, day, month, year, hour, minute) => axios.put(`${API_URL}/auth/bazi`, { userId, day, month, year, hour, minute });
export const analyzeBazi = (date, time, gender, userId) => axios.post(`${API_URL}/bazi/analyze`, { date, time, gender, userId });
export const interpretHexagram = (id) => axios.post(`${API_URL}/history/hexagrams/${id}/interpret`);
