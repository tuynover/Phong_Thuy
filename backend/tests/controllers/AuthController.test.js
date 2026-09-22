const AuthController = require('../../src/modules/auth/controllers/AuthController');
const sseService = require('../../src/core/services/SseService');

describe('AuthController Integrity & Reference Tests', () => {
    test('AuthController should load without any ReferenceError', () => {
        expect(AuthController).toBeDefined();
        expect(typeof AuthController.register).toBe('function');
        expect(typeof AuthController.login).toBe('function');
        expect(typeof AuthController.googleLogin).toBe('function');
        expect(typeof AuthController.submitAppeal).toBe('function');
        expect(typeof AuthController.dailyCheckin).toBe('function');
        expect(typeof AuthController.getDailyCheckinStatus).toBe('function');
    });

    test('sseService should be defined and expose sendToAdmins method', () => {
        expect(sseService).toBeDefined();
        expect(typeof sseService.sendToAdmins).toBe('function');
    });
});
