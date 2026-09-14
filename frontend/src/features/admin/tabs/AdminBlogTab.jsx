import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getBlogPosts,
  getBlogCategories,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  restoreBlogPost
} from '@/services/api';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function AdminBlogTab({ showAlert, showConfirm }) {
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogPage, setBlogPage] = useState(1);
  const [blogPages, setBlogPages] = useState(1);
  const [blogLimit] = useState(10);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogCategory, setBlogCategory] = useState('all');
  const [blogLoading, setBlogLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState([]);

  // Create/Edit Blog Modal
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [blogFormTitle, setBlogFormTitle] = useState('');
  const [blogFormSlug, setBlogFormSlug] = useState('');
  const [blogFormCategory, setBlogFormCategory] = useState('general');
  const [blogFormSummary, setBlogFormSummary] = useState('');
  const [blogFormContent, setBlogFormContent] = useState('');
  const [blogFormTags, setBlogFormTags] = useState('');
  const [blogFormThumbnail, setBlogFormThumbnail] = useState('');
  const [blogFormPublished, setBlogFormPublished] = useState(true);
  const [blogContentTab, setBlogContentTab] = useState('write'); // 'write' | 'preview'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const loadBlogCategories = async () => {
    try {
      const res = await getBlogCategories();
      if (res.data && res.data.success) {
        setExistingCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải categories:', err);
    }
  };

  const fetchBlogPostsData = async (overrideSearch = undefined, overrideCategory = undefined) => {
    setBlogLoading(true);
    try {
      const searchVal = overrideSearch !== undefined ? overrideSearch : blogSearch;
      const catVal = overrideCategory !== undefined ? overrideCategory : blogCategory;
      const res = await getBlogPosts({
        page: blogPage,
        limit: blogLimit,
        category: catVal,
        search: searchVal,
        showAll: 'true'
      });
      if (res.data && res.data.success) {
        setBlogPosts(res.data.posts || []);
        setBlogTotal(res.data.total || 0);
        setBlogPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching blog posts for admin:', err);
      showAlert('Lỗi khi tải danh sách bài viết.', 'error');
    } finally {
      setBlogLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPostsData();
    loadBlogCategories();
  }, [blogPage, blogCategory]);

  const handleOpenBlogModal = (post = null) => {
    setBlogContentTab('write');
    if (post) {
      setEditingPost(post);
      setBlogFormTitle(post.title || '');
      setBlogFormSlug(post.slug || '');
      setBlogFormSummary(post.summary || '');
      setBlogFormContent(post.content || '');
      setBlogFormCategory(post.category || 'general');
      setBlogFormTags(Array.isArray(post.tags) ? post.tags.join(', ') : '');
      setBlogFormThumbnail(post.thumbnailUrl || '');
      setBlogFormPublished(post.isPublished !== undefined ? post.isPublished : true);
    } else {
      setEditingPost(null);
      setBlogFormTitle('');
      setBlogFormSlug('');
      setBlogFormSummary('');
      setBlogFormContent('');
      setBlogFormCategory('general');
      setBlogFormTags('');
      setBlogFormThumbnail('');
      setBlogFormPublished(true);
    }
    setIsBlogModalOpen(true);
  };

  const handleSaveBlogPost = async (e) => {
    e.preventDefault();
    if (!blogFormTitle.trim() || !blogFormSummary.trim() || !blogFormContent.trim()) {
      showAlert('Vui lòng nhập đầy đủ Tiêu đề, Tóm tắt và Nội dung.', 'error');
      return;
    }

    const postData = {
      title: blogFormTitle.trim(),
      slug: blogFormSlug.trim(),
      summary: blogFormSummary.trim(),
      content: blogFormContent.trim(),
      category: blogFormCategory,
      tags: blogFormTags.split(',').map(t => t.trim()).filter(Boolean),
      thumbnailUrl: blogFormThumbnail.trim(),
      isPublished: blogFormPublished
    };

    setIsSubmitting(true);
    try {
      if (editingPost) {
        const id = editingPost._id || editingPost.id;
        const res = await updateBlogPost(id, postData);
        if (res.data && res.data.success) {
          showAlert('Cập nhật bài viết thành công!');
          setIsBlogModalOpen(false);
          fetchBlogPostsData();
          loadBlogCategories();
        }
      } else {
        const res = await createBlogPost(postData);
        if (res.data && res.data.success) {
          showAlert('Tạo bài viết mới thành công!');
          setIsBlogModalOpen(false);
          setBlogPage(1);
          fetchBlogPostsData();
          loadBlogCategories();
        }
      }
    } catch (err) {
      console.error('Error saving blog post:', err);
      showAlert(err.response?.data?.error || 'Lỗi khi lưu bài viết.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlogPost = (id) => {
    showConfirm('Bạn có chắc chắn muốn xóa (xóa mềm) bài viết này không?', async () => {
      try {
        const res = await deleteBlogPost(id);
        if (res.data && res.data.success) {
          showAlert('Đã xóa bài viết thành công!');
          fetchBlogPostsData();
        }
      } catch (err) {
        console.error('Error deleting blog post:', err);
        showAlert('Lỗi khi xóa bài viết.', 'error');
      }
    });
  };

  const handleRestoreBlogPost = async (id) => {
    try {
      const res = await restoreBlogPost(id);
      if (res.data && res.data.success) {
        showAlert('Đã khôi phục bài viết thành công!');
        fetchBlogPostsData();
      }
    } catch (err) {
      console.error('Error restoring blog post:', err);
      showAlert('Lỗi khi khôi phục bài viết.', 'error');
    }
  };

  return (
    <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-amber-500 flex items-center gap-2">
            <BookOpen size={20} />
            Quản Lý Bài Viết Blog
          </h3>
          <p className="text-xs text-slate-400">Danh sách bài viết phong thủy, chiêm nghiệm học thuật công khai trên hệ thống</p>
        </div>
        <button
          onClick={() => handleOpenBlogModal()}
          className="bg-amber-800 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          Viết Bài Mới
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex items-center flex-1 max-w-xs">
          <input
            type="text"
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBlogPostsData(blogSearch)}
            placeholder="Tìm bài viết..."
            className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-bold transition-all focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => fetchBlogPostsData(blogSearch)}
            className="absolute right-2.5 text-slate-500 hover:text-slate-350 cursor-pointer"
          >
            <Search size={14} />
          </button>
        </div>

        {/* Category Select */}
        <select
          value={blogCategory}
          onChange={(e) => {
            setBlogCategory(e.target.value);
            setBlogPage(1);
            fetchBlogPostsData(blogSearch, e.target.value);
          }}
          className="bg-slate-950 border border-slate-800 text-slate-350 text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">Tất Cả Danh Mục</option>
          <option value="iching">Kinh Dịch</option>
          <option value="bazi">Bát Tự</option>
          <option value="ziwei">Tử Vi</option>
          <option value="marriage">Hôn Nhân</option>
          <option value="fengshui">Phong Thủy</option>
          {existingCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Posts Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-slate-350">
          <thead className="bg-slate-900/60 font-bold text-slate-100 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Tiêu Đề</th>
              <th className="px-4 py-3.5">Danh Mục</th>
              <th className="px-4 py-3.5">Tác Giả</th>
              <th className="px-4 py-3.5">Lượt Xem</th>
              <th className="px-4 py-3.5">Trạng Thái</th>
              <th className="px-4 py-3.5">Xóa Mềm</th>
              <th className="px-4 py-3.5">Ngày Đăng</th>
              <th className="px-4 py-3.5 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
            {blogLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center">
                  <div className="w-8 h-8 border-2 border-amber-300 border-t-amber-800 rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-slate-500 animate-pulse uppercase tracking-wider font-extrabold text-[10px]">Đang tải dữ liệu bài viết...</span>
                </td>
              </tr>
            ) : blogPosts.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-slate-500 font-semibold">
                  Không tìm thấy bài viết nào.
                </td>
              </tr>
            ) : (
              blogPosts.map((post) => (
                <tr key={post._id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-200 max-w-[200px] truncate" title={post.title}>
                    {post.title}
                  </td>
                  <td className="px-4 py-3.5 capitalize font-semibold">
                    {post.category === 'iching' ? 'Kinh Dịch' :
                     post.category === 'bazi' ? 'Bát Tự' :
                     post.category === 'ziwei' ? 'Tử Vi' :
                     post.category === 'marriage' ? 'Hôn Nhân' :
                     post.category === 'fengshui' ? 'Phong Thủy' :
                     post.category === 'general' ? 'Chung' : post.category}
                  </td>
                  <td className="px-4 py-3.5">{post.author}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-amber-500">{post.views}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${post.isPublished ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-slate-850 text-slate-500'}`}>
                      {post.isPublished ? 'Công Khai' : 'Nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {post.isDeleted ? (
                      <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase bg-red-955/50 text-red-400 border border-red-800/40">Đã Xóa</span>
                    ) : (
                      <span className="text-slate-650 font-medium">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3.5 text-center flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenBlogModal(post)}
                      className="p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-500 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa bài viết"
                    >
                      <Pencil size={12} />
                    </button>
                    {post.isDeleted ? (
                      <button
                        onClick={() => handleRestoreBlogPost(post._id)}
                        className="p-1.5 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-900/40 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                        title="Khôi phục bài viết"
                      >
                        <Unlock size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteBlogPost(post._id)}
                        className="p-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bài viết"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {blogPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={blogPage === 1}
            onClick={() => setBlogPage(blogPage - 1)}
            className="p-1.5 border border-slate-800 rounded-xl bg-slate-950 text-slate-400 hover:bg-slate-900 disabled:opacity-40 select-none cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] font-bold text-slate-400 px-4">
            Trang {blogPage} / {blogPages}
          </span>
          <button
            disabled={blogPage === blogPages}
            onClick={() => setBlogPage(blogPage + 1)}
            className="p-1.5 border border-slate-800 rounded-xl bg-slate-950 text-slate-400 hover:bg-slate-900 disabled:opacity-40 select-none cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* CREATE / EDIT BLOG POST MODAL */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-3xl max-h-[90vh] p-6 sm:p-8 relative shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsBlogModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-serif font-bold text-amber-500 flex items-center gap-2 border-b border-slate-800 pb-3 shrink-0">
              <BookOpen size={24} />
              {editingPost ? 'Chỉnh Sửa Bài Viết' : 'Viết Bài Mới'}
            </h3>

            <form onSubmit={handleSaveBlogPost} className="flex-1 overflow-y-auto pr-1.5 space-y-4 text-slate-350 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="col-span-1 md:col-span-2">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Tiêu đề bài viết</span>
                  <input
                    type="text"
                    value={blogFormTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlogFormTitle(val);
                      if (!editingPost) {
                        setBlogFormSlug(generateSlug(val));
                      }
                    }}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Đường dẫn tĩnh (Slug)</span>
                  <input
                    type="text"
                    value={blogFormSlug}
                    onChange={(e) => setBlogFormSlug(e.target.value)}
                    placeholder="vi-du-tieu-de-viet-bai"
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Chủ đề (Category)</span>
                  <input
                    type="text"
                    list="blog-categories-list"
                    value={blogFormCategory}
                    onChange={(e) => setBlogFormCategory(e.target.value)}
                    placeholder="Chọn hoặc nhập chủ đề..."
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs"
                    required
                  />
                  <datalist id="blog-categories-list">
                    <option value="general">Chung / Phong Thủy</option>
                    <option value="iching">Kinh Dịch</option>
                    <option value="bazi">Bát Tự</option>
                    <option value="ziwei">Tử Vi</option>
                    <option value="marriage">Hôn Nhân</option>
                    <option value="fengshui">Phong Thủy Chuyên Sâu</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </datalist>
                </div>

                {/* Thumbnail URL */}
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Ảnh bìa (URL)</span>
                  <input
                    type="text"
                    value={blogFormThumbnail}
                    onChange={(e) => setBlogFormThumbnail(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs"
                  />
                </div>

                {/* Tags */}
                <div>
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Thẻ tags (Ngăn cách bằng dấu phẩy)</span>
                  <input
                    type="text"
                    value={blogFormTags}
                    onChange={(e) => setBlogFormTags(e.target.value)}
                    placeholder="Kinh Dịch, Phong Thủy, Tử Vi..."
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs"
                  />
                </div>

                {/* Excerpt / Summary */}
                <div className="col-span-1 md:col-span-2">
                  <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 ml-1">Tóm tắt ngắn (Hiển thị ngoài trang danh sách)</span>
                  <textarea
                    value={blogFormSummary}
                    onChange={(e) => setBlogFormSummary(e.target.value)}
                    placeholder="Nhập tóm tắt ngắn..."
                    rows="2"
                    className="bg-slate-950 border border-slate-800 text-slate-100 font-bold rounded-xl block w-full p-2.5 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs resize-none"
                    required
                  />
                </div>

                {/* Markdown Content with Write / Preview Tabs */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider ml-1">
                      Nội dung bài viết (Hỗ trợ Markdown)
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setBlogContentTab('write')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          blogContentTab === 'write' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Soạn Thảo Markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogContentTab('preview')}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          blogContentTab === 'preview' ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Xem Trước (Preview)
                      </button>
                    </div>
                  </div>

                  {blogContentTab === 'write' ? (
                    <textarea
                      value={blogFormContent}
                      onChange={(e) => setBlogFormContent(e.target.value)}
                      placeholder="# Ý nghĩa sao Thái Tuế...&#10;&#10;Sao Thái tuế là tinh tú đại diện cho sao Mộc..."
                      rows="8"
                      className="bg-slate-950 border border-slate-800 text-slate-100 font-medium rounded-xl block w-full p-3 transition-all focus:outline-none focus:border-amber-500 shadow-sm text-xs font-mono"
                      required
                    />
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[180px] max-h-[300px] overflow-y-auto text-slate-200 text-xs leading-relaxed prose prose-invert max-w-none">
                      {blogFormContent.trim() ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 shadow-xs">
                                <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-slate-900 font-bold text-amber-500 font-serif">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-slate-800/80 bg-slate-950/50">{children}</tbody>,
                            tr: ({ children }) => <tr className="hover:bg-slate-900/40 transition-colors">{children}</tr>,
                            th: ({ children }) => <th className="px-3 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-300">{children}</th>,
                            td: ({ children }) => <td className="px-3 py-2 text-slate-300 font-sans">{children}</td>,
                            img: ({ src, alt }) => (
                              <figure className="my-4 space-y-1 text-center">
                                <img
                                  src={src}
                                  alt={alt || 'Hình ảnh minh họa'}
                                  className="rounded-xl max-h-[300px] w-full object-cover shadow-md border border-slate-800 mx-auto"
                                  loading="lazy"
                                />
                                {alt && (
                                  <figcaption className="text-[10px] text-slate-400 italic">
                                    📷 {alt}
                                  </figcaption>
                                )}
                              </figure>
                            )
                          }}
                        >
                          {(() => {
                            if (!blogFormContent) return '';
                            let text = blogFormContent
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
                      ) : (
                        <span className="text-slate-500 italic">Chưa có nội dung. Vui lòng nhập ở tab Soạn Thảo.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status isPublished */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-2.5 p-1">
                  <input
                    type="checkbox"
                    id="blogFormPublished"
                    checked={blogFormPublished}
                    onChange={(e) => setBlogFormPublished(e.target.checked)}
                    className="h-4 w-4 bg-slate-950 border-slate-800 text-amber-600 focus:ring-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="blogFormPublished" className="font-bold text-xs uppercase text-slate-350 cursor-pointer select-none">
                    Công khai bài viết này ngay lập tức (Bỏ chọn nếu muốn lưu dạng bản nháp)
                  </label>
                </div>

              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Bài Viết'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
