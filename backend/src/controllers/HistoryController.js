const HexagramRecord = require('../models/HexagramRecord');
const User = require('../models/User');
const BaziRecord = require('../models/BaziRecord');
const RuleEngineService = require('../services/RuleEngineService');
const PromptTemplateManager = require('../services/PromptTemplateManager');
const AiService = require('../services/AiService');
const HexagramDataService = require('../services/HexagramDataService');
const mongoose = require('mongoose');

const CURRENT_ICHING_PROMPT_VERSION = "v1.2";
const CURRENT_BAZI_PROMPT_VERSION = "v1.2";
const ACTIVE_MODEL = "gemini-3.1-flash-lite";

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

    static async interpretHexagram(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = await findByIdFlex(HexagramRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            // Check lock to prevent race conditions
            if (record.isGeneratingInterpretation) {
                return res.status(409).json({ error: 'Hệ thống đang sinh luận giải cho quẻ này. Vui lòng đợi trong giây lát.' });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === CURRENT_ICHING_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                // Stream in a single block or split by lines for fluid rendering
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(HexagramRecord, id, { isGeneratingInterpretation: true });

            // 0. Reconstruct lines
            const reconstructed = HexagramDataService.reconstructLines(record.toObject());
            const fullRecord = {
                ...record.toObject(),
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

            // 3. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 4. Clean Markdown formatting & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const tokensUsed = Math.ceil(cleanedContent.length / 4.2);

            // 5. Update Database Record with rich metadata
            await updateByIdFlex(HexagramRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
                    promptVersion: CURRENT_ICHING_PROMPT_VERSION,
                    tokensUsed: tokensUsed
                },
                isGeneratingInterpretation: false
            });

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Hexagram Interpret SSE Error:", error);
            // Send error to client over SSE
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI.' })}\n\n`);
            res.end();
        } finally {
            if (record) {
                await updateByIdFlex(HexagramRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async interpretBazi(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            // Check lock
            if (record.isGeneratingInterpretation) {
                return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát.' });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === CURRENT_BAZI_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: true });

            // 1. Generate Prompt using analyzed Bazi data
            const prompt = PromptTemplateManager.getBaziInterpretationPrompt(record.toObject());

            // 2. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 3. Clean Markdown & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const tokensUsed = Math.ceil(cleanedContent.length / 4.2);

            // 4. Update Database Record with rich metadata
            await updateByIdFlex(BaziRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
                    promptVersion: CURRENT_BAZI_PROMPT_VERSION,
                    tokensUsed: tokensUsed
                },
                isGeneratingInterpretation: false
            });

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Bazi Interpret SSE Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Bát Tự.' })}\n\n`);
            res.end();
        } finally {
            if (record) {
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }
}

module.exports = HistoryController;
