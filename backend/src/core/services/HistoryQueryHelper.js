const mongoose = require('mongoose');

const findByIdFlex = async (Model, id) => {
    let record = await Model.findById(id);
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

const updateByIdFlex = async (Model, id, update) => {
    let record = await Model.findByIdAndUpdate(id, update, { new: true });
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: { ...update, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

const formatCanChiSpacing = (str) => {
    if (!str) return str;
    return str.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ');
};

const buildFilterQuery = (system, queryParams, userId) => {
    const { tag, isPublic, startDate, endDate, gender, search, name } = queryParams;
    const query = { 
        userId, 
        isDeleted: { $ne: true }, 
        status: { $ne: 'locked' } 
    };

    const andConditions = [];

    if (tag && tag !== 'Tất cả' && tag !== 'all') {
        if (tag === 'Chung') {
            andConditions.push({
                $or: [
                    { tags: 'Chung' },
                    { tags: { $exists: false } },
                    { tags: null },
                    { tags: { $size: 0 } }
                ]
            });
        } else {
            query.tags = tag;
        }
    }

    if (isPublic !== undefined && isPublic !== '' && isPublic !== 'all') {
        query.isPublic = (isPublic === 'true' || isPublic === true);
    }

    const dateField = system === 'iching' ? 'dateCast' : 'createdAt';
    if (startDate || endDate) {
        query[dateField] = {};
        if (startDate) {
            query[dateField].$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query[dateField].$lte = end;
        }
    }

    const searchTerm = (search || name || '').trim();
    if (searchTerm) {
        const regex = new RegExp(searchTerm, 'i');
        if (system === 'iching') {
            query.question = regex;
        } else if (system === 'bazi' || system === 'ziwei') {
            query['inputInfo.name'] = regex;
        } else if (system === 'marriage') {
            andConditions.push({
                $or: [
                    { 'inputInfo.male.name': regex },
                    { 'inputInfo.female.name': regex }
                ]
            });
        }
    }

    if (gender !== undefined && gender !== '' && gender !== 'all') {
        const gNum = parseInt(gender);
        if (system === 'bazi') {
            query['inputInfo.gender'] = gNum;
        } else if (system === 'ziwei') {
            query['inputInfo.gender'] = { $in: [gNum === 1 ? 'Nam' : 'Nữ', gNum === 1 ? 'male' : 'female', gNum, String(gNum)] };
        }
    }

    if (andConditions.length > 0) {
        query.$and = andConditions;
    }

    return query;
};

const filterByBirthInfo = (records, { birthDay, birthMonth, birthYear, birthHour }, system) => {
    if (!birthDay && !birthMonth && !birthYear && (birthHour === undefined || birthHour === null || birthHour === '')) {
        return records;
    }
    const bd = birthDay ? parseInt(birthDay) : null;
    const bm = birthMonth ? parseInt(birthMonth) : null;
    const by = birthYear ? parseInt(birthYear) : null;
    const bh = (birthHour !== undefined && birthHour !== null && birthHour !== '') ? parseInt(birthHour) : null;

    return records.filter(record => {
        if (system === 'iching') return true;
        const info = record.inputInfo;
        if (!info) return true;

        const checkPerson = (pInfo) => {
            if (!pInfo) return false;
            let dateStr = pInfo.date || '';
            let day = null, month = null, year = null;
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    day = parseInt(parts[0]);
                    month = parseInt(parts[1]);
                    year = parseInt(parts[2]);
                }
            } else if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    year = parseInt(parts[0]);
                    month = parseInt(parts[1]);
                    day = parseInt(parts[2]);
                }
            }

            if (bd !== null && day !== bd) return false;
            if (bm !== null && month !== bm) return false;
            if (by !== null && year !== by) return false;

            if (bh !== null) {
                if (system === 'ziwei') {
                    if (pInfo.hour !== undefined && pInfo.hour !== null && pInfo.hour !== bh) return false;
                } else if (pInfo.time) {
                    const timeHour = parseInt(pInfo.time.split(':')[0]);
                    if (!isNaN(timeHour) && timeHour !== bh) return false;
                }
            }
            return true;
        };

        if (system === 'marriage') {
            return checkPerson(info.male) || checkPerson(info.female);
        }
        return checkPerson(info);
    });
};

module.exports = {
    findByIdFlex,
    updateByIdFlex,
    formatCanChiSpacing,
    buildFilterQuery,
    filterByBirthInfo
};
