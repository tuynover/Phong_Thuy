import React, { useState, useEffect, useContext, useRef } from 'react';
import IChingInput from './IChingInput';
import ProfileBoard from './ProfileBoard';
import IChingBoard from './IChingBoard';
import BaziInput from './BaziInput';
import AuthModal from './AuthModal';
import UpdateBaziModal from './UpdateBaziModal';
import NotificationBell from './NotificationBell';
import { AuthContext } from '../context/AuthContext';
import { 
  calculateDivination, 
  analyzeBazi, 
  linkIChing, 
  linkBazi, 
  getIChingRecord, 
  getIChingHistory, 
  getBaziHistory, 
  getZiweiHistory, 
  analyzeMarriage,
  getMarriageHistory,
  getBaziRecord,
  getMarriageRecord,
  updateBaziInfo
} from '../services/api';
import { UserCircle, LogOut, CalendarDays, Shield, Menu, X, History, Compass, Activity, BarChart3, Heart, Calendar, HelpCircle, ArrowUp, ArrowDown, BookOpen, Home, ChevronLeft, ChevronRight, Sparkles, Folder } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import MarriageInput from './MarriageInput';
import HistoryBoard from './HistoryBoard';
import MyFoldersModal from './MyFoldersModal';
import HomeBoard from './HomeBoard';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

import BaziBoard from './BaziBoard';
import ZiweiBoard from './ZiweiBoard';
import MarriageBoard from './MarriageBoard';
import DateSelectionBoard from './DateSelectionBoard';
import BlogBoard from './BlogBoard';
import Footer from './Footer';
import { AboutUs, PrivacyPolicy, TermsOfService } from './InfoBoards';

