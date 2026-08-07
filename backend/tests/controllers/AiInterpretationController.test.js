const AiInterpretationController = require('../../src/controllers/AiInterpretationController');

// Mock models
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/Conversation');
jest.mock('../../src/models/Message');
jest.mock('../../src/models/User');

// Mock services
jest.mock('../../src/services/AiService');
jest.mock('../../src/services/BaziPrompts');
jest.mock('../../src/services/ConversationContextService');
jest.mock('../../src/services/MemoryCacheService', () => ({
    clearChatCache: jest.fn()
}));
jest.mock('../../src/services/UserStatsService', () => ({
    incrementInterpretTokens: jest.fn()
}));

const BaziRecord = require('../../src/models/BaziRecord');
const Conversation = require('../../src/models/Conversation');
const Message = require('../../src/models/Message');
const AiService = require('../../src/services/AiService');
const ConversationContextService = require('../../src/services/ConversationContextService');

describe('AiInterpretationController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { id: 'test-record-id' },
            body: { question: 'Vận hạn năm nay thế nào?' },
            user: { id: 'test-user-id' },
            on: jest.fn()
        };
        res = {
            setHeader: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('interpretBazi', () => {
        test('should return 404 if record not found', async () => {
            BaziRecord.findById.mockResolvedValue(null);

            await AiInterpretationController.interpretBazi(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Không tìm thấy bản ghi Bát Tự.' });
        });

        test('should establish SSE and stream AI chunks successfully', async () => {
            const mockRecord = {
                _id: 'test-record-id',
                toObject: jest.fn().mockReturnValue({
                    baziData: { canChi: {} }
                }),
                isGeneratingInterpretation: false,
                save: jest.fn().mockResolvedValue(true)
            };
            BaziRecord.findById.mockResolvedValue(mockRecord);
            BaziRecord.findByIdAndUpdate.mockResolvedValue(mockRecord);

            const mockStream = {
                stream: [
                    { text: () => 'Chunk 1', usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 } }
                ]
            };
            AiService.generateInterpretationStream.mockResolvedValue(mockStream);
            AiService.cleanMarkdown.mockReturnValue('Full text');

            await AiInterpretationController.interpretBazi(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(res.write).toHaveBeenCalled();
            expect(res.end).toHaveBeenCalled();
        });
    });

    describe('chatBazi', () => {
        test('should return 400 if question is empty', async () => {
            req.body.question = '';

            await AiInterpretationController.chatBazi(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Câu hỏi không được để trống.' });
        });

        test('should return 400 if question is not divination related', async () => {
            ConversationContextService.isDivinationRelated.mockReturnValue(false);

            await AiInterpretationController.chatBazi(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toGetCalledWith = expect.objectContaining({
                error: expect.stringContaining('Tôi là trợ lý luận giải Bát Tự')
            });
        });

        test('should establish SSE and chat successfully', async () => {
            ConversationContextService.isDivinationRelated.mockReturnValue(true);
            
            const mockRecord = {
                _id: 'test-record-id',
                toObject: jest.fn().mockReturnValue({}),
                userId: 'test-user-id'
            };
            BaziRecord.findById.mockResolvedValue(mockRecord);

            Conversation.findOne.mockResolvedValue({ _id: 'test-conv-id' });
            Message.findOne.mockReturnValue({
                sort: jest.fn().mockResolvedValue(null) // no spam
            });

            ConversationContextService.buildConversationContext.mockResolvedValue({
                summary: 'Context summary',
                recentHistoryText: ''
            });
            ConversationContextService.updateConversationSummary = jest.fn().mockResolvedValue(true);

            const mockStream = {
                stream: [
                    { text: () => '{"answer": "Tốt"}', usageMetadata: {} }
                ]
            };
            AiService.generateInterpretationStream.mockResolvedValue(mockStream);

            await AiInterpretationController.chatBazi(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
            expect(res.write).toHaveBeenCalled();
            expect(res.end).toHaveBeenCalled();
        });
    });
});
