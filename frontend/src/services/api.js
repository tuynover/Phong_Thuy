import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const calculateDivination = (lines) => axios.post(`${API_URL}/calculate`, { lines });
export const getConcept = (term) => axios.get(`${API_URL}/concept/${term}`);
export const analyzeBazi = (date, time, gender) => axios.post(`${API_URL}/bazi/analyze`, { date, time, gender });
