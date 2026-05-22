module.exports = {
    ACTIVE_MODEL: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
    ICHING_PROMPT_VERSION: "v1.2",
    BAZI_PROMPT_VERSION: "v1.2",
    FOLLOWUP_PROMPT_VERSION: "v1.0-followup",
    COOLDOWN_TIME_SECONDS: 10,
    CHAT_LIMIT_PER_HOUR: 10,
    TIMEOUT_MS: 25000,
    RETRIES: 2
};
