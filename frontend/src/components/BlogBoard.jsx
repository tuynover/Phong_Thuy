import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  getBlogPosts, 
  getBlogPost,
  getBlogCategories
} from '../services/api';
import { 
  Search, 
  Calendar, 
  Eye, 
  Clock, 
  ArrowLeft, 
  BookOpen, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Compass,
  Activity,
  BarChart3,
  Heart,
  Share2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getCategoryLabel = (cat) => {
  const labels = {
    all: 'Tất Cả',
    iching: 'Kinh Dịch',
    bazi: 'Bát Tự',
    ziwei: 'Tử Vi',
    marriage: 'Hôn Nhân',
    fengshui: 'Phong Thủy',
    general: 'Chung'
  };
  return labels[cat] || cat;
};

const getCategoryColor = (cat) => {
  const colors = {
    iching: 'text-amber-800 bg-amber-50 border-amber-200/50',
    bazi: 'text-blue-800 bg-blue-50 border-blue-200/50',
    ziwei: 'text-purple-800 bg-purple-50 border-purple-200/50',
    marriage: 'text-rose-800 bg-rose-50 border-rose-200/50',
    fengshui: 'text-teal-800 bg-teal-50 border-teal-200/50',
    general: 'text-slate-800 bg-slate-50 border-slate-200/50'
  };
  return colors[cat] || 'text-indigo-800 bg-indigo-50 border-indigo-200/40';
};

export default function BlogBoard({ onSelectModule, initialSlug, onClearSlug, onSelectPost }) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Trigger fetch when term changes
  const [selectedPost, setSelectedPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getArticleShareUrl = () => {
    const slug = selectedPost?.slug || initialSlug;
    if (slug) {
      return `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(slug)}`;
    }
    return window.location.href;
  };

  const handleCopyLink = () => {
    const shareUrl = getArticleShareUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {
        fallbackCopy(shareUrl);
      });
    } else {
      fallbackCopy(shareUrl);
    }
  };

  const fallbackCopy = (text) => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Copy fallback failed', err);
    }
    document.body.removeChild(input);
  };

  const handleNativeShare = async () => {
    const shareData = {
      title: selectedPost?.title || 'Phong Thủy Luận Giải',
      text: selectedPost?.excerpt || 'Bài viết hay về Phong Thủy & Chiêm Nghiệm học thuật.',
      url: getArticleShareUrl(),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Fetch posts listing
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBlogPosts({
        category: selectedCategory,
        search: searchTerm,
        page,
        limit: 6
      });
      if (res.data && res.data.success) {
        setPosts(res.data.posts || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching blog posts:', err);
    }
    setLoading(false);
  }, [selectedCategory, searchTerm, page]);

  useEffect(() => {
    if (!selectedPost && !initialSlug) {
      fetchPosts();
    }
  }, [fetchPosts, selectedPost, initialSlug]);

  useEffect(() => {
    if (selectedPost && selectedPost.title) {
      document.title = `${selectedPost.title} - Kiến Thức Phong Thủy`;
    }
  }, [selectedPost]);

  // Load dynamic categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getBlogCategories();
        if (res.data && res.data.success) {
          setCategories(['all', ...res.data.categories]);
        }
      } catch (err) {
        console.error('Error fetching blog categories:', err);
        setCategories(['all', 'iching', 'bazi', 'ziwei', 'marriage', 'fengshui', 'general']);
      }
    };
    fetchCategories();
  }, []);

  // Fetch post details
  const fetchPostDetail = useCallback(async (slug) => {
    setLoading(true);
    try {
      const res = await getBlogPost(slug);
      if (res.data && res.data.success) {
        setSelectedPost(res.data.post);
        setRelatedPosts(res.data.related || []);
        if (onSelectPost) {
          onSelectPost(slug);
        } else {
          const newUrl = `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(slug)}`;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error fetching blog post detail:', err);
      alert('Không thể mở chi tiết bài viết này.');
    }
    setLoading(false);
  }, [onSelectPost]);

  useEffect(() => {
    if (initialSlug) {
      fetchPostDetail(initialSlug);
    } else {
      setSelectedPost(null);
    }
  }, [initialSlug, fetchPostDetail]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchText);
    setPage(1);
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
    if (selectedPost) {
      setSelectedPost(null);
      setRelatedPosts([]);
      if (onClearSlug) onClearSlug();
    }
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    setRelatedPosts([]);
    if (onClearSlug) onClearSlug();
  };

  // Helper: Estimate reading time
  const getReadTime = (content) => {
    if (!content) return 1;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 250)); // 250 WPM average
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 font-sans">
      
      {/* Banner */}
      {!selectedPost && (
        <header className="text-center py-10 md:py-16 bg-gradient-to-tr from-indigo-900 via-indigo-950 to-slate-900 rounded-[2.5rem] text-white p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(126,34,206,0.18),transparent_50%)]" />
          <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
              Kiến thức & Chiêm nghiệm
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[Montserrat] leading-none drop-shadow-md">
              Cổ Học Thư Các
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
              Tổng hợp những nghiên cứu sâu sắc về Kinh Dịch Lục Hào, Tứ Trụ Bát Tự, Mệnh Số Tử Vi và Trạch Cát từ các cổ học gia.
            </p>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedPost ? (
            <motion.div
              key="listing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Controls (Search & Category Filtering) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-amber-100/50 shadow-sm">
                
                {/* Categories Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0 max-w-full">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider border select-none whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                          : 'bg-slate-50 text-slate-500 border-slate-200/50 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative flex items-center md:max-w-xs w-full">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Tìm bài viết..."
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button type="submit" className="absolute right-3 text-slate-400 hover:text-slate-700">
                    <Search size={16} />
                  </button>
                </form>
              </div>

              {/* Grid of Cards */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-indigo-955 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang nạp bài viết...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-amber-100/50 shadow-sm">
                  <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="font-extrabold text-slate-800 text-lg mb-1">Không tìm thấy bài viết nào</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Vui lòng thử tìm kiếm bằng từ khóa khác hoặc thay đổi bộ lọc.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map(post => (
                    <motion.div
                      key={post._id}
                      onClick={() => fetchPostDetail(post.slug)}
                      className="group flex flex-col bg-white border border-slate-200/80 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-xl hover:border-slate-300/40 cursor-pointer overflow-hidden transition-all duration-300"
                    >
                      {/* Thumbnail Placeholder with color gradient if image missing */}
                      <div className="aspect-[16/9] w-full bg-gradient-to-tr from-indigo-950 to-slate-900 relative overflow-hidden flex items-center justify-center">
                        {post.thumbnailUrl ? (
                          <img 
                            src={post.thumbnailUrl} 
                            alt={post.title} 
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="text-white/20 font-serif font-black text-4xl select-none">PT</div>
                        )}
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                        
                        {/* Category Badge on top of image */}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(post.category);
                          }}
                          className={`absolute top-4 left-4 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer hover:opacity-90 active:scale-95 transition-all z-10 ${
                            getCategoryColor(post.category)
                          }`}
                        >
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                        <div className="space-y-2">
                          {/* Date and Views */}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={11} />
                              {post.views} lượt xem
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-base font-[Montserrat] line-clamp-2 leading-tight">
                            {post.title}
                          </h3>
                          <p className="text-slate-550 text-xs font-medium leading-relaxed line-clamp-3">
                            {post.summary}
                          </p>
                        </div>

                        {/* Footer card */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] font-black text-slate-400">
                          <span className="truncate max-w-[120px]">{post.author}</span>
                          <span className="flex items-center gap-1 text-slate-550 shrink-0">
                            <Clock size={11} />
                            {getReadTime(post.content)} phút đọc
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white select-none transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-extrabold text-slate-650 px-4">
                    Trang {page} / {pages}
                  </span>
                  <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white select-none transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-5 sm:space-y-8 bg-white border border-amber-100/50 p-4 sm:p-8 md:p-10 rounded-[2rem] shadow-md relative"
            >
              {/* Back Button & Top Share Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <button 
                  onClick={handleBackToList}
                  className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 p-2.5 sm:px-4 sm:py-2.5 rounded-xl transition-all cursor-pointer select-none"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Quay lại danh sách</span>
                </button>

                {/* Share Actions Bar */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
                    }`}
                    title="Sao chép đường dẫn bài viết"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
                  </button>

                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getArticleShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 hover:bg-blue-100 transition-all select-none"
                    title="Chia sẻ lên Facebook"
                  >
                    <Share2 size={14} />
                    <span className="hidden sm:inline">Facebook</span>
                  </a>

                  {navigator.share && (
                    <button 
                      onClick={handleNativeShare}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer select-none"
                      title="Chia sẻ ứng dụng khác"
                    >
                      <ExternalLink size={14} />
                      <span className="hidden sm:inline">Khác</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Header Info */}
              <header className="space-y-2.5 border-b border-slate-100 pb-4">
                <h1 className="text-xl md:text-4xl font-extrabold text-slate-900 font-[Montserrat] leading-snug">
                  {selectedPost.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 font-bold">
                  <span>Tác giả: <strong className="text-slate-700 font-bold">{selectedPost.author}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Chủ đề: <strong onClick={() => handleCategoryClick(selectedPost.category)} className="text-slate-700 hover:text-indigo-600 font-bold cursor-pointer transition-colors">{getCategoryLabel(selectedPost.category)}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(selectedPost.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className="flex items-center gap-1"><Eye size={13} /> {selectedPost.views} lượt xem</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {getReadTime(selectedPost.content)} phút đọc</span>
                </div>
              </header>

              {selectedPost.thumbnailUrl && (
                <div className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 shadow-xs mb-6">
                  <img 
                    src={selectedPost.thumbnailUrl} 
                    alt={selectedPost.title} 
                    className="w-full h-auto block"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content body rendered with Markdown */}
              <article className="prose max-w-none text-slate-700 leading-relaxed text-sm md:text-base font-sans pb-10 border-b border-slate-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-6 last:mb-0 leading-relaxed font-sans">{children}</p>,
                    h1: ({ children }) => <h1 className="text-xl md:text-2xl font-extrabold font-[Montserrat] text-slate-900 mt-10 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg md:text-xl font-extrabold font-[Montserrat] text-slate-900 mt-8 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base md:text-lg font-extrabold font-[Montserrat] text-slate-900 mt-6 mb-2">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed font-sans">{children}</li>,
                    hr: () => <hr className="my-8 border-t border-slate-200" />,
                    blockquote: ({ children }) => <blockquote className="pl-4 border-l-4 border-indigo-500 italic text-slate-650 bg-slate-50/50 p-4 rounded-r-2xl my-6">{children}</blockquote>,
                    strong: ({ children }) => <strong className="font-extrabold text-slate-900">{children}</strong>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-xs">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-xs md:text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-slate-100/90 font-bold text-slate-900 font-[Montserrat]">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
                    tr: ({ children }) => <tr className="hover:bg-slate-50/80 transition-colors">{children}</tr>,
                    th: ({ children }) => <th className="px-4 py-3 font-extrabold uppercase tracking-wider text-[11px] text-slate-700">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-3 text-slate-700 font-sans">{children}</td>,
                    img: ({ src, alt }) => (
                      <figure className="my-6 space-y-2 text-center">
                        <img
                          src={src}
                          alt={alt || 'Hình ảnh minh họa'}
                          className="rounded-2xl max-h-[480px] w-full object-cover shadow-md border border-slate-200/80 mx-auto"
                          loading="lazy"
                        />
                        {alt && (
                          <figcaption className="text-xs text-slate-500 font-medium italic">
                            📷 {alt}
                          </figcaption>
                        )}
                      </figure>
                    )
                  }}
                >
                  {(() => {
                    if (!selectedPost.content) return '';
                    let text = selectedPost.content
                      .replace(/\*\*[^\S\r\n]*\r?\n[^\S\r\n]*/g, '**')
                      .replace(/[^\S\r\n]*\r?\n[^\S\r\n]*\*\*/g, '**')
                      .replace(/__[^\S\r\n]*\r?\n[^\S\r\n]*/g, '__')
                      .replace(/[^\S\r\n]*\r?\n[^\S\r\n]*__/g, '__');
                    const lines = text.split(/\r?\n/);
                    const resultLines = [];
                    let currentTableRow = [];
                    let inTableMode = false;
                    for (let i = 0; i < lines.length; i++) {
                      const line = lines[i].trim();
                      const isPipeToken = line === '|' || line.startsWith('|') || line.endsWith('|') || /^:?-+:?$/.test(line);
                      if (isPipeToken) {
                        inTableMode = true;
                        if (line) currentTableRow.push(line);
                      } else if (inTableMode && line !== '' && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-') && !line.startsWith('>')) {
                        currentTableRow.push(line);
                      } else {
                        if (currentTableRow.length > 0) {
                          const tableStr = currentTableRow.join(' ').replace(/\|\s*\|/g, '|\n|');
                          resultLines.push(tableStr);
                          currentTableRow = [];
                        }
                        inTableMode = false;
                        resultLines.push(lines[i]);
                      }
                    }
                    if (currentTableRow.length > 0) {
                      const tableStr = currentTableRow.join(' ').replace(/\|\s*\|/g, '|\n|');
                      resultLines.push(tableStr);
                    }
                    return resultLines.join('\n').replace(/\|\s*\|/g, '|\n|');
                  })()}
                </ReactMarkdown>
              </article>

              {/* Tag links */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <span className="text-xs font-bold text-slate-400 mr-2">Thẻ bài viết:</span>
                  {selectedPost.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-550 select-none">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Share Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
                <div className="flex items-center gap-2">
                  <Share2 size={16} className="text-indigo-600" />
                  <span className="text-xs font-extrabold text-slate-700">Chia sẻ bài viết này:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copied ? 'Đã sao chép liên kết!' : 'Sao chép đường dẫn'}</span>
                  </button>
                  <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getArticleShareUrl())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 hover:bg-blue-100 transition-all select-none"
                  >
                    <Share2 size={14} />
                    <span>Facebook</span>
                  </a>
                  {navigator.share && (
                    <button 
                      onClick={handleNativeShare}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer select-none"
                    >
                      <ExternalLink size={14} />
                      <span>Ứng dụng khác</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Call-to-action (CTA) boxes */}
              <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-6 md:p-8 rounded-[2rem] shadow-lg relative overflow-hidden mt-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(126,34,206,0.12),transparent_50%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Sparkles size={16} />
                      <span className="text-xs font-black uppercase tracking-wider font-[Montserrat]">Chiêm Nghiệm Cá Nhân Hóa</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-extrabold font-[Montserrat]">
                      Khám khám Mệnh Cách & Vận Hạn của riêng bạn
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                      Sử dụng các công cụ học thuật chính tông để lập lá số chi tiết và nhận lời khuyên sâu sắc từ hệ thống giải nghĩa logic.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      onClick={() => onSelectModule('bazi')}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Activity size={14} />
                      Lập Lá Số Bát Tự
                    </button>
                    <button
                      onClick={() => onSelectModule('ziwei')}
                      className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <BarChart3 size={14} />
                      Lập Lá Số Tử Vi
                    </button>
                    <button
                      onClick={() => onSelectModule('iching')}
                      className="px-5 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass size={14} />
                      Gieo Quẻ Kinh Dịch
                    </button>
                  </div>
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="pt-10 space-y-6">
                  <h3 className="text-lg font-extrabold text-slate-900 font-[Montserrat] flex items-center gap-2">
                    <BookOpen size={18} className="text-indigo-600" />
                    Bài viết liên quan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map(post => (
                      <div
                        key={post._id}
                        onClick={() => fetchPostDetail(post.slug)}
                        className="group bg-slate-50 border border-slate-200/50 hover:bg-white hover:border-slate-300 rounded-2xl p-5 cursor-pointer transition-all duration-300 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                            getCategoryColor(post.category)
                          }`}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <h4 className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm font-[Montserrat] line-clamp-2 leading-tight">
                            {post.title}
                          </h4>
                          <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
                            {post.summary}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 block pt-2 border-t border-slate-100">
                          {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
