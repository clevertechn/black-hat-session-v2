require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 50900,
    SESSION_PREFIX: process.env.SESSION_PREFIX || "BlackHat~",
    GC_JID: process.env.GC_JID || "COYNDC7v8iDHNWpweEVp2L",
    DATABASE_URL: process.env.DATABASE_URL || null, // Optional. Can be MongoDB or PostgreSQL.
    BOT_REPO: process.env.BOT_REPO || "https://github.com/clevertechn/black-hat-md",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029Vb73SRl1CYoLWtyr4u1X",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ✮⃝𝐀ⁿᵒⁿʸᵐᵒᵘˢ✮⃝ᵁˢᵉʳ ✮*",
};
