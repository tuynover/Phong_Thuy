const UserStatsService = require('../../src/services/UserStatsService');
const User = require('../../src/models/User');

describe('UserStatsService O(1) Atomic Increments Tests', () => {
    test('incrementRecordCount should issue $inc for specified system count', async () => {
        const spyUpdateOne = jest.spyOn(User, 'updateOne').mockResolvedValue({ acknowledged: true });

        await UserStatsService.incrementRecordCount('user-uuid', 'bazi', 1);

        expect(spyUpdateOne).toHaveBeenCalledWith(
            { _id: 'user-uuid' },
            expect.objectContaining({
                $inc: { 'stats.baziCount': 1 }
            })
        );

        spyUpdateOne.mockRestore();
    });

    test('incrementInterpretTokens should issue $inc for interpret tokens', async () => {
        const spyUpdateOne = jest.spyOn(User, 'updateOne').mockResolvedValue({ acknowledged: true });

        await UserStatsService.incrementInterpretTokens('user-uuid', 'ziwei', 150);

        expect(spyUpdateOne).toHaveBeenCalledWith(
            { _id: 'user-uuid' },
            expect.objectContaining({
                $inc: {
                    'stats.ziweiTokens': 150,
                    'stats.totalInterpretTokens': 150,
                    'stats.totalTokens': 150
                }
            })
        );

        spyUpdateOne.mockRestore();
    });

    test('incrementChatTokens should issue $inc for chat tokens', async () => {
        const spyUpdateOne = jest.spyOn(User, 'updateOne').mockResolvedValue({ acknowledged: true });

        await UserStatsService.incrementChatTokens('user-uuid', 'iching', 80);

        expect(spyUpdateOne).toHaveBeenCalledWith(
            { _id: 'user-uuid' },
            expect.objectContaining({
                $inc: {
                    'stats.ichingChatTokens': 80,
                    'stats.totalChatTokens': 80,
                    'stats.totalTokens': 80
                }
            })
        );

        spyUpdateOne.mockRestore();
    });
});
