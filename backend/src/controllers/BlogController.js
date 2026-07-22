const BlogPost = require('../models/BlogPost');
const escapeRegExp = require('../utils/escapeRegExp');
const GoogleIndexingService = require('../services/GoogleIndexingService');
const domain = 'https://tuynover.ddns.net';

// Helper to convert Vietnamese titles into URL-friendly slugs
function generateSlug(text) {
  if (!text) return '';
  let str = text.toLowerCase().trim();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
           .replace(/\s+/g, '-')        // Collapse whitespace and replace with -
           .replace(/-+/g, '-');        // Collapse multiple dashes
  return str;
}

class BlogController {
  // GET /api/blog - Fetch all posts (Public and Admin lists)
  static async getPosts(req, res) {
    try {
      const { category, search, page = 1, limit = 9, showAll = 'false' } = req.query;
      const query = {};

      // Determine authorization: Admin/Co-admin can view drafts/deleted posts if showAll is true
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'co-admin');

      if (isAdmin && showAll === 'true') {
        // No restriction on isPublished or isDeleted
      } else {
        query.isDeleted = { $ne: true };
        query.isPublished = true;
      }

      // Filter by Category
      if (category && category !== 'all') {
        query.category = category;
      }

      // Search by keyword in Title or Summary
      if (search) {
        const safeSearch = escapeRegExp(search.trim());
        query.$or = [
          { title: { $regex: safeSearch, $options: 'i' } },
          { summary: { $regex: safeSearch, $options: 'i' } }
        ];
      }

      const parsedLimit = parseInt(limit);
      const parsedPage = parseInt(page);
      const skip = (parsedPage - 1) * parsedLimit;

      const posts = await BlogPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean();

      const total = await BlogPost.countDocuments(query);

      return res.json({
        success: true,
        posts,
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit)
      });
    } catch (error) {
      console.error('[BlogController.getPosts] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi tải danh sách bài viết.' });
    }
  }

  // GET /api/blog/:slug - Fetch post details by Slug
  static async getPostBySlug(req, res) {
    try {
      const { slug } = req.params;
      const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'co-admin');

      const query = { slug };
      if (!isAdmin) {
        query.isDeleted = { $ne: true };
        query.isPublished = true;
      }

      // Find and increment views count atomically
      const post = await BlogPost.findOneAndUpdate(
        query,
        { $inc: { views: 1 } },
        { new: true }
      );

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
      }

      // Fetch related posts (same category, excluding current post)
      const related = await BlogPost.find({
        category: post.category,
        _id: { $ne: post._id },
        isDeleted: { $ne: true },
        isPublished: true
      })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('title slug summary category createdAt thumbnailUrl')
        .lean();

      return res.json({ success: true, post, related });
    } catch (error) {
      console.error('[BlogController.getPostBySlug] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi tải chi tiết bài viết.' });
    }
  }

  // POST /api/blog - Create new post (Admin only)
  static async createPost(req, res) {
    try {
      const { title, summary, content, category, tags, thumbnailUrl, isPublished } = req.body;

      if (!title || !summary || !content) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung.' });
      }

      let slug = req.body.slug ? req.body.slug.toLowerCase().trim() : generateSlug(title);
      
      // Check for slug uniqueness
      const existing = await BlogPost.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const newPost = new BlogPost({
        title,
        slug,
        summary,
        content,
        category,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        thumbnailUrl,
        isPublished: isPublished !== undefined ? isPublished : true,
        author: req.user?.name || 'Ban Quản Trị'
      });

      await newPost.save();

      if (newPost.isPublished) {
        GoogleIndexingService.publishUrl(`${domain}/blog/${newPost.slug}`, 'URL_UPDATED').catch(err => {
          console.error('[BlogController.createPost] Lỗi ping Google Indexing:', err);
        });
      }

      return res.status(201).json({ success: true, post: newPost });
    } catch (error) {
      console.error('[BlogController.createPost] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi tạo bài viết.' });
    }
  }

  // PUT /api/blog/:id - Update post by ID (Admin only)
  static async updatePost(req, res) {
    try {
      const { id } = req.params;
      const { title, summary, content, category, tags, thumbnailUrl, isPublished, slug } = req.body;

      const post = await BlogPost.findById(id);
      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
      }

      const wasPublished = post.isPublished;
      const oldSlug = post.slug;

      if (title) post.title = title;
      if (summary) post.summary = summary;
      if (content) post.content = content;
      if (category) post.category = category;
      if (thumbnailUrl !== undefined) post.thumbnailUrl = thumbnailUrl;
      if (isPublished !== undefined) post.isPublished = isPublished;
      
      if (tags) {
        post.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      }

      if (slug) {
        const cleanSlug = slug.toLowerCase().trim();
        if (cleanSlug !== post.slug) {
          const existing = await BlogPost.findOne({ slug: cleanSlug, _id: { $ne: id } });
          if (existing) {
            return res.status(400).json({ error: 'Đường dẫn (slug) này đã tồn tại.' });
          }
          post.slug = cleanSlug;
        }
      }

      post.updatedAt = Date.now();
      await post.save();

      // Ping Google Indexing API dựa vào thay đổi trạng thái
      if (post.isPublished) {
        GoogleIndexingService.publishUrl(`${domain}/blog/${post.slug}`, 'URL_UPDATED').catch(() => {});
        if (wasPublished && oldSlug !== post.slug) {
          // Nếu đổi slug bài viết đang xuất bản, báo xóa URL cũ
          GoogleIndexingService.publishUrl(`${domain}/blog/${oldSlug}`, 'URL_DELETED').catch(() => {});
        }
      } else if (wasPublished && !post.isPublished) {
        // Chuyển bài viết từ xuất bản về nháp, báo xóa URL
        GoogleIndexingService.publishUrl(`${domain}/blog/${oldSlug}`, 'URL_DELETED').catch(() => {});
      }

      return res.json({ success: true, post });
    } catch (error) {
      console.error('[BlogController.updatePost] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi cập nhật bài viết.' });
    }
  }

  // DELETE /api/blog/:id - Soft delete post (Admin only)
  static async deletePost(req, res) {
    try {
      const { id } = req.params;
      const post = await BlogPost.findById(id);

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
      }

      post.isDeleted = true;
      await post.save();

      if (post.isPublished) {
        GoogleIndexingService.publishUrl(`${domain}/blog/${post.slug}`, 'URL_DELETED').catch(() => {});
      }

      return res.json({ success: true, message: 'Đã xóa bài viết thành công (xóa mềm).' });
    } catch (error) {
      console.error('[BlogController.deletePost] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi xóa bài viết.' });
    }
  }

  // POST /api/blog/:id/restore - Restore soft deleted post (Admin only)
  static async restorePost(req, res) {
    try {
      const { id } = req.params;
      const post = await BlogPost.findById(id);

      if (!post) {
        return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
      }

      post.isDeleted = false;
      await post.save();

      if (post.isPublished) {
        GoogleIndexingService.publishUrl(`${domain}/blog/${post.slug}`, 'URL_UPDATED').catch(() => {});
      }

      return res.json({ success: true, message: 'Đã khôi phục bài viết thành công.' });
    } catch (error) {
      console.error('[BlogController.restorePost] Error:', error);
      return res.status(500).json({ error: 'Lỗi khi khôi phục bài viết.' });
    }
  }
}

module.exports = BlogController;
