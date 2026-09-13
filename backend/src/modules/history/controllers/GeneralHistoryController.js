const IChingRecord = require('../../iching/models/IChingRecord');
const BaziRecord = require('../../bazi/models/BaziRecord');
const ZiweiRecord = require('../../ziwei/models/ZiweiRecord');
const MarriageRecord = require('../../bazi/models/MarriageRecord');
const User = require('../../../core/models/User');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const GoogleIndexingService = require('../../../core/services/GoogleIndexingService');
const UserStatsService = require('../../../core/services/UserStatsService');
const { runInTransaction } = require('../../../core/utils/transactionHelper');
const { 
    findByIdFlex, 
    updateByIdFlex, 
    formatCanChiSpacing, 
    buildFilterQuery, 
    filterByBirthInfo 
} = require('../../../core/services/HistoryQueryHelper');

class GeneralHistoryController {
    static async getAllHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });

            const limit = parseInt(req.query.limit) || 100;

            const [hexagrams, bazisRaw, ziweisRaw, marriagesRaw] = await Promise.all([
                IChingRecord.find(buildFilterQuery('iching', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-analysisSnapshot -aiInterpretation -ungKy -movingLines')
                    .limit(limit)
                    .lean(),
                BaziRecord.find(buildFilterQuery('bazi', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-analysisSnapshot -aiInterpretation -baziData')
                    .limit(limit)
                    .lean(),
                ZiweiRecord.find(buildFilterQuery('ziwei', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-chartData -analysisSnapshot -aiInterpretation')
                    .limit(limit)
                    .lean(),
                MarriageRecord.find(buildFilterQuery('marriage', req.query, userId))
                    .sort({ isPinned: -1, createdAt: -1 })
                    .select('-maleBaziData -femaleBaziData -aiInterpretation')
                    .limit(limit)
                    .lean()
            ]);

            const bazis = filterByBirthInfo(bazisRaw, req.query, 'bazi').map(record => {
                if (record.tietKhiTimeline) record.tietKhiTimeline = formatCanChiSpacing(record.tietKhiTimeline);
                return record;
            });

            const ziweis = filterByBirthInfo(ziweisRaw, req.query, 'ziwei');
            const marriages = filterByBirthInfo(marriagesRaw, req.query, 'marriage');

            return res.json({
                hexagrams,
                bazis,
                ziweis,
                marriages,
                counts: {
                    hexagrams: hexagrams.length,
                    bazis: bazis.length,
                    ziweis: ziweis.length,
                    marriages: marriages.length,
                    total: hexagrams.length + bazis.length + ziweis.length + marriages.length
                }
            });
        } catch (error) {
            console.error('getAllHistory error:', error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async deleteCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            if (type === 'hexagrams' || type === 'iching') {
                Model = IChingRecord;
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
            } else if (type === 'marriage') {
                Model = MarriageRecord;
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi cần xóa.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xóa bản ghi này.' });
            }
            // Soft delete the record and clear linked own record IDs inside an ACID transaction
            await runInTransaction(async (session) => {
                const opts = session ? { session } : {};
                await Model.updateOne({ _id: record._id }, { $set: { isDeleted: true } }, opts);

                const recordIdStr = record._id?.toString() || record._id;
                if (type === 'bazi' || type === 'bat_tu') {
                    await User.updateOne(
                        { _id: userId, 'baziInfo.ownBaziRecordId': recordIdStr },
                        { $set: { 'baziInfo.ownBaziRecordId': null } },
                        opts
                    );
                } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                    await User.updateOne(
                        { _id: userId, 'baziInfo.ownZiweiRecordId': recordIdStr },
                        { $set: { 'baziInfo.ownZiweiRecordId': null } },
                        opts
                    );
                }
            });

            // Decrement user record count O(1)
            UserStatsService.incrementRecordCount(userId, type, -1);

            // Clear cache
            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json({ message: 'Xóa bản ghi thành công.' });
        } catch (error) {
            console.error('deleteCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi xóa bản ghi.' });
        }
    }

    static async pinCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            if (type === 'hexagrams' || type === 'iching') {
                Model = IChingRecord;
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
            } else if (type === 'marriage') {
                Model = MarriageRecord;
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền ghim bản ghi này.' });
            }

            const currentPinnedStatus = !!record.isPinned;
            const updatedRecord = await updateByIdFlex(Model, id, { isPinned: !currentPinnedStatus });

            // Clear cache
            MemoryCacheService.clearUserHistoryCache(userId);

            return res.json(updatedRecord);
        } catch (error) {
            console.error('pinCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi ghim bản ghi.' });
        }
    }

    static async togglePublicCalculation(req, res) {
        try {
            const { type, id } = req.params;
            const { isPublic } = req.body;
            const userId = req.user.id || req.user._id?.toString();

            if (!userId) {
                return res.status(401).json({ error: 'Người dùng chưa xác thực.' });
            }

            let Model;
            let typePath = '';
            if (type === 'hexagrams' || type === 'iching') {
                Model = IChingRecord;
                typePath = 'iching';
            } else if (type === 'bazi' || type === 'bat_tu') {
                Model = BaziRecord;
                typePath = 'bazi';
            } else if (type === 'tu_vi' || type === 'tu-vi' || type === 'ziwei') {
                Model = ZiweiRecord;
                typePath = 'ziwei';
            } else if (type === 'marriage') {
                Model = MarriageRecord;
                typePath = 'marriage';
            } else {
                return res.status(400).json({ error: 'Loại quẻ/lá số không hợp lệ.' });
            }

            const record = await findByIdFlex(Model, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
            }

            if (record.userId !== userId && record.userId?.toString() !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền thay đổi trạng thái bản ghi này.' });
            }

            const publicStatus = isPublic === undefined ? !record.isPublic : Boolean(isPublic);
            const updatedRecord = await updateByIdFlex(Model, id, { isPublic: publicStatus });

            // Clear cache lịch sử
            MemoryCacheService.clearUserHistoryCache(userId);

            // Gửi thông báo Google Indexing API không đồng bộ
            const targetUrl = `https://tuynover.ddns.net/${typePath}/record/${record._id}`;
            const action = publicStatus ? 'URL_UPDATED' : 'URL_DELETED';
            GoogleIndexingService.publishUrl(targetUrl, action).catch(err => {
                console.error(`[GeneralHistoryController.togglePublicCalculation] Lỗi ping Google Indexing cho ${targetUrl}:`, err);
            });

            return res.json(updatedRecord);
        } catch (error) {
            console.error('togglePublicCalculation error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi thay đổi chế độ chia sẻ bản ghi.' });
        }
    }
}

module.exports = GeneralHistoryController;
