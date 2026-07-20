const { runInTransaction } = require('../../src/utils/transactionHelper');
const mongoose = require('mongoose');

describe('transactionHelper Unit Tests', () => {
    test('runInTransaction should execute workFn successfully', async () => {
        const result = await runInTransaction(async (session) => {
            return 'transaction_success';
        });

        expect(result).toBe('transaction_success');
    });

    test('runInTransaction should abort transaction on thrown error', async () => {
        await expect(
            runInTransaction(async (session) => {
                throw new Error('Custom Transaction Error');
            })
        ).rejects.toThrow('Custom Transaction Error');
    });
});
