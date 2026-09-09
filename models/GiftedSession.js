const mongoose = require("mongoose");

const GiftedSessionSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    data: { type: String, required: true },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model("GiftedSession", GiftedSessionSchema);
