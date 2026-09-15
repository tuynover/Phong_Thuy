const appConfig = require('../../src/core/config/appConfig');

describe('AppConfig Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should return default domain if APP_DOMAIN is not provided', () => {
    delete process.env.APP_DOMAIN;
    delete process.env.BASE_URL;
    expect(appConfig.appDomain).toBe('https://tuynover.ddns.net');
  });

  test('should prioritize APP_DOMAIN over defaults and strip trailing slashes', () => {
    process.env.APP_DOMAIN = 'https://custom-domain.com///';
    expect(appConfig.appDomain).toBe('https://custom-domain.com');
  });

  test('should fallback to BASE_URL if APP_DOMAIN is unset', () => {
    delete process.env.APP_DOMAIN;
    process.env.BASE_URL = 'https://base-url.org/';
    expect(appConfig.appDomain).toBe('https://base-url.org');
  });

  test('should properly detect production environment', () => {
    process.env.NODE_ENV = 'production';
    expect(appConfig.isProduction).toBe(true);

    process.env.NODE_ENV = 'development';
    expect(appConfig.isProduction).toBe(false);
  });

  test('should provide default CORS origins list containing appDomain', () => {
    delete process.env.CORS_ORIGINS;
    process.env.APP_DOMAIN = 'https://phongthuy.vn';
    const origins = appConfig.corsOrigins;
    expect(Array.isArray(origins)).toBe(true);
    expect(origins).toContain('https://phongthuy.vn');
    expect(origins).toContain('http://localhost:5173');
  });

  test('should parse custom comma-separated CORS_ORIGINS', () => {
    process.env.CORS_ORIGINS = 'https://one.com, https://two.com';
    expect(appConfig.corsOrigins).toEqual(['https://one.com', 'https://two.com']);
  });
});
