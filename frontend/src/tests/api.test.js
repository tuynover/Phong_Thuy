import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { 
    getInterpretationStreamUrl, 
    getChatStreamUrl, 
    calculateDivination, 
    analyzeBazi, 
    createZiweiChart,
    checkAuspiciousDate,
    exportPdf
} from '../services/api';

vi.mock('axios');

describe('API Service - URL Stream Helpers', () => {
    it('should generate correct interpretation stream URL for Ziwei and aliases', () => {
        expect(getInterpretationStreamUrl('ziwei', '123')).toContain('/ai/ziwei/123/interpret');
        expect(getInterpretationStreamUrl('tu_vi', '456')).toContain('/ai/ziwei/456/interpret');
    });

    it('should generate correct interpretation stream URL for IChing and aliases', () => {
        expect(getInterpretationStreamUrl('iching', '789')).toContain('/ai/iching/789/interpret');
        expect(getInterpretationStreamUrl('hexagrams', '789')).toContain('/ai/iching/789/interpret');
    });

    it('should generate correct interpretation stream URL for Marriage and Bazi', () => {
        expect(getInterpretationStreamUrl('marriage', 'abc')).toContain('/ai/marriage/abc/interpret');
        expect(getInterpretationStreamUrl('bazi', 'xyz')).toContain('/ai/bazi/xyz/interpret');
    });

    it('should generate correct chat stream URL for different systems', () => {
        expect(getChatStreamUrl('ziwei', '123')).toContain('/ai/ziwei/123/chat');
        expect(getChatStreamUrl('tu_vi', '456')).toContain('/ai/ziwei/456/chat');
        expect(getChatStreamUrl('iching', '789')).toContain('/ai/iching/789/chat');
        expect(getChatStreamUrl('marriage', 'abc')).toContain('/ai/marriage/abc/chat');
        expect(getChatStreamUrl('bazi', 'xyz')).toContain('/ai/bazi/xyz/chat');
    });
});

describe('API Service - Endpoint Calls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should call calculateDivination with correct endpoint and payload', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const lines = [7, 8, 9, 7, 8, 9];
        await calculateDivination(lines, 'user-1', 'Hỏi công danh', '2026-09-12T10:00:00');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/iching/calculate'),
            {
                lines,
                userId: 'user-1',
                question: 'Hỏi công danh',
                now: '2026-09-12T10:00:00'
            }
        );
    });

    it('should call analyzeBazi with correct parameters', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        await analyzeBazi('1990-05-15', '14:30', 'male', 'user-2', 'Nguyen Van A');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/bazi/analyze'),
            expect.objectContaining({
                date: '1990-05-15',
                time: '14:30',
                gender: 'male',
                userId: 'user-2',
                name: 'Nguyen Van A'
            })
        );
    });

    it('should call checkAuspiciousDate with correct body', async () => {
        axios.post.mockResolvedValueOnce({ data: { isGood: true } });

        await checkAuspiciousDate(1995, '2026-10-01', 9, 'cuoi_hoi');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/date/check'),
            {
                birthYear: 1995,
                solarDate: '2026-10-01',
                solarHour: 9,
                activity: 'cuoi_hoi'
            }
        );
    });

    it('should attach Authorization Bearer token in exportPdf if token exists in localStorage', async () => {
        localStorage.setItem('token', 'fake-jwt-token-123');
        axios.post.mockResolvedValueOnce({ data: new Blob() });

        await exportPdf('bazi', 'record-999', ['overview', 'stars']);

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/export/pdf/bazi/record-999'),
            { scope: ['overview', 'stars'] },
            expect.objectContaining({
                headers: {
                    Authorization: 'Bearer fake-jwt-token-123'
                },
                responseType: 'blob'
            })
        );
    });
});
