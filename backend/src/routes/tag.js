const express = require('express');
const router = express.Router();
const TagController = require('../controllers/TagController');
const auth = require('../middleware/auth');

router.get('/', auth, TagController.getUserTags);
router.post('/', auth, TagController.createTag);
router.put('/:tagId', auth, TagController.updateTag);
router.delete('/:tagId', auth, TagController.deleteTag);
router.put('/record/:type/:id', auth, TagController.updateRecordTags);

module.exports = router;
