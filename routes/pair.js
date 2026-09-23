/*
 * Baileys is ESM. This project uses CommonJS,
 * so load Baileys with dynamic import().
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const zlib = require("zlib");
const pino = require("pino");
const { waitUntil } = require("@vercel/functions");
const {
    giftedId,
    removeFile,
    generateRandomCode
} = require("../gift");
const { SESSION_PREFIX, GC_JID, BOT_REPO, WA_CHANNEL, MSG_FOOTER } = require("../config");
const { isConfigured, saveSession } = require("../gift/sessionStore");
const { sendButtons } = require("../gifted-buttons");
const router = express.Router();
let baileysPromise;

function getBaileys() {
    if (!baileysPromise) {
        baileysPromise = import("@whiskeysockets/baileys");
    }
    return baileysPromise;
}

const sessionDir = path.join(process.env.TMPDIR || "/tmp", "black-hat-session");

router.get('/', async (req, res) => {
    const id = giftedId();
    const invocationStartedAt = Date.now();
    let num = req.query.number;
    const sessionType = (req.query.type || 'short').toLowerCase();
    let responseSent = false;
    let sessionCleanedUp = false;

    if (typeof num !== 'string' || !/^\d{8,15}$/.test(num.replace(/[^0-9]/g, ''))) {
        return res.status(400).json({
            error: "A valid phone number is required",
            usage: "/code?number=2547XXXXXXXX&type=short"
        });
    }

    async function cleanUpSession() {
        if (!sessionCleanedUp) {
            try {
                await removeFile(path.join(sessionDir, id));
            } catch (cleanupError) {
                console.error("Cleanup error:", cleanupError);
            }
            sessionCleanedUp = true;
        }
    }

    async function GIFTED_PAIR_CODE() {

const {
    default: giftedConnect,
    useMultiFileAuthState,
    delay,
    fetchLatestBaileysVersion,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore,
    Browsers
    } = await getBaileys();


        let version;
        try {
            const live = await fetchLatestWaWebVersion();
            version = live?.isLatest && Array.isArray(live.version) ? live.version : null;
        } catch (e) {
            console.warn("Live WhatsApp Web version fetch failed:", e.message);
        }
        if (!version) {
            const fallback = await fetchLatestBaileysVersion();
            version = fallback.version;
        }
        console.log("WhatsApp Web version:", version);
        const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionDir, id));
        try {
            const socketOptions = {
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.windows("Chrome"),
                syncFullHistory: false,
                generateHighQualityLinkPreview: true,
                shouldIgnoreJid: jid => !!jid?.endsWith('@g.us'),
                getMessage: async () => undefined,
                markOnlineOnConnect: false,
                defaultQueryTimeoutMs: undefined,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000
            };

            let Gifted;
            let code;
            num = num.replace(/[^0-9]/g, '');

            // WhatsApp can close the initial Noise socket while the server is
            // still negotiating. Retry the whole socket instead of returning a
            // stale or failed pairing request to the browser.
            for (let attempt = 1; attempt <= 3 && !code; attempt++) {
                Gifted = giftedConnect(socketOptions);
                Gifted.ev.on('creds.update', saveCreds);
                try {
                    // Pairing-code login does not emit connection="open" until
                    // after the phone approves the code. Give the Noise socket
                    // a short negotiation window, then request the code.
                    await delay(2500);
                    const randomCode = generateRandomCode();
                    code = await Gifted.requestPairingCode(num, randomCode);
                    console.log("Pairing code generated successfully:", code);
                } catch (pairingError) {
                    console.warn(`Pairing socket attempt ${attempt} failed:`, pairingError.message);
                    try {
                        Gifted.ws?.close();
                    } catch (closeError) {
                        console.warn("Pairing socket cleanup failed:", closeError.message);
                    }
                    if (attempt < 3) await delay(1500);
                }
            }

            if (!code) {
                throw new Error("Unable to establish a WhatsApp pairing socket");
            }

            if (!Gifted.authState.creds.registered && !responseSent && !res.headersSent) {
                res.json({ code, fallback: sessionType === 'short' && !isConfigured() });
                responseSent = true;
            }

            Gifted.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    try {
                        await Gifted.groupAcceptInvite(GC_JID);
                    } catch (e) {
                        console.log("Group join error:", e.message);
                    }

                    // Vercel functions are short-lived; do not wait 50 seconds
                    // after login before reading the credentials.
                    await delay(5000);

                    let sessionData = null;
                    let attempts = 0;
                    const maxAttempts = 6;

                    while (attempts < maxAttempts && !sessionData) {
                        try {
                            const credsPath = path.join(sessionDir, id, "creds.json");
                            if (fs.existsSync(credsPath)) {
                                const data = fs.readFileSync(credsPath);
                                if (data && data.length > 100) {
                                    sessionData = data;
                                    break;
                                }
                            }
                            await delay(2000);
                            attempts++;
                        } catch (readError) {
                            console.error("Read error:", readError);
                            await delay(2000);
                            attempts++;
                        }
                    }

                    if (!sessionData) {
                        await cleanUpSession();
                        return;
                    }

                    try {
                        let compressedData = zlib.gzipSync(sessionData);
                        let b64data = compressedData.toString('base64');
                        const fullSession = SESSION_PREFIX + b64data;

                        let msgText, msgButtons;
                        if (isConfigured() && sessionType === 'short') {
                            const shortId = await saveSession(fullSession);
                            const shortSession = `${SESSION_PREFIX}${shortId}`;
                            msgText = `*SESSION ID ✅*\n\n${shortSession}`;
                            msgButtons = [
                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Session', copy_code: shortSession }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Bot Repo', url: BOT_REPO }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join WaChannel', url: WA_CHANNEL }) }
                            ];
                        } else {
                            msgText = `*SESSION ID ✅*\n\n${fullSession}`;
                            msgButtons = [
                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy Session', copy_code: fullSession }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Visit Bot Repo', url: BOT_REPO }) },
                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join WaChannel', url: WA_CHANNEL }) }
                            ];
                        }

                        await delay(5000);

                        let sessionSent = false;
                        let sendAttempts = 0;
                        const maxSendAttempts = 5;

                        while (sendAttempts < maxSendAttempts && !sessionSent) {
                            try {
                                await sendButtons(Gifted, Gifted.user.id, {
                                    title: '',
                                    text: msgText,
                                    footer: MSG_FOOTER,
                                    buttons: msgButtons
                                });
                                sessionSent = true;
                            } catch (sendError) {
                                console.error("Send error:", sendError);
                                sendAttempts++;
                                if (sendAttempts < maxSendAttempts) {
                                    await delay(3000);
                                }
                            }
                        }

                        await delay(3000);
                        await Gifted.ws.close();
                    } catch (sessionError) {
                        console.error("Session processing error:", sessionError);
                    } finally {
                        await cleanUpSession();
                    }

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output?.statusCode != 401) {
                    console.log("Reconnecting...");
                    await delay(5000);
                    GIFTED_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Main error:", err);
            if (!responseSent && !res.headersSent) {
                res.status(500).json({ code: "Service is Currently Unavailable" });
                responseSent = true;
            }
            await cleanUpSession();
        }
    }

    try {
        await GIFTED_PAIR_CODE();
        // Keep the pairing socket alive for the remainder of Vercel's
        // invocation window, accounting for connection/retry time already used.
        const maxInvocationMs = process.env.VERCEL ? 58000 : 120000;
        const remainingMs = Math.max(0, maxInvocationMs - (Date.now() - invocationStartedAt));
        const keepSocketAlive = new Promise((resolve) => setTimeout(resolve, remainingMs));
        if (process.env.VERCEL) {
            // Vercel otherwise may suspend the function once the JSON response
            // has been sent, even though WhatsApp is still waiting for approval.
            waitUntil(keepSocketAlive);
        } else {
            await keepSocketAlive;
        }
    } catch (finalError) {
        console.error("Final error:", finalError);
        await cleanUpSession();
        if (!responseSent && !res.headersSent) {
            res.status(500).json({ code: "Service Error" });
        }
    }
});

module.exports = router;
