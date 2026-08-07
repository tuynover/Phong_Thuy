module.exports = {
    ACTIVE_MODEL: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    ICHING_PROMPT_VERSION: "v1.2",
    BAZI_PROMPT_VERSION: "v3_0_shensha_upgrade",
    ZIWEI_PROMPT_VERSION: "v3_14_palaces",
    MARRIAGE_PROMPT_VERSION: "v1_0_marriage",
    COOLDOWN_TIME_SECONDS: 10,
    CHAT_LIMIT_PER_HOUR: 10,
    TIMEOUT_MS: 25000,
    RETRIES: 2
};
