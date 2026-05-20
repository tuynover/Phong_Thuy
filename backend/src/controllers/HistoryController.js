const HexagramRecord = require('../models/HexagramRecord');
const User = require('../models/User');
const BaziRecord = require('../models/BaziRecord');
const RuleEngineService = require('../services/RuleEngineService');
const PromptTemplateManager = require('../services/PromptTemplateManager');
const AiService = require('../services/AiService');
const HexagramDataService = require('../services/HexagramDataService');

class HistoryController {
    static async getHexagramHistory(req, res) {
        try {
            const userId = req.params.userId;
            if (!userId) return res.status(400).json({ error: 'User ID is required' });
            
            const records = await HexagramRecord.find({ userId }).sort({ createdAt: -1 }).lean();
            
            // Reconstruct lines for each record before sending to frontend
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
            
            const record = await HexagramRecord.findByIdAndUpdate(
                id, 
                { rating, feedback },
                { new: true }
            );
            
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
            
            const record = await BaziRecord.findByIdAndUpdate(
                id, 
                { rating, feedback },
                { new: true }
            );
            
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
            
            const record = await HexagramRecord.findByIdAndUpdate(
                id, 
                { userId },
                { new: true }
            );
            
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
            
            const record = await BaziRecord.findByIdAndUpdate(
                id, 
                { userId },
                { new: true }
            );
            
            if (!record) return res.status(404).json({ error: 'Record not found' });
            return res.json(record);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    static async interpretHexagram(req, res) {
        try {
            const { id } = req.params;
            const record = await HexagramRecord.findById(id).lean();
            if (!record) return res.status(404).json({ error: 'Record not found' });

            // If already interpreted, return cached interpretation
            if (record.aiInterpretation) {
                return res.json({ interpretation: record.aiInterpretation });
            }

            // 0. Reconstruct lines
            const reconstructed = HexagramDataService.reconstructLines(record);
            const fullRecord = {
                ...record,
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            // 0.5 Fetch user gender
            let userGender = 1; // Default male
            if (record.userId && record.userId !== 'guest') {
                const user = await User.findById(record.userId).lean();
                if (user && user.gender !== undefined) {
                    userGender = user.gender;
                }
            }

            // 1. Run Rule Engine
            const analyzedData = RuleEngineService.analyze(fullRecord, userGender);

            // 2. Generate Prompt
            const prompt = PromptTemplateManager.getHexagramInterpretationPrompt(fullRecord, analyzedData);

            // 3. Call AI Service
            const interpretation = await AiService.generateInterpretation(prompt);

            // 4. Save and return (Using update since we used lean())
            await HexagramRecord.findByIdAndUpdate(id, { aiInterpretation: interpretation });

            return res.json({ interpretation });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: error.message || 'Server error' });
        }
    }
}

module.exports = HistoryController;
