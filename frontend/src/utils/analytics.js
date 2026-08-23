/**
 * Module quản lý Google Analytics 4 (GA4) cho Phong Thủy Luận Giải
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-PHONGTHUYAI';

/**
 * Khởi tạo Google Analytics 4 Script nếu chưa có
 */
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  // Tránh nạp lại nhiều lần
  if (document.getElementById('ga-script')) return;

  try {
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false // Tự quản lý page_view thủ công theo SPA route
    });
  } catch (err) {
    console.warn('[GA4] Không thể khởi tạo Google Analytics:', err);
  }
};

/**
 * Theo dõi lượt xem trang (Page View) trong SPA
 * @param {string} path - Đường dẫn (ví dụ: '/bazi', '/iching')
 * @param {string} title - Tiêu đề trang
 */
export const trackPageView = (path, title) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('event', 'page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href
    });
  } catch (err) {
    console.warn('[GA4] Lỗi ghi nhận page_view:', err);
  }
};

/**
 * Ghi nhận sự kiện tương tác của người dùng (Custom Event)
 * @param {string} action - Tên hành động (ví dụ: 'gieo_que_iching', 'lap_la_so_bazi')
 * @param {string} category - Nhóm sự kiện (ví dụ: 'Divination', 'Auth', 'UserAction')
 * @param {string} [label] - Nhãn bổ sung
 * @param {number} [value] - Giá trị số
 */
export const trackEvent = (action, category = 'General', label = null, value = null) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    const eventParams = {
      event_category: category
    };
    if (label !== null && label !== undefined) eventParams.event_label = label;
    if (value !== null && value !== undefined) eventParams.value = value;

    window.gtag('event', action, eventParams);
  } catch (err) {
    console.warn('[GA4] Lỗi ghi nhận event:', err);
  }
};

export default {
  initGA,
  trackPageView,
  trackEvent
};
