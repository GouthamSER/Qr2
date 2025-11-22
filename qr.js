import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { delay } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const router = express.Router();

// Function to remove files or directories
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
        return true;
    } catch (e) {
        console.error('Error removing file:', e);
        return false;
    }
}

router.get('/', async (req, res) => {
    const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const dirs = `./qr_sessions/session_${sessionId}`;

    if (!fs.existsSync('./qr_sessions')) {
        fs.mkdirSync('./qr_sessions', { recursive: true });
    }

    async function initiateSession() {
        if (!fs.existsSync(dirs)) fs.mkdirSync(dirs, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(dirs);

        try {
            const { version } = await fetchLatestBaileysVersion();

            let qrGenerated = false;
            let responseSent = false;

            const handleQRCode = async (qr) => {
                if (qrGenerated || responseSent) return;

                qrGenerated = true;
                console.log('🟢 QR Code Generated!');

                try {
                    const qrDataURL = await QRCode.toDataURL(qr, {
                        errorCorrectionLevel: 'M',
                        type: 'image/png',
                        quality: 0.92,
                        margin: 1,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });

                    if (!responseSent) {
                        responseSent = true;
                        res.send({
                            qr: qrDataURL,
                            message: 'QR Code Generated!',
                            instructions: [
                                '1. Open WhatsApp on your phone',
                                '2. Go to Settings > Linked Devices',
                                '3. Tap "Link a Device"',
                                '4. Scan the QR code above'
                            ]
                        });
                    }
                } catch (qrError) {
                    console.error('Error generating QR:', qrError);
                    if (!responseSent) {
                        responseSent = true;
                        res.status(500).send({ code: 'Failed to generate QR code' });
                    }
                }
            };

            // ⬇️⬇️ UPDATED BROWSER + DEVICE NAME (Safari + MD BOT)
            const socketConfig = {
                version,
                logger: pino({ level: 'silent' }),

                // Custom Safari browser & device name MD BOT
                browser: Browsers.macOS('Desktop'),

                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },

                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 250,
                maxRetries: 5,
            };

            let sock = makeWASocket(socketConfig);
            let reconnectAttempts = 0;
            const maxReconnectAttempts = 3;

            const handleConnectionUpdate = async (update) => {
                const { connection, lastDisconnect, qr } = update;
                console.log(`🔄 Connection update: ${connection || 'undefined'}`);

                if (qr && !qrGenerated) await handleQRCode(qr);

                if (connection === 'open') {
                    console.log('✅ Connected successfully!');
                    console.log('💾 Session saved to:', dirs);

                    reconnectAttempts = 0;

                    try {
                        const sessionKnight = fs.readFileSync(dirs + '/creds.json');

                        const userJid = Object.keys(sock.authState.creds.me || {}).length > 0
                            ? jidNormalizedUser(sock.authState.creds.me.id)
                            : null;

                        if (userJid) {
                            await sock.sendMessage(userJid, {
                                document: sessionKnight,
                                mimetype: 'application/json',
                                fileName: 'creds.json'
                            });

                            await sock.sendMessage(userJid, {
                                image: { url: 'https://telegra.ph/file/23f226130bfdc3ef0baad.jpg' },
                                caption: `🎬 *KuttuBot MD V2.0 Full Setup Guide!*\n\n🚀 Bug Fixes + New Commands + Fast AI Chat\n📺 Watch Now: https://youtu.be/-oz_u1iMgf8`
                            });

                            await sock.sendMessage(userJid, {
                                text: `⚠️Do not share this file with anybody⚠️\n 
┌┤✑  Thanks for using Kuttubot
│└────────────┈ ⳹        
│©2025 Gᴏᴜᴛʜᴀᴍ Jᴏsʜ 么
└─────────────────┈ ⳹\n\n`
                            });
                        }
                    } catch (error) {
                        console.error("Error sending session file:", error);
                    }

                    setTimeout(() => {
                        console.log('🧹 Cleaning up session...');
                        const deleted = removeFile(dirs);
                        console.log(deleted ? '✅ Cleaned successfully' : '❌ Cleanup failed');
                    }, 15000);
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;

                    if (statusCode === 401) {
                        console.log('🔐 Logged out - new QR needed');
                        removeFile(dirs);
                    } else if (statusCode === 515 || statusCode === 503) {
                        reconnectAttempts++;

                        if (reconnectAttempts <= maxReconnectAttempts) {
                            setTimeout(() => {
                                try {
                                    sock = makeWASocket(socketConfig);
                                    sock.ev.on('connection.update', handleConnectionUpdate);
                                    sock.ev.on('creds.update', saveCreds);
                                } catch (err) {
                                    console.error('Reconnect failed:', err);
                                }
                            }, 2000);
                        } else {
                            if (!responseSent) {
                                responseSent = true;
                                res.status(503).send({ code: 'Connection failed after multiple attempts' });
                            }
                        }
                    }
                }
            };

            sock.ev.on('connection.update', handleConnectionUpdate);
            sock.ev.on('creds.update', saveCreds);

            setTimeout(() => {
                if (!responseSent) {
                    responseSent = true;
                    res.status(408).send({ code: 'QR generation timeout' });
                    removeFile(dirs);
                }
            }, 30000);

        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) {
                res.status(503).send({ code: 'Service Unavailable' });
            }
            removeFile(dirs);
        }
    }

    await initiateSession();
});

process.on('uncaughtException', (err) => {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    if (e.includes("Stream Errored")) return;
    if (e.includes("Stream Errored (restart required)")) return;
    if (e.includes("statusCode: 515")) return;
    if (e.includes("statusCode: 503")) return;
    console.log('Caught exception: ', err);
});

export default router;
