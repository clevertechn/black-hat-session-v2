require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 50900,
    SESSION_PREFIX: process.env.SESSION_PREFIX || "BlackHat~",
    GC_JID: process.env.GC_JID || "COYNDC7v8iDHNWpweEVp2L",
    DATABASE_URL: process.env.DATABASE_URL || "mongodb+srv://clever:1234@clevertech977.pchfowc.mongodb.net/?appName=clevertech977", // Your Db URL here(optional). Can either be mongodb or postreSQL
    BOT_REPO: process.env.BOT_REPO || "https://github.com/clevertechn/black-hat-md",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029Vb73SRl1CYoLWtyr4u1X",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ✮⃝𝐀ⁿᵒⁿʸᵐᵒᵘˢ✮⃝ᵁˢᵉʳ ✮*",
};
