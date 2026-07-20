const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/BlogController');
const optionalAuth = require('../middleware/optionalAuth');
const adminAuth = require('../middleware/adminAuth');

// Public endpoints (optionalAuth allows identifying if request comes from an Admin to see drafts)
router.get('/', optionalAuth, BlogController.getPosts);
router.get('/:slug', optionalAuth, BlogController.getPostBySlug);

// Admin-only endpoints
router.post('/', adminAuth, BlogController.createPost);
router.put('/:id', adminAuth, BlogController.updatePost);
router.delete('/:id', adminAuth, BlogController.deletePost);
router.post('/:id/restore', adminAuth, BlogController.restorePost);

module.exports = router;
