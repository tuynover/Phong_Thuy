const User = require('../models/User');
const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const MemoryCacheService = require('../services/MemoryCacheService');
const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const getModelByType = (type) => {
    if (type === 'hexagrams' || type === 'iching') return IChingRecord;
    if (type === 'bazi' || type === 'bat_tu') return BaziRecord;
    if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') return ZiweiRecord;
    if (type === 'marriage') return MarriageRecord;
    return null;
};

const findByIdFlex = async (Model, id) => {
    let record = await Model.findById(id);
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

class TagController {
    static async getUserTags(req, res) {
        try {
            const userId = req.user.id || req.user._id?.toString();
            if (!userId) return res.status(401).json({ error: 'Người dùng chưa xác thực.' });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

            let tags = user.tags || [];
            if (tags.length === 0) {
                tags = [{ _id: 'default', name: 'Chung', isDefault: true, createdAt: new Date() }];
                user.tags = tags;
                await user.save();
            }

            // Đếm số bản ghi tương ứng từng tag qua 4 phân hệ
            const tagsWithCounts = await Promise.all(tags.map(async (tagObj) => {
                const tagName = tagObj.name;
                const tagCondition = (tagName === 'Chung') 
                    ? { $or: [{ tags: 'Chung' }, { tags: { $exists: false } }, { tags: null }, { tags: { $size: 0 } }] }
                    : { tags: tagName };
                const query = { userId, isDeleted: { $ne: true }, status: { $ne: 'locked' }, ...tagCondition };

                const [ichingCount, baziCount, ziweiCount, marriageCount] = await Promise.all([
                    IChingRecord.countDocuments(query),
                    BaziRecord.countDocuments(query),
                    ZiweiRecord.countDocuments(query),
                    MarriageRecord.countDocuments(query)
                ]);

                const totalRecords = ichingCount + baziCount + ziweiCount + marriageCount;

                return {
                    _id: tagObj._id,
                    name: tagObj.name,
                    isDefault: !!tagObj.isDefault,
                    createdAt: tagObj.createdAt,
                    counts: {
                        iching: ichingCount,
                        bazi: baziCount,
                        ziwei: ziweiCount,
                        marriage: marriageCount,
                        total: totalRecords
                    }
                };
            }));

            return res.json(tagsWithCounts);
        } catch (error) {
            console.error('getUserTags error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách thẻ.' });
        }
    }

    static async createTag(req, res) {
        try {
            const userId = req.user.id || req.user._id?.toString();
            const { name } = req.body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ error: 'Tên thẻ không được để trống.' });
            }

            const cleanName = name.trim();
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

            if (!user.tags || user.tags.length === 0) {
                user.tags = [{ _id: 'default', name: 'Chung', isDefault: true, createdAt: new Date() }];
            }

            // Kiểm tra trùng tên tag
            const existing = user.tags.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
            if (existing) {
                return res.status(400).json({ error: 'Thẻ hoặc thư mục này đã tồn tại.' });
            }

            const newTag = {
                _id: uuidv7(),
                name: cleanName,
                isDefault: false,
                createdAt: new Date()
            };

            user.tags.push(newTag);
            await user.save();

            MemoryCacheService.clearUserHistoryCache(userId);

            return res.status(201).json(newTag);
        } catch (error) {
            console.error('createTag error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi tạo thẻ mới.' });
        }
    }

    static async updateTag(req, res) {
        try {
            const userId = req.user.id || req.user._id?.toString();
            const { tagId } = req.params;
            const { name } = req.body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ error: 'Tên thẻ không được để trống.' });
            }

            const cleanName = name.trim();
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

            const tagIndex = (user.tags || []).findIndex(t => t._id === tagId || t.id === tagId);
            if (tagIndex === -1) {
                return res.status(404).json({ error: 'Không tìm thấy thẻ cần sửa.' });
            }

            const tagObj = user.tags[tagIndex];
            if (tagObj.isDefault) {
                return res.status(400).json({ error: 'Không thể đổi tên thư mục mặc định.' });
            }

            const oldName = tagObj.name;
            if (oldName === cleanName) {
                return res.json(tagObj);
            }

            // Kiểm tra xem tên mới có trùng với tag khác không
            const duplicate = user.tags.find((t, idx) => idx !== tagIndex && t.name.toLowerCase() === cleanName.toLowerCase());
            if (duplicate) {
                return res.status(400).json({ error: 'Tên thẻ mới bị trùng với thẻ đã có.' });
            }

            user.tags[tagIndex].name = cleanName;
            await user.save();

            // Đổi tên tag trong mảng `tags` của tất cả bản ghi thuộc user ở 4 collection
            await Promise.all([
                IChingRecord.updateMany({ userId, tags: oldName }, { $set: { "tags.$": cleanName } }),
                BaziRecord.updateMany({ userId, tags: oldName }, { $set: { "tags.$": cleanName } }),
                ZiweiRecord.updateMany({ userId, tags: oldName }, { $set: { "tags.$": cleanName } }),
                MarriageRecord.updateMany({ userId, tags: oldName }, { $set: { "tags.$": cleanName } })
            ]);

            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json(user.tags[tagIndex]);
        } catch (error) {
            console.error('updateTag error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi đổi tên thẻ.' });
        }
    }

    static async deleteTag(req, res) {
        try {
            const userId = req.user.id || req.user._id?.toString();
            const { tagId } = req.params;

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

            const tagObj = (user.tags || []).find(t => t._id === tagId || t.id === tagId);
            if (!tagObj) {
                return res.status(404).json({ error: 'Không tìm thấy thẻ cần xóa.' });
            }

            if (tagObj.isDefault) {
                return res.status(400).json({ error: 'Không thể xóa thư mục mặc định.' });
            }

            const tagName = tagObj.name;
            user.tags = user.tags.filter(t => t._id !== tagId && t.id !== tagId);
            await user.save();

            // Gỡ tag khỏi tất cả bản ghi
            const models = [IChingRecord, BaziRecord, ZiweiRecord, MarriageRecord];
            await Promise.all(models.map(async (Model) => {
                await Model.updateMany({ userId, tags: tagName }, { $pull: { tags: tagName } });
                // Nếu sau khi gỡ tag mảng tags bị rỗng, reset về mặc định ['Chung']
                await Model.updateMany({ userId, tags: { $size: 0 } }, { $set: { tags: ['Chung'] } });
            }));

            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json({ message: `Đã xóa thẻ "${tagName}" thành công.` });
        } catch (error) {
            console.error('deleteTag error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi xóa thẻ.' });
        }
    }

    static async updateRecordTags(req, res) {
        try {
            const userId = req.user.id || req.user._id?.toString();
            const { type, id } = req.params;
            const { tags } = req.body;

            if (!userId) return res.status(401).json({ error: 'Người dùng chưa xác thực.' });

            const Model = getModelByType(type);
            if (!Model) return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });

            const record = await findByIdFlex(Model, id);
            if (!record || record.isDeleted) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
            }

            // Kiểm tra quyền sở hữu strict
            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền sửa đổi thẻ của bản ghi này.' });
            }

            let newTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
            if (newTags.length === 0) {
                newTags = ['Chung'];
            }
            // Khử trùng lặp
            newTags = [...new Set(newTags)];

            record.tags = newTags;
            await record.save();

            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json({ message: 'Cập nhật thẻ thành công.', recordId: record._id, tags: record.tags });
        } catch (error) {
            console.error('updateRecordTags error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thẻ bản ghi.' });
        }
    }
}

module.exports = TagController;