export default function UserApp({ onSwitchToAdmin }) {
  // Parse URL query parameter for deep-linking blog posts
  const getInitialBlogSlug = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/blog/')) {
        return path.substring(6); // Lấy phần sau '/blog/'
      }
      const params = new URLSearchParams(window.location.search);
      return params.get('post') || params.get('blogSlug') || null;
    }
    return null;
  };

  const initialUrlSlug = getInitialBlogSlug();
  const [loadingShared, setLoadingShared] = useState(false);
  const [sharedError, setSharedError] = useState(null);

  const [appMode, setAppMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/bazi/record/')) return 'bazi';
      if (path.startsWith('/ziwei/record/')) return 'ziwei';
      if (path.startsWith('/iching/record/')) return 'iching';
      if (path.startsWith('/marriage/record/')) return 'marriage';
      if (path === '/bazi') return 'bazi';
      if (path === '/iching') return 'iching';
      if (path === '/ziwei') return 'ziwei';
      if (path === '/marriage') return 'marriage';
      if (path === '/xemngay') return 'xemngay';
      if (path === '/blog') return 'blog';
      if (path.startsWith('/blog/')) return 'blog';
      if (path === '/about') return 'about';
      if (path === '/privacy') return 'privacy';
      if (path === '/terms') return 'terms';
    }
    if (initialUrlSlug) return 'blog';
    const saved = localStorage.getItem('appMode');
    return saved === 'tuvi' ? 'ziwei' : (saved || 'home');
  }); // 'home' | 'iching' | 'bazi' | 'ziwei' | 'marriage' | 'xemngay' | 'history' | 'profile' | 'blog'
  
  const [blogSlug, setBlogSlug] = useState(initialUrlSlug);
  const [previousMode, setPreviousMode] = useState('home');

  // Tự động nạp dữ liệu lá số/quẻ dịch công khai khi truy cập trực tiếp bằng liên kết chia sẻ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname;

    const fetchSharedData = async () => {
      // 1. Tứ Trụ Bát Tự
      const baziMatch = path.match(/^\/bazi\/record\/([a-zA-Z0-9-]+)/);
      if (baziMatch) {
        const id = baziMatch[1];
        setLoadingShared(true);
        try {
          const res = await getBaziRecord(id);
          setBaziResult(res.data);
        } catch (err) {
          console.error("Lỗi nạp lá số Bát Tự chia sẻ:", err);
          setSharedError("Không thể tải lá số Bát Tự chia sẻ hoặc đã bị tắt chế độ công khai.");
        } finally {
          setLoadingShared(false);
        }
        return;
      }

      // 2. Mệnh Số Tử Vi
      const ziweiMatch = path.match(/^\/ziwei\/record\/([a-zA-Z0-9-]+)/);
      if (ziweiMatch) {
        const id = ziweiMatch[1];
        setHistoricalZiweiId(id);
        return;
      }

      // 3. Kinh Dịch Lục Hào
      const ichingMatch = path.match(/^\/iching\/record\/([a-zA-Z0-9-]+)/);
      if (ichingMatch) {
        const id = ichingMatch[1];
        setLoadingShared(true);
        try {
          const res = await getIChingRecord(id);
          setResult(res.data);
        } catch (err) {
          console.error("Lỗi nạp quẻ Kinh Dịch chia sẻ:", err);
          setSharedError("Không thể tải quẻ dịch chia sẻ hoặc đã bị tắt chế độ công khai.");
        } finally {
          setLoadingShared(false);
        }
        return;
      }

      // 4. Bát Tự Hợp Hôn
      const marriageMatch = path.match(/^\/marriage\/record\/([a-zA-Z0-9-]+)/);
      if (marriageMatch) {
        const id = marriageMatch[1];
        setLoadingShared(true);
        try {
          const res = await getMarriageRecord(id);
          setMarriageResult(res.data);
        } catch (err) {
          console.error("Lỗi nạp kết quả Hợp Hôn chia sẻ:", err);
          setSharedError("Không thể tải kết quả hợp hôn chia sẻ hoặc đã bị tắt chế độ công khai.");
        } finally {
          setLoadingShared(false);
        }
        return;
      }
    };

    fetchSharedData();
  }, []);

  // Cập nhật canonical link & title động theo phân hệ để tối ưu SEO
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 1. Cập nhật Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentUrl = window.location.origin + window.location.pathname;
    canonical.setAttribute('href', currentUrl);

    // 2. Cập nhật Title động
    const titleMap = {
      home: "Phong Thủy Luận Giải - Kinh Dịch, Bát Tự, Tử Vi & Hôn Nhân AI",
      iching: "Gieo Quẻ Kinh Dịch Lục Hào & Mai Hoa Dịch Số - Phong Thủy AI",
      bazi: "Lập Lá Số Tứ Trụ Bát Tự & Phân Tích Ngũ Hành - Phong Thủy AI",
      ziwei: "Lập Mệnh Bàn Tử Vi Đẩu Số 12 Cung - Phong Thủy AI",
      marriage: "Xem Tuổi Kết Hôn & Hợp Hôn Gia Đạo - Phong Thủy AI",
      xemngay: "Xem Ngày Tốt Hoàng Đạo & Cát Hung Trạch Cát - Phong Thủy AI",
      about: "Giới Thiệu - Phong Thủy Luận Giải AI",
      privacy: "Chính Sách Bảo Mật - Phong Thủy Luận Giải AI",
      terms: "Điều Khoản Sử Dụng - Phong Thủy Luận Giải AI",
      blog: "Kiến Thức Phong Thủy & Chiêm Nghiệm Học Thuật",
      history: "Lịch Sử Luận Giải Phong Thủy & Quẻ Dịch - Phong Thủy AI",
      profile: "Thông Tin Cá Nhân & Hồ Sơ Bát Tự - Phong Thủy AI"
    };
    if (titleMap[appMode]) {
      document.title = titleMap[appMode];
    }
  }, [appMode]);
  
  const handleSelectModule = (mode, slug = null) => {
    // Không ghi đè previousMode bằng các trang thông tin phụ
    if (appMode !== 'about' && appMode !== 'privacy' && appMode !== 'terms') {
      setPreviousMode(appMode);
    }
    setAppMode(mode);
    setBlogSlug(slug);
    if (mode === 'blog' && slug) {
      const newUrl = `/blog/${slug}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } else if (mode === 'blog' && slug === null) {
      const newUrl = `/blog`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } else if (mode === 'about' || mode === 'privacy' || mode === 'terms') {
      const newUrl = `/${mode}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } else if (['iching', 'bazi', 'ziwei', 'marriage', 'xemngay'].includes(mode) && slug === null) {
      const newUrl = `/${mode}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } else if (mode === 'home') {
      window.history.pushState({ path: '/' }, '', '/');
    } else if (slug === null && mode !== 'blog') {
      window.history.pushState({ path: '/' }, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearBlogSlug = () => {
    setBlogSlug(null);
    const newUrl = `/blog`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileModulesExpanded, setIsMobileModulesExpanded] = useState(false);
  
  // Auth
  const { user, setUser, logout } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [preloadedHistory, setPreloadedHistory] = useState(null);

  const preloadHistoryLists = () => {
    if (!user || preloadedHistory) return;
    const userId = user.id || user._id;
    if (!userId || userId === 'undefined') return;
    const promise = Promise.all([

      getIChingHistory(userId),
      getBaziHistory(userId),
      getZiweiHistory(userId),
      getMarriageHistory(userId)
    ]).then(([hexRes, baziRes, ziweiRes, marriageRes]) => {
      const data = {
        hexagrams: hexRes.data,
        bazis: baziRes.data,
        tuvis: ziweiRes.data, // keep key name for history component compatibility
        marriages: marriageRes.data,
        promise: null
      };
      setPreloadedHistory(data);
      return data;
    }).catch(err => {
      console.error("Error preloading history lists:", err);
      setPreloadedHistory(null);
    });

    setPreloadedHistory({
      hexagrams: null,
      bazis: null,
      tuvis: null,
      marriages: null,
      promise
    });
  };

  const invalidateHistoryCache = () => {
    setPreloadedHistory(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileModulesExpanded) return;
    const handleScroll = () => {
      setIsMobileModulesExpanded(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileModulesExpanded]);

  // Dynamic SEO Page Title Update
  useEffect(() => {
    const pageTitles = {
      home: 'Phong Thủy Luận Giải - Gieo Quẻ Kinh Dịch, Bát Tự, Tử Vi AI',
      iching: 'Gieo Quẻ Kinh Dịch Lục Hào - Phong Thủy Luận Giải AI',
      bazi: 'Lập Lá Số Tứ Trụ Bát Tự - Phong Thủy Luận Giải AI',
      ziwei: 'Lập Lá Số Tử Vi Đẩu Số - Phong Thủy Luận Giải AI',
      marriage: 'Xem Tuổi Hợp Hôn Gia Đạo - Phong Thủy Luận Giải AI',
      xemngay: 'Xem Ngày Tốt Hoàng Đạo - Phong Thủy Luận Giải AI',
      blog: 'Kiến Thức Phong Thủy & Chiêm Nghiệm - Bài Viết Học Thuật',
      history: 'Lịch Sử Tra Cứu - Phong Thủy Luận Giải',
      profile: 'Hồ Sơ Cá Nhân - Phong Thủy Luận Giải'
    };
    document.title = pageTitles[appMode] || 'Phong Thủy Luận Giải';
  }, [appMode]);

  // Ziwei State
  const [historicalZiweiId, setHistoricalZiweiId] = useState(null);
  const [autoSubmitZiwei, setAutoSubmitZiwei] = useState(null);

  // I Ching State
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'coin'); // 'coin' | 'manual' | 'maihoa'
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [question, setQuestion] = useState(() => localStorage.getItem('question') || '');
  
  // Bazi State
  const [baziResult, setBaziResult] = useState(() => {
    try {
      const saved = localStorage.getItem('baziResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [marriageResult, setMarriageResult] = useState(() => {
    try {
      const saved = localStorage.getItem('marriageResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // Shared State
  const [loading, setLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [guestBaziId, setGuestBaziId] = useState(null);
  const [isUpdateBaziOpen, setIsUpdateBaziOpen] = useState(false);
  const [isMyFoldersOpen, setIsMyFoldersOpen] = useState(false);
  const [isZiweiResultLoaded, setIsZiweiResultLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  };


  // Persist State across Refreshes
  useEffect(() => {
    localStorage.setItem('appMode', appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem('mode', mode);
  }, [mode]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('result', JSON.stringify(result));
    } else {
      localStorage.removeItem('result');
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem('question', question);
  }, [question]);

  useEffect(() => {
    if (baziResult) {
      localStorage.setItem('baziResult', JSON.stringify(baziResult));
    } else {
      localStorage.removeItem('baziResult');
    }
  }, [baziResult]);

  useEffect(() => {
    if (marriageResult) {
      localStorage.setItem('marriageResult', JSON.stringify(marriageResult));
    } else {
      localStorage.removeItem('marriageResult');
    }
  }, [marriageResult]);

  // Clear history cache when user logs out or switches accounts
  useEffect(() => {
    setPreloadedHistory(null);
  }, [user?.id, user?._id]);

  const handleDivinationComplete = async (lines, customDate, questionSuffix = '') => {
    setLoading(true);
    try {
      const baseQuestion = question.trim() || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';
      const actualQuestion = baseQuestion + questionSuffix;
      const userId = user ? user.id || user._id : 'guest';
      const res = await calculateDivination(lines, userId, actualQuestion, customDate);
      setResult(res.data);
      invalidateHistoryCache();
      if (userId === 'guest' && res.data.recordId) {
        setCurrentRecordId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  const handleLoginSuccess = (loggedInUser) => {
    const activeUser = loggedInUser || user;
    if (!activeUser) return;
    showToast(`Xin chào ${activeUser.name || 'bạn'}, đăng nhập thành công!`);
    const uid = activeUser.id || activeUser._id;
    if (!uid) return;

    const promises = [];
    if (currentRecordId) {
      promises.push(
        linkIChing(currentRecordId, uid)
          .then(() => setCurrentRecordId(null))
          .catch(err => console.error("Lỗi khi gán quẻ Kinh Dịch:", err))
      );
    }
    if (guestBaziId) {
      promises.push(
        linkBazi(guestBaziId, uid)
          .then(() => setGuestBaziId(null))
          .catch(err => console.error("Lỗi khi gán lá số Bát Tự:", err))
      );
    }

    if (promises.length > 0) {
      Promise.all(promises);
    }
  };


  const handleBaziComplete = async (date, time, gender, name) => {
    setLoading(true);
    try {
      const userId = user ? (user.id || user._id) : 'guest';
      const res = await analyzeBazi(date, time, gender, userId, name);
      setBaziResult(res.data);
      invalidateHistoryCache();
      if (userId === 'guest' && res.data.recordId) {
        setGuestBaziId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Bát Tự.');
    }
    setLoading(false);
  };

  const handleViewDestinyFromHome = (info) => {
    const { day, month, year, hour, minute, gender, name, target } = info;
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    const y = String(year);
    const h = String(hour).padStart(2, '0');
    const min = String(minute || '00').padStart(2, '0');
    
    if (target === 'bazi') {
      const formattedDate = `${d}/${m}/${y}`;
      const formattedTime = `${h}:${min}`;
      const genderVal = gender === 'Nam' ? 1 : 0;
      handleBaziComplete(formattedDate, formattedTime, genderVal, name || user?.name);
      setAppMode('bazi');
    } else if (target === 'ziwei') {
      const dateStr = `${y}-${m}-${d}`;
      setAutoSubmitZiwei({ dateStr, hourStr: h, genderStr: gender, nameStr: name || user?.name });
      setHistoricalZiweiId(null);
      setAppMode('ziwei');
    }
  };

  const handleMarriageComplete = async (male, female) => {
    setLoading(true);
    try {
      const userId = user ? (user.id || user._id) : 'guest';
      const res = await analyzeMarriage(male, female, userId);
      setMarriageResult(res.data);
      invalidateHistoryCache();
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Hợp Hôn.');
    }
    setLoading(false);
  };

  const handleViewHistoricalHexagram = (recordWrapper) => {
    const id = recordWrapper._id || recordWrapper.id;
    setResult({
      _id: id,
      recordId: id,
      primary: recordWrapper.primaryHexagram,
      secondary: recordWrapper.transformedHexagram,
      primaryLines: recordWrapper.primaryLines || [],
      secondaryLines: recordWrapper.secondaryLines || [],
      movingLines: recordWrapper.movingLines || [],
      dateInfo: recordWrapper.lunarDateInfo,
      aiInterpretation: recordWrapper.aiInterpretation || '',
      rating: recordWrapper.rating,
      feedback: recordWrapper.feedback
    });
    setAppMode('iching');
  };

  const handleViewHexagramDetail = handleViewHistoricalHexagram;

  const handleViewHistoricalBazi = async (record) => {
    if (!record) return;
    const id = record._id || record.id;
    let target = record;
    if (!target.baziData && !target.analysisSnapshot && !target.canChi && !target.fiveElements) {
      try {
        const res = await getBaziRecord(id);
        if (res.data) target = res.data;
      } catch (err) {
        console.error("Lỗi khi tải lá số Bát Tự chi tiết:", err);
      }
    }
    const baziObj = target.baziData || target.analysisSnapshot || target.result || target;
    setBaziResult({
      ...baziObj,
      _id: id,
      recordId: id,
      userId: target.userId,
      isPublic: target.isPublic,
      gender: target.inputInfo?.gender ?? baziObj.gender,
      name: target.inputInfo?.name ?? baziObj.name,
      inputInfo: target.inputInfo || baziObj.inputInfo,
      aiInterpretation: target.aiInterpretation || baziObj.aiInterpretation,
      rating: target.rating ?? baziObj.rating,
      feedback: target.feedback ?? baziObj.feedback
    });
    setAppMode('bazi');
  };

  const handleViewHistoricalZiwei = (record) => {
    if (!record) return;
    setHistoricalZiweiId(record._id || record.id);
    setAppMode('ziwei');
  };

  const handleViewHistoricalMarriage = async (record) => {
    if (!record) return;
    const id = record._id || record.id;
    let target = record;
    if (!target.maleBaziData || !target.femaleBaziData || !target.maleBaziData.canChi) {
      try {
        const res = await getMarriageRecord(id);
        if (res.data) target = res.data;
      } catch (err) {
        console.error("Lỗi khi tải chi tiết Hôn Nhân:", err);
      }
    }
    const marriageObj = target.marriageData || target.analysisSnapshot || target.result || target;
    setMarriageResult({
      ...marriageObj,
      _id: id,
      recordId: id,
      userId: target.userId,
      isPublic: target.isPublic,
      maleBaziData: target.maleBaziData || marriageObj.maleBaziData || {},
      femaleBaziData: target.femaleBaziData || marriageObj.femaleBaziData || {},
      inputInfo: target.inputInfo || marriageObj.inputInfo,
      aiInterpretation: target.aiInterpretation || marriageObj.aiInterpretation,
      rating: target.rating ?? marriageObj.rating,
      feedback: target.feedback ?? marriageObj.feedback
    });
    setAppMode('marriage');
  };

  const handleNotificationClick = async (hexagramId) => {
    setLoading(true);
    try {
      const res = await getIChingRecord(hexagramId);
      handleViewHistoricalHexagram(res.data);
    } catch (err) {
      console.error("Lỗi khi tải thông tin quẻ từ thông báo:", err);
      alert("Không thể mở chi tiết quẻ này.");
    }
    setLoading(false);
  };

  const handleViewOwnBazi = async () => {
    if (!user) return;
    if (!user.baziInfo || !user.baziInfo.day) {
      setIsUpdateBaziOpen(true);
      return;
    }
    const { day, month, year, hour, minute } = user.baziInfo;
    const formattedDate = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
    const formattedTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    const genderVal = user.gender !== undefined ? user.gender : 1;

    if (user.baziInfo.ownBaziRecordId) {
      setLoading(true);
      try {
        const res = await getBaziRecord(user.baziInfo.ownBaziRecordId);
        const record = res.data;
        if (record && record.inputInfo && 
            record.inputInfo.date === formattedDate && 
            record.inputInfo.time === formattedTime && 
            record.inputInfo.gender === genderVal &&
            !record.isDeleted) {
          setBaziResult(record.baziData ? {
            ...record.baziData,
            gender: record.inputInfo.gender,
            recordId: record._id,
            aiInterpretation: record.aiInterpretation,
            rating: record.rating,
            feedback: record.feedback
          } : record);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi tải lá số bản thân:", err);
      }
    }

    setLoading(true);
    try {
      const userId = user.id || user._id;
      const res = await analyzeBazi(formattedDate, formattedTime, genderVal, userId);
      setBaziResult(res.data);
      invalidateHistoryCache();

      const newRecordId = res.data.recordId || res.data._id;
      if (newRecordId) {
        const updateRes = await updateBaziInfo(
          userId, 
          day, month, year, hour, minute, 
          newRecordId, // pass ownBaziRecordId
          user.baziInfo.ownZiweiRecordId // pass existing ownZiweiRecordId
        );
        if (updateRes.data && updateRes.data.user) {
          setUser(updateRes.data.user);
          localStorage.setItem('user', JSON.stringify(updateRes.data.user));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Bát Tự.');
    }
    setLoading(false);
  };
  const shouldShowScrollButtons = 
    appMode === 'home' ||
    appMode === 'history' ||
    appMode === 'blog' ||
    (appMode === 'iching' && !result) ||
    (appMode === 'bazi' && !baziResult) ||
    (appMode === 'marriage' && !marriageResult) ||
    appMode === 'ziwei';

  return (
    <div className={`min-h-screen font-sans text-neutral-800 flex flex-col ${appMode === 'home' ? 'bg-slate-50' : 'bg-[#f8f5f0]'}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 glass-card bg-slate-900/90 text-white border border-slate-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-xs sm:text-sm"
          >
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL STICKY HEADER */}
      <motion.header 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`sticky top-0 z-40 w-full backdrop-blur-md border-b border-slate-200/50 py-2.5 px-3 sm:px-4 shadow-sm ${appMode === 'home' ? 'bg-white/80' : 'bg-[#f8f5f0]/95'}`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full relative">
          
          {/* Logo on the left */}
          <div 
            onClick={() => handleSelectModule('home')} 
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
            <span className="font-extrabold text-slate-800 tracking-wider text-xs sm:text-sm font-[Montserrat] hidden min-[380px]:inline">
              PHONG THỦY
            </span>
          </div>

          {/* Desktop Center Navigation Tabs */}
          <div className="hidden md:flex items-center bg-white/70 p-1 gap-0.5 sm:gap-1 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-sm">
            <button 
              onClick={() => handleSelectModule('home')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'home' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Trang Chủ
            </button>
            <button 
              onClick={() => handleSelectModule('blog')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'blog' ? 'bg-indigo-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Kiến thức
            </button>
            <button 
              onClick={() => handleSelectModule('iching')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Kinh Dịch
            </button>
            <button 
              onClick={() => handleSelectModule('bazi')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Bát Tự
            </button>
            <button 
              onClick={() => {
                setHistoricalZiweiId(null);
                handleSelectModule('ziwei');
              }} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Tử Vi
            </button>
            <button 
              onClick={() => handleSelectModule('marriage')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Hôn Nhân
            </button>
            <button 
              onClick={() => handleSelectModule('xemngay')} 
              className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'xemngay' ? 'bg-emerald-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
            >
              Xem Ngày
            </button>
            {user && (
              <button 
                onClick={() => handleSelectModule('history')} 
                onMouseEnter={preloadHistoryLists}
                onTouchStart={preloadHistoryLists}
                className={`px-4 py-1.5 rounded-full font-bold text-xs tracking-wider font-[Montserrat] uppercase ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'}`}
              >
                Lịch Sử
              </button>
            )}
          </div>

          {/* RIGHT SIDE SECTION: UTILITIES & AUTH */}
          <div className="flex items-center gap-3 shrink-0">


            {/* Sliding Pill Toggle Switch for Admin/Co-admin in UserApp */}
            {user && (user.role === 'admin' || user.role === 'co-admin') && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:inline">Giao diện:</span>
                <div className="relative inline-flex items-center bg-gray-200/70 rounded-full p-1 cursor-pointer select-none w-28 h-8 border border-slate-200">
                  <div 
                    onClick={onSwitchToAdmin}
                    className="absolute top-0.5 bottom-0.5 left-0.5 bg-indigo-650 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      width: 'calc(50% - 2px)',
                      transform: 'translateX(52px)',
                      backgroundColor: '#4f46e5'
                    }}
                  />
                  <div className="flex w-full text-center text-[9px] font-extrabold tracking-wider z-10">
                    <span onClick={onSwitchToAdmin} className="flex-1 text-slate-550 hover:text-slate-900 transition-colors select-none py-1">ADMIN</span>
                    <span className="flex-1 text-white select-none pointer-events-none py-1">USER</span>
                  </div>
                </div>
              </div>
            )}

            {/* AUTH MENU */}
            <div className="hidden md:block relative" ref={userMenuRef}>
              {user ? (
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200/50 text-xs sm:text-sm relative">
                  <NotificationBell onNotificationClick={handleNotificationClick} />
                  
                  {/* Credits Display */}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[11px] font-extrabold font-[Montserrat] shrink-0">
                    <span>{user.credits !== undefined ? user.credits : 0} 🪙</span>
                  </div>

                  {/* User Dropdown Toggle */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1 text-slate-800 font-semibold max-w-[80px] sm:max-w-none hover:text-slate-950 transition-colors focus:outline-none"
                      title="Hồ sơ cá nhân"
                    >
                      <UserCircle size={18} className="text-slate-600 shrink-0" />
                      <span className="hidden sm:inline truncate max-w-[100px]">{user.name}</span>
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => {
                            setAppMode('profile');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-950 font-bold transition-colors flex items-center gap-2"
                        >
                          <UserCircle size={15} className="text-indigo-600" />
                          Hồ sơ cá nhân
                        </button>
                        <button 
                          onClick={() => {
                            setIsMyFoldersOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-950 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                        >
                          <Folder size={15} className="text-indigo-600" />
                          Lá số của tôi
                        </button>
                        {(user?.role === 'admin' || user?.role === 'co-admin') && (
                          <button 
                            onClick={() => {
                              onSwitchToAdmin();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-indigo-900 hover:bg-indigo-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                          >
                            <Shield size={15} className="text-indigo-700" />
                            Trang quản trị
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            setAppMode('home');
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-650 hover:bg-red-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                        >
                          <LogOut size={15} />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-sm hover:shadow transition-all duration-205 font-bold text-xs sm:text-sm"
                  style={{ backgroundColor: '#4f46e5' }}
                >
                  <UserCircle size={16} className="shrink-0" />
                  <span className="hidden sm:inline">Đăng Nhập</span>
                </button>
              )}
            </div>

            {/* Mobile Layout Header Controls */}
            <div className="flex md:hidden items-center gap-1 sm:gap-1.5">
              {/* Nút Home (bên tay trái phần kiến thức) */}
              <button 
                onClick={() => handleSelectModule('home')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'home' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                title="Trang Chủ"
              >
                <Home size={17} />
              </button>

              {/* Nút Kiến Thức (bên tay trái phần chức năng) */}
              <button 
                onClick={() => handleSelectModule('blog')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'blog' ? 'bg-indigo-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                title="Kiến Thức Phong Thủy"
              >
                <BookOpen size={17} />
              </button>

              {/* Nút Chức Năng (🧭 >) */}
              <button 
                onClick={() => setIsMobileModulesExpanded(!isMobileModulesExpanded)}
                className={`px-2 py-1.5 rounded-full transition-all border flex items-center gap-0.5 shadow-xs cursor-pointer ${
                  isMobileModulesExpanded 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-600'
                }`}
                title="Luận giải mệnh lý"
              >
                <Compass size={16} />
                {isMobileModulesExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              </button>

              {/* Notification Bell */}
              <NotificationBell onNotificationClick={handleNotificationClick} />

              {/* Credits Display */}
              {user && (
                <div className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[10px] sm:text-xs font-extrabold font-[Montserrat] shrink-0 select-none shadow-xs">
                  <span>{user.credits !== undefined ? user.credits : 0} 🪙</span>
                </div>
              )}

              {/* History Button */}
              <button 
                onClick={() => {
                  if (user) {
                    handleSelectModule('history');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                onMouseEnter={preloadHistoryLists}
                onTouchStart={preloadHistoryLists}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
                title="Lịch sử phân tích"
              >
                <History size={17} />
              </button>
              
              {/* Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 grid grid-cols-2 gap-3 md:hidden z-40"
              >
                <div className="grid grid-cols-2 gap-3 col-span-2">
                  {/* TRANG CHỦ */}
                  <button 
                    onClick={() => { handleSelectModule('home'); setIsMobileMenuOpen(false); }}
                    className="col-span-2 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex gap-3 items-center text-left transition-all cursor-pointer"
                  >
                    <Home className="text-slate-600" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Trang Chủ</span>
                  </button>

                  {/* KINH DỊCH */}
                  <button 
                    onClick={() => { handleSelectModule('iching'); setIsMobileMenuOpen(false); }}
                    className="p-3.5 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                  >
                    <Compass className="text-amber-700" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Kinh Dịch</span>
                  </button>

                  {/* BÁT TỰ */}
                  <button 
                    onClick={() => { handleSelectModule('bazi'); setIsMobileMenuOpen(false); }}
                    className="p-3.5 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                  >
                    <Activity className="text-blue-600" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Bát Tự</span>
                  </button>

                  {/* TỬ VI */}
                  <button 
                    onClick={() => {
                      setHistoricalZiweiId(null);
                      handleSelectModule('ziwei');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                  >
                    <BarChart3 className="text-purple-650" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Tử Vi</span>
                  </button>

                  {/* HÔN NHÂN */}
                  <button 
                    onClick={() => { handleSelectModule('marriage'); setIsMobileMenuOpen(false); }}
                    className="p-3.5 rounded-2xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 flex flex-col gap-2 items-start text-left transition-all cursor-pointer"
                  >
                    <Heart className="text-rose-600" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Hôn Nhân</span>
                  </button>

                  {/* XEM NGÀY */}
                  <button 
                    onClick={() => { handleSelectModule('xemngay'); setIsMobileMenuOpen(false); }}
                    className="col-span-2 p-3.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 flex gap-3 items-center text-left transition-all cursor-pointer"
                  >
                    <Calendar className="text-emerald-600" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Xem Ngày Đẹp Hoàng Đạo</span>
                  </button>

                  {/* KIẾN THỨC (BLOG) */}
                  <button 
                    onClick={() => { handleSelectModule('blog'); setIsMobileMenuOpen(false); }}
                    className="col-span-2 p-3.5 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 flex gap-3 items-center text-left transition-all cursor-pointer"
                  >
                    <BookOpen className="text-indigo-650" size={18} />
                    <span className="font-extrabold text-xs text-slate-800">Kiến Thức Phong Thủy</span>
                  </button>

                  {/* AUTH PROFILE / LOGIN BUTTON FOR MOBILE (CENTERED) */}
                  <div className="col-span-2 border-t border-slate-100 pt-4 mt-2 flex flex-col items-center text-center">
                    {user ? (
                      <div className="w-full space-y-4">
                        {/* Centered User Info */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                            <UserCircle size={28} />
                          </div>
                          <div className="space-y-1">
                            <span className="block font-extrabold text-sm text-slate-850">{user.name}</span>
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-850 rounded-full border border-indigo-200/50 text-[10px] font-extrabold">
                              <span>Xu phong thủy: {user.credits !== undefined ? user.credits : 0} 🪙</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Centered Actions */}
                        <div className="flex flex-col gap-2 max-w-[240px] mx-auto w-full">
                          <button 
                            onClick={() => { handleSelectModule('profile'); setIsMobileMenuOpen(false); }}
                            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center font-bold text-xs text-slate-750 transition-colors cursor-pointer"
                          >
                            Hồ sơ cá nhân
                          </button>
                          <button 
                            onClick={() => { setIsMyFoldersOpen(true); setIsMobileMenuOpen(false); }}
                            className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-center font-bold text-xs text-indigo-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Folder size={14} />
                            Lá số của tôi
                          </button>
                          {(user?.role === 'admin' || user?.role === 'co-admin') && (
                            <button 
                              onClick={() => { onSwitchToAdmin(); setIsMobileMenuOpen(false); }}
                              className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 text-center font-bold text-xs transition-colors cursor-pointer"
                            >
                              Trang quản trị
                            </button>
                          )}
                          <button 
                            onClick={() => { logout(); setIsMobileMenuOpen(false); handleSelectModule('home'); }}
                            className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <LogOut size={13} />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                        className="w-full max-w-[240px] py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        style={{ backgroundColor: '#4f46e5' }}
                      >
                        <UserCircle size={16} />
                        <span>Đăng Nhập</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Mobile Sub-Header for Modules (🧭 >) */}
        <AnimatePresence>
          {isMobileModulesExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-200/60 overflow-hidden bg-white/95"
            >
              <div className="flex items-center justify-around py-2.5 px-2 max-w-md mx-auto">
                <button 
                  onClick={() => { handleSelectModule('iching'); setIsMobileModulesExpanded(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'text-amber-850 bg-amber-50/50 border border-amber-100/50 hover:bg-amber-100/50'}`}
                >
                  <Compass size={13} />
                  <span>Kinh Dịch</span>
                </button>
                <button 
                  onClick={() => { handleSelectModule('bazi'); setIsMobileModulesExpanded(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'text-blue-855 bg-blue-50/50 border border-blue-100/50 hover:bg-blue-100/50'}`}
                >
                  <Activity size={13} />
                  <span>Bát Tự</span>
                </button>
                <button 
                  onClick={() => {
                    setHistoricalZiweiId(null);
                    handleSelectModule('ziwei');
                    setIsMobileModulesExpanded(false);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'text-purple-855 bg-purple-50/50 border border-purple-100/50 hover:bg-purple-100/50'}`}
                >
                  <BarChart3 size={13} />
                  <span>Tử Vi</span>
                </button>
                <button 
                  onClick={() => { handleSelectModule('marriage'); setIsMobileModulesExpanded(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${appMode === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'text-rose-855 bg-rose-50/50 border border-rose-100/50 hover:bg-rose-100/50'}`}
                >
                  <Heart size={13} />
                  <span>Hôn Nhân</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* MAIN CONTAINER */}
      <div className={appMode === 'home' ? "flex-1 w-full" : "flex-1 w-full max-w-6xl mx-auto py-6 md:py-10 px-4 space-y-8"}>

        {/* Loading / Error cho lá số được chia sẻ */}
        {loadingShared && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center font-sans text-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang nạp dữ liệu lá số chia sẻ...</p>
          </div>
        )}

        {sharedError && !loadingShared && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center font-sans max-w-md mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-600 border border-rose-100">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg mb-2">Không thể xem lá số</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{sharedError}</p>
            <button
              onClick={() => {
                setSharedError(null);
                handleSelectModule('home');
              }}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-2xl shadow transition-colors active:scale-95 cursor-pointer text-sm"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}

        {!loadingShared && !sharedError && (
          <>
            {appMode === 'iching' && !result ? (
          <header className="text-center mb-12 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-amber-100 border border-amber-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-amber-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-amber-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-amber-955 mb-4 drop-shadow-sm">Kinh Dịch Lục Hào</h1>
            <p className="text-amber-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium mb-6">Hệ thống gieo quẻ và luận giải diễn biến sự việc dựa trên nền tảng Âm Dương Ngũ Hành cổ học.</p>
            
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-amber-900 shadow-sm animate-in fade-in">
              <CalendarDays size={18} className="text-amber-700" />
              <span className="font-medium text-sm md:text-base">Hôm nay: {(() => {
                const l = Lunar.fromDate(new Date());
                return `Ngày ${l.getDay()} tháng ${l.getMonth()} năm ${l.getYear()} Âm lịch`;
              })()}</span>
            </div>
          </header>
        ) : appMode === 'bazi' && !baziResult ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-blue-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-blue-955 mb-6 drop-shadow-sm">Khoa Học Tử Bình</h1>
            <p className="text-blue-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống phân tích Tứ Trụ, đo lường Ngũ Hành và định Dụng Thần cải vận.</p>
          </header>
        ) : appMode === 'ziwei' && !isZiweiResultLoaded ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-purple-100 border border-purple-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-purple-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-purple-955 mb-6 drop-shadow-sm">Mệnh Số Tử Vi</h1>
            <p className="text-purple-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống lập lá số 12 Cung mệnh bàn, định hướng cát hung và luận giải Vận Hạn.</p>
          </header>
        ) : appMode === 'marriage' && !marriageResult ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-rose-100 border border-rose-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-rose-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-rose-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-rose-955 mb-6 drop-shadow-sm">Bát Tự Hợp Hôn</h1>
            <p className="text-rose-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống đối chiếu âm dương ngũ hành, cung phi bản mệnh của hai phối ngẫu.</p>
          </header>
        ) : appMode === 'xemngay' ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-emerald-955 mb-6 drop-shadow-sm">XEM NGÀY ĐẸP</h1>
            <p className="text-emerald-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống chọn lựa ngày lành tháng tốt, xem cát hung giờ hoàng đạo cá nhân hóa theo phong thủy tuổi mệnh.</p>
          </header>
        ) : null}

        {/* SYSTEM BOARDS */}
        {/* SYSTEM 0: HOMEPAGE */}
        {appMode === 'home' && (
          <div>
            <HomeBoard 
              onSelectModule={(module, extra) => {
                if (module === 'history') {
                  if (user) {
                    handleSelectModule('history');
                  } else {
                    setIsAuthModalOpen(true);
                  }
                } else {
                  handleSelectModule(module, extra);
                }
              }}
              user={user}
              onRequireLogin={() => setIsAuthModalOpen(true)}
              onViewDestiny={handleViewDestinyFromHome}
            />
          </div>
        )}

        {/* SYSTEM 1: I CHING */}
        <div className={`${appMode === 'iching' ? 'block' : 'hidden'}`}>
          {!result && (
            <IChingInput 
              question={question}
              setQuestion={setQuestion}
              onComplete={handleDivinationComplete}
              loading={loading}
            />
          )}

          {!result && !loading && (
            <div className="max-w-3xl mx-auto mt-10 space-y-8 font-sans">
              {/* Detailed Academic Cards */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-amber-100 shadow-md">
                <h4 className="text-sm font-extrabold text-amber-800 uppercase tracking-widest text-center mb-6">Kiến thức học thuật Dịch Lý</h4>
                
                <div className="space-y-6">
                  {/* Card 1 */}
                  <div className="border-b border-slate-100 pb-5 text-left">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2.5 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-amber-600 block"></span>
                      1. Kinh Dịch Lục Hào là gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Kinh Dịch Lục Hào là phương pháp chiêm cát hung cổ học dựa trên 64 quẻ Dịch. Mỗi quẻ gồm 6 hào đại diện cho sự biến thiên âm dương của vạn vật tại một thời điểm hệ trọng.
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1 font-medium">
                      <li><strong>Nguyên lý:</strong> Dùng tương tác giữa Thiên Địa Nhân để phản ánh trạng thái sự việc cần hỏi.</li>
                      <li><strong>Quẻ Chủ:</strong> Đại diện cho bối cảnh hiện tại của sự việc khi gieo quẻ.</li>
                      <li><strong>Quẻ Biến:</strong> Kết quả xu hướng phát triển trong tương lai do các Hào Động sinh ra.</li>
                    </ul>
                  </div>

                  {/* Card 2 */}
                  <div className="border-b border-slate-100 pb-5 text-left">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2.5 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-amber-600 block"></span>
                      2. Phương pháp luận quẻ chuyên sâu
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Để giải mã thông tin ẩn chứa trong quẻ, các bậc thầy Dịch học sử dụng các hệ tọa độ tương tác:
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1.5 font-medium">
                      <li><strong>Hào Thế (世):</strong> Đại diện cho bản thể người hỏi, phản ánh nội tâm, năng lực và tình trạng hiện tại.</li>
                      <li><strong>Hào Ứng (应):</strong> Đại diện cho đối phương, mục tiêu cần hướng tới hoặc hoàn cảnh khách quan của sự việc.</li>
                      <li><strong>Dụng Thần (用神):</strong> Chọn 1 trong 5 hào Lục Thân (Phụ Mẫu, Huynh Đệ, Tử Tôn, Thê Tài, Quan Quỷ) làm trung tâm để luận sự việc (ví dụ hỏi tiền tài lấy Thê Tài làm Dụng Thần).</li>
                      <li><strong>Nhật Nguyệt (日/月):</strong> Thiên can và Địa chi của ngày gieo quẻ làm thước đo năng lượng sinh, khắc, vượng, suy cho các Hào.</li>
                    </ul>
                  </div>

                  {/* Card 3 */}
                  <div className="text-left">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2.5 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-amber-600 block"></span>
                      3. Bản luận giải cung cấp những thông tin gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Bản phân tích học thuật từ hệ thống sẽ cung cấp chi tiết:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3.5 mt-3">
                      <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                        <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">✓ Cát hung bản chất</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Xác định sự việc thành công hay thất bại dựa trên tương sinh tương khắc giữa Thế và Dụng Thần.</span>
                      </div>
                      <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                        <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">✓ Thời gian ứng kỳ</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Chỉ rõ thời điểm (ngày, tháng) sự việc sẽ diễn ra cụ thể dựa trên quy luật Hào Động, Tuần Không hoặc Xung Thực.</span>
                      </div>
                      <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                        <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">✓ Lời khuyên Dịch lý</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Lời khuyên ứng xử phù hợp đạo lý nhân quả giúp bạn xu cát tị hung, chủ động chuyển hóa tình huống.</span>
                      </div>
                      <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                        <span className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">✓ Lục thú trì thế</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Tác động tâm lý từ Thanh Long, Chu Tước, Câu Trận, Đằng Xà, Bạch Hổ, Huyền Vũ đến diễn biến sự việc.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQs Section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-md space-y-6">
                <h4 className="text-sm font-extrabold text-amber-800 uppercase tracking-widest text-center">Các câu hỏi thường gặp về Kinh Dịch</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 text-left">
                      <HelpCircle size={15} className="text-amber-600 shrink-0" />
                      Làm thế nào để gieo quẻ có độ chính xác cao nhất?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5 text-left">
                      Bạn cần chọn nơi yên tĩnh, giữ tâm thế thoải mái, tập trung cao độ ý niệm vào câu hỏi duy nhất trong khoảng 1-2 phút trước khi gieo quẻ. Tránh hỏi khi tâm trạng đang quá tức giận, lo âu hoặc hỏi đùa giỡn.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 text-left">
                      <HelpCircle size={15} className="text-amber-600 shrink-0" />
                      Có nên gieo quẻ nhiều lần cho cùng một sự việc không?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5 text-left">
                      Không nên. Kinh Dịch có câu "Sơ phệ cáo, tái tam độc, độc tắc bất cáo" (Lần đầu thì báo tin, hỏi lại hai ba lần là gây nhiễu loạn, nhiễu thì không báo nữa). Chỉ gieo lại khi tình huống có sự biến chuyển hoàn toàn mới.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5 text-left">
                      <HelpCircle size={15} className="text-amber-600 shrink-0" />
                      Nếu quẻ dịch cho kết quả không tốt thì có thay đổi được không?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5 text-left">
                      Kết quả của quẻ dịch chỉ phản ánh diễn biến tự nhiên nếu bạn giữ nguyên thói quen và cách hành xử hiện tại. Kinh Dịch là môn học về "Biến dịch", quẻ xấu là lời cảnh báo để bạn chủ động thay đổi hành vi, tâm tính và cách giải quyết sự việc nhằm đảo chiều kết quả xấu thành cát lành.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
              <IChingBoard result={result} onUpdateResult={setResult} user={user} onRequireLogin={() => setIsAuthModalOpen(true)} onInvalidateHistory={invalidateHistoryCache} />
              <div className="text-center">
                <button 
                  onClick={() => {
                    setResult(null);
                    setTimeout(() => {
                      const element = document.getElementById('iching-input-header');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 50);
                  }} 
                  className="px-10 py-4 bg-white text-amber-900 border-2 border-amber-200 rounded-2xl shadow-md hover:bg-amber-50 hover:border-amber-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                  Gieo Quẻ Mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM 2: BAZI */}
        <div className={`${appMode === 'bazi' ? 'block' : 'hidden'}`}>
          {user && !baziResult && !loading && (
            <div className="max-w-xl mx-auto mb-10 text-center">
              <button 
                onClick={handleViewOwnBazi}
                className="bg-[#faf6f0] border-2 border-amber-200/60 text-amber-900 px-8 py-4 rounded-2xl font-bold shadow-md transition-all hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 active:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 text-lg w-full mb-4"
              >
                Xem Lá Số Của Bản Thân
              </button>
              <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 font-medium text-xs sm:text-sm uppercase">Hoặc lập lá số mới</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-20 animate-in fade-in">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="text-xl font-bold text-blue-800 animate-pulse">Đang nạp thuật toán Tử Bình...</div>
            </div>
          )}

          {!baziResult && !loading && (
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
              <BaziInput onComplete={handleBaziComplete} />
            </div>
          )}

          {baziResult && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
              <BaziBoard data={baziResult} onUpdateData={setBaziResult} onRequireLogin={() => setIsAuthModalOpen(true)} onInvalidateHistory={invalidateHistoryCache} />
              <div className="text-center">
                <button 
                  onClick={() => {
                    setBaziResult(null);
                    setTimeout(() => {
                      const element = document.getElementById('bazi-input-gender');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 50);
                  }} 
                  className="px-10 py-4 bg-white text-blue-900 border-2 border-blue-200 rounded-2xl shadow-md hover:bg-blue-50 hover:border-blue-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                  Luận Lá Số Khác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SYSTEM 3: TỬ VI */}
        <div className={`${appMode === 'ziwei' ? 'block' : 'hidden'}`}>
          <ZiweiBoard 
            user={user} 
            onRequireLogin={() => setIsAuthModalOpen(true)} 
            historicalRecordId={historicalZiweiId} 
            onCalculationComplete={invalidateHistoryCache}
            onResultChange={setIsZiweiResultLoaded}
            autoSubmitInfo={autoSubmitZiwei}
            onClearAutoSubmit={() => setAutoSubmitZiwei(null)}
            onInvalidateHistory={invalidateHistoryCache}
          />
        </div>

        {/* SYSTEM 5: HÔN NHÂN */}
        <div className={`${appMode === 'marriage' ? 'block' : 'hidden'}`}>
          {loading && (
            <div className="text-center py-20 animate-in fade-in">
              <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="text-xl font-bold text-rose-800 animate-pulse">Đang đối chiếu lá số hợp hôn...</div>
            </div>
          )}

          {!marriageResult && !loading && (
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
              <MarriageInput onComplete={handleMarriageComplete} />
            </div>
          )}

          {marriageResult && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
              <MarriageBoard data={marriageResult} onUpdateData={setMarriageResult} onRequireLogin={() => setIsAuthModalOpen(true)} onInvalidateHistory={invalidateHistoryCache} />
              <div className="text-center">
                <button 
                  onClick={() => {
                    setMarriageResult(null);
                    setTimeout(() => {
                      const element = document.getElementById('marriage-input-nam');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }, 50);
                  }} 
                  className="px-10 py-4 bg-white text-rose-900 border-2 border-rose-200 rounded-2xl shadow-md hover:bg-rose-50 hover:border-rose-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                  Xem Cặp Đôi Khác
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* SYSTEM 6: DATE SELECTION */}
        <div className={`${appMode === 'xemngay' ? 'block' : 'hidden'}`}>
          <DateSelectionBoard user={user} />
        </div>

        {/* SYSTEM 7: BLOG */}
        <div className={`${appMode === 'blog' ? 'block' : 'hidden'}`}>
          <BlogBoard 
            onSelectModule={handleSelectModule} 
            initialSlug={blogSlug} 
            onClearSlug={handleClearBlogSlug} 
            onSelectPost={(slug) => handleSelectModule('blog', slug)}
          />
        </div>

        {/* SYSTEM 4: HISTORY */}
        {user && (
          <div className={`${appMode === 'history' ? 'block' : 'hidden'}`}>
            <HistoryBoard 
              onViewHexagram={handleViewHistoricalHexagram} 
              onViewBazi={handleViewHistoricalBazi} 
              onViewZiwei={handleViewHistoricalZiwei}
              onViewMarriage={handleViewHistoricalMarriage}
              preloadedData={preloadedHistory}
              onCacheInvalidate={invalidateHistoryCache}
              onSaveCache={setPreloadedHistory}
              active={appMode === 'history'}
            />
          </div>
        )}

        {/* SYSTEM 5: USER PROFILE */}
        {user && appMode === 'profile' && (
          <div>
            <ProfileBoard />
          </div>
        )}

        {/* SYSTEM 6: INFO PAGES */}
        {appMode === 'about' && (
          <AboutUs onBack={() => handleSelectModule(previousMode)} />
        )}
        {appMode === 'privacy' && (
          <PrivacyPolicy onBack={() => handleSelectModule(previousMode)} />
        )}
        {appMode === 'terms' && (
          <TermsOfService onBack={() => handleSelectModule(previousMode)} />
        )}

          </>
        )}
      </div>

      {/* GLOBAL FOOTER */}
      <Footer onSelectModule={handleSelectModule} />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <UpdateBaziModal 
        isOpen={isUpdateBaziOpen} 
        onClose={() => setIsUpdateBaziOpen(false)} 
        onSuccess={(updatedUser) => {
          const { day, month, year, hour, minute } = updatedUser.baziInfo;
          const formattedDate = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
          const formattedTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
           handleBaziComplete(formattedDate, formattedTime, updatedUser.gender !== undefined ? updatedUser.gender : 1, updatedUser.name);
        }} 
      />
      <MyFoldersModal
        isOpen={isMyFoldersOpen}
        onClose={() => setIsMyFoldersOpen(false)}
        onViewHexagram={handleViewHistoricalHexagram}
        onViewBazi={handleViewHistoricalBazi}
        onViewZiwei={handleViewHistoricalZiwei}
        onViewMarriage={handleViewHistoricalMarriage}
      />

      {shouldShowScrollButtons && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Cuộn lên đầu"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all active:scale-90 bg-transparent"
          >
            <ArrowUp size={24} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            title="Cuộn xuống cuối"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all active:scale-90 bg-transparent"
          >
            <ArrowDown size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
