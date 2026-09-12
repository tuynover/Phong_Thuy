import { describe, it, expect, beforeEach } from 'vitest';
import { cleanMarkdownForSpeech, ttsEngine } from '../utils/ttsEngine';

describe('ttsEngine - cleanMarkdownForSpeech', () => {
    it('should return empty string for null, undefined, or empty text', () => {
        expect(cleanMarkdownForSpeech('')).toBe('');
        expect(cleanMarkdownForSpeech(null)).toBe('');
        expect(cleanMarkdownForSpeech(undefined)).toBe('');
    });

    it('should convert markdown tables into natural prose', () => {
        const table = `
| Thuộc tính | Giá trị |
| :--- | :--- |
| Bản mệnh | Hải Trung Kim |
| Cung mệnh | Tý |
        `.trim();

        const result = cleanMarkdownForSpeech(table);
        expect(result).toContain('Thuộc tính: Bản mệnh. Giá trị: Hải Trung Kim.');
        expect(result).toContain('Thuộc tính: Cung mệnh. Giá trị: Tý.');
    });

    it('should convert astrological abbreviations to full Vietnamese names without jarring brackets', () => {
        const input = 'Tử Vi (M), Thiên Phủ (V), Vũ Khúc (Đ), Thất Sát (H), Thiên Đồng (B)';
        const result = cleanMarkdownForSpeech(input);

        expect(result).toContain('Tử Vi Miếu địa');
        expect(result).toContain('Thiên Phủ Vượng địa');
        expect(result).toContain('Vũ Khúc Đắc địa');
        expect(result).toContain('Thất Sát Hãm địa');
        expect(result).toContain('Thiên Đồng Bình hòa');
    });

    it('should clean headers and append proper punctuation', () => {
        const input = '### Cụm 1: Bản Mệnh Học Thuật\n## Chương 2: Sự Nghiệp';
        const result = cleanMarkdownForSpeech(input);

        expect(result).toContain('Cụm 1: Bản Mệnh Học Thuật.');
        expect(result).toContain('Cụm 2: Sự Nghiệp.');
    });

    it('should replace VIP terms with specialized terminology (chuyên sâu)', () => {
        const input = 'Đây là bản luận giải vip dành cho quý bạn.';
        const result = cleanMarkdownForSpeech(input);

        expect(result).toContain('bản luận giải chuyên sâu');
        expect(result).not.toContain('vip');
    });

    it('should strip bold, italic, and inline code formatting', () => {
        const input = 'Chào bạn **Trần Văn A**, ngũ hành của bạn là `Kim` và vận trình *rất tốt*.';
        const result = cleanMarkdownForSpeech(input);

        expect(result).toContain('Chào bạn Trần Văn A');
        expect(result).toContain('ngũ hành của bạn là Kim');
        expect(result).toContain('vận trình rất tốt');
        expect(result).not.toContain('**');
        expect(result).not.toContain('`');
    });
});

describe('ttsEngine - Singleton Instance & State', () => {
    beforeEach(() => {
        ttsEngine.stop();
    });

    it('should initialize with valid audio settings', () => {
        expect(ttsEngine).toBeDefined();
        expect(ttsEngine.rate).toBeGreaterThan(0);
        expect(ttsEngine.pitch).toBeGreaterThan(0);
        expect(typeof ttsEngine.setRate).toBe('function');
        expect(typeof ttsEngine.setPitch).toBe('function');
    });

    it('should allow setting playback rate and pitch within limits', () => {
        ttsEngine.setRate(1.25);
        expect(ttsEngine.rate).toBe(1.25);

        ttsEngine.setPitch(0.9);
        expect(ttsEngine.pitch).toBe(0.9);
    });

    it('should return valid duration via getValidDuration()', () => {
        expect(typeof ttsEngine.getValidDuration).toBe('function');
        const duration = ttsEngine.getValidDuration();
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should reset playback state on stop()', () => {
        ttsEngine.stop();
        expect(ttsEngine.isPlaying).toBe(false);
        expect(ttsEngine.isPaused).toBe(false);
        expect(ttsEngine.currentTime).toBe(0);
    });
});
