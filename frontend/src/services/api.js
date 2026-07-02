import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// IChing (Kinh Dịch) API Endpoints
export const calculateDivination = (lines, userId, question, now) => axios.post(`${API_URL}/iching/calculate`, { lines, userId, question, now });
export const getConcept = (term) => axios.get(`${API_URL}/concept/${term}`);
export const getIChingHistory = (userId) => axios.get(`${API_URL}/history/iching/${userId}`);
export const getIChingRecord = (id) => axios.get(`${API_URL}/history/iching/record/${id}`);
export const getIChingChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/history/iching/${id}/messages?page=${page}&limit=${limit}`);
export const rateIChing = (id, rating, feedback) => axios.put(`${API_URL}/history/iching/${id}/rate`, { rating, feedback });
export const linkIChing = (id, userId) => axios.put(`${API_URL}/history/iching/${id}/link`, { userId });
export const interpretIChing = (id) => axios.post(`${API_URL}/history/iching/${id}/interpret`);

// Bazi (Bát Tự) API Endpoints
export const getBaziHistory = (userId) => axios.get(`${API_URL}/history/bazi/${userId}`);
export const getBaziRecord = (id) => axios.get(`${API_URL}/history/bazi/record/${id}`);
export const getBaziChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/history/bazi/${id}/messages?page=${page}&limit=${limit}`);
export const rateBazi = (id, rating, feedback) => axios.put(`${API_URL}/history/bazi/${id}/rate`, { rating, feedback });
export const linkBazi = (id, userId) => axios.put(`${API_URL}/history/bazi/${id}/link`, { userId });
export const analyzeBazi = (date, time, gender, userId) => axios.post(`${API_URL}/bazi/analyze`, { date, time, gender, userId });

// Marriage (Hôn Nhân) API Endpoints
export const analyzeMarriage = (male, female, userId) => axios.post(`${API_URL}/marriage/analyze`, { male, female, userId });
export const getMarriageHistory = (userId) => axios.get(`${API_URL}/history/marriage/${userId}`);
export const getMarriageRecord = (id) => axios.get(`${API_URL}/history/marriage/record/${id}`);
export const rateMarriage = (id, rating, feedback) => axios.put(`${API_URL}/history/marriage/${id}/rate`, { rating, feedback });
export const getMarriageChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/history/marriage/${id}/messages?page=${page}&limit=${limit}`);

// Ziwei (Tử Vi) API Endpoints
export const createZiweiChart = (date, hour, gender, userId) => axios.post(`${API_URL}/ziwei`, { date, hour, gender, userId });
export const interpretZiwei = (id) => axios.post(`${API_URL}/ziwei/${id}/interpret`);
export const getZiweiHistory = (userId) => axios.get(`${API_URL}/ziwei/history/${userId}`);
export const getZiweiRecord = (id) => axios.get(`${API_URL}/ziwei/${id}`);
export const rateZiwei = (id, rating, feedback) => axios.put(`${API_URL}/ziwei/${id}/rate`, { rating, feedback });
export const getZiweiChatMessages = (id, page = 1, limit = 20) => axios.get(`${API_URL}/ziwei/${id}/messages?page=${page}&limit=${limit}`);
export const linkZiwei = (id, userId) => axios.put(`${API_URL}/history/ziwei/${id}/link`, { userId });

// Notifications & User Profile API
export const getNotifications = () => axios.get(`${API_URL}/notifications`);
export const markNotificationRead = (id) => axios.put(`${API_URL}/notifications/${id}/read`);
export const markAllNotificationsRead = () => axios.put(`${API_URL}/notifications/read-all`);
export const updateBaziInfo = (userId, day, month, year, hour, minute) => axios.put(`${API_URL}/auth/bazi`, { userId, day, month, year, hour, minute });
export const updateProfile = (profileData) => axios.put(`${API_URL}/auth/profile`, profileData);
export const changePassword = (currentPassword, newPassword) => axios.put(`${API_URL}/auth/change-password`, { currentPassword, newPassword });

export const getInterpretationStreamUrl = (type, id) => {
  if (type === 'tu_vi' || type === 'ziwei') return `${API_URL}/ziwei/${id}/interpret`;
  if (type === 'hexagrams' || type === 'iching') return `${API_URL}/history/iching/${id}/interpret`;
  return `${API_URL}/history/${type}/${id}/interpret`;
};
export const getChatStreamUrl = (type, id) => {
  if (type === 'tu_vi' || type === 'ziwei') return `${API_URL}/ziwei/${id}/chat`;
  if (type === 'hexagrams' || type === 'iching') return `${API_URL}/history/iching/${id}/chat`;
  return `${API_URL}/history/${type}/${id}/chat`;
};

// Admin API Endpoints
export const getAdminUsers = (params) => axios.get(`${API_URL}/admin/users`, { params });
export const updateAdminUserRole = (id, role) => axios.put(`${API_URL}/admin/users/${id}/role`, { role });
export const updateAdminUserCredits = (id, credits, mode) => axios.put(`${API_URL}/admin/users/${id}/credits`, { credits, mode });
export const lockAdminUser = (id, reason) => axios.post(`${API_URL}/admin/users/${id}/lock`, { reason });
export const unlockAdminUser = (id) => axios.post(`${API_URL}/admin/users/${id}/unlock`);
export const deleteAdminUser = (id) => axios.delete(`${API_URL}/admin/users/${id}`);

export const getAdminCalculations = (params) => axios.get(`${API_URL}/admin/calculations`, { params });
export const getAdminCalculationDetail = (type, id) => axios.get(`${API_URL}/admin/calculations/${type}/${id}`);
export const lockAdminCalculation = (type, id) => axios.post(`${API_URL}/admin/calculations/${type}/${id}/lock`);
export const unlockAdminCalculation = (type, id) => axios.post(`${API_URL}/admin/calculations/${type}/${id}/unlock`);
export const deleteAdminCalculation = (type, id) => axios.delete(`${API_URL}/admin/calculations/${type}/${id}`);

export const getAdminAnalytics = (startDate, endDate, groupBy) => axios.get(`${API_URL}/admin/analytics`, { params: { startDate, endDate, groupBy } });
export const getAdminNotifications = () => axios.get(`${API_URL}/admin/notifications`);
export const markAdminNotificationRead = (id) => axios.put(`${API_URL}/admin/notifications/${id}/read`);
export const resolveAdminAppeal = (id, action) => axios.post(`${API_URL}/admin/appeals/${id}/resolve`, { action });

// Ban Appeal & Stats
export const submitBanAppeal = (userId, email, reason, message) => axios.post(`${API_URL}/auth/appeal`, { userId, email, reason, message });
export const restoreAdminUser = (id) => axios.post(`${API_URL}/admin/users/${id}/restore`);
export const getAdminUserStats = (id) => axios.get(`${API_URL}/admin/users/${id}/stats`);
export const deleteCalculation = (type, id) => axios.delete(`${API_URL}/history/calculations/${type}/${id}`);

// Backward compatibility legacy aliases
export const getHexagramHistory = getIChingHistory;
export const getHexagramRecord = getIChingRecord;
export const getHexagramChatMessages = getIChingChatMessages;
export const rateHexagram = rateIChing;
export const linkHexagram = linkIChing;
export const interpretHexagram = interpretIChing;

export const createTuViChart = createZiweiChart;
export const interpretTuVi = interpretZiwei;
export const getTuViHistory = getZiweiHistory;
export const getTuViRecord = getZiweiRecord;
export const rateTuVi = rateZiwei;
export const getTuViChatMessages = getZiweiChatMessages;
