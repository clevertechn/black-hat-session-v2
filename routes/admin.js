const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// 🔥 Hakikisha model inaload
require("../models/GiftedSession");

const GiftedSession = mongoose.model("GiftedSession");


// ===============================
// GET ALL SESSIONS
// ===============================
router.get("/sessions", async (req, res) => {
    try {
        const sessions = await GiftedSession
            .find()
            .sort({ createdAt: -1 })
            .lean(); // ⚡ faster

        res.json(sessions);
    } catch (e) {
        console.error("GET /sessions error:", e);
        res.status(500).json({ error: "Server error" });
    }
});


// ===============================
// GET SINGLE SESSION (by shortId)
// ===============================
router.get("/session/:id", async (req, res) => {
    try {
        const id = req.params.id?.trim();

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        console.log("🔍 FINDING:", id);

        const session = await GiftedSession.findOne({ shortId: id }).lean();

        if (!session) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json(session);
    } catch (e) {
        console.error("GET /session/:id error:", e);
        res.status(500).json({ error: "Server error" });
    }
});


// ===============================
// DELETE SESSION (by shortId)
// ===============================
router.delete("/session/:id", async (req, res) => {
    try {
        const id = req.params.id?.trim();

        if (!id) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        console.log("🗑 Deleting session:", id);

        const deleted = await GiftedSession.findOneAndDelete({
            shortId: id
        });

        if (!deleted) {
            return res.status(404).json({ error: "Session not found" });
        }

        res.json({
            success: true,
            id: id
        });
    } catch (e) {
        console.error("DELETE /session/:id error:", e);
        res.status(500).json({ error: "Server error" });
    }
});


// ===============================
// EXPORT
// ===============================
module.exports = router;
