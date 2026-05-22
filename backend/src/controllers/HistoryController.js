const HexagramRecord = require('../models/HexagramRecord');
const BaziRecord = require('../models/BaziRecord');
const HexagramDataService = require('../services/HexagramDataService');
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

class HistoryController {
    static async getHexagramHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const records = await HexagramRecord.find({ userId }).sort({ createdAt: -1 }).lean();
            
            const enhancedRecords = records.map(record => {
                const reconstructed = HexagramDataService.reconstructLines(record);
                return {
                    ...record,
                    primaryLines: reconstructed.primaryLines,
                    secondaryLines: reconstructed.secondaryLines,
                    primaryHexagram: reconstructed.primaryHexagram,
                    transformedHexagram: reconstructed.transformedHexagram
                };
            });
            
            return res.json(enhancedRecords);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async getBaziHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const records = await BaziRecord.find({ userId }).sort({ createdAt: -1 });
            return res.json(records);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateHexagram(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(HexagramRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async rateBazi(req, res) {
        try {
            const { id } = req.params;
            const { rating, feedback } = req.body;
            
            const record = await updateByIdFlex(BaziRecord, id, { rating, feedback });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkHexagram(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            
            const record = await updateByIdFlex(HexagramRecord, id, { userId });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async linkBazi(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            
            const record = await updateByIdFlex(BaziRecord, id, { userId });
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = HistoryController;
