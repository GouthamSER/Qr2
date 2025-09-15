import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';

import pairRouter from './pair.js';
import qrRouter from './qr.js';
import QRCode from 'qrcode';
import('events').then(events => {
    events.EventEmitter.defaultMaxListeners = 500;
});

const app = express();

// Set port from Koyeb environment or fallback to 3000
const PORT = process.env.PORT || 3000;

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.use('/pair', pairRouter);
app.use('/qr', qrRouter);

// Start server (for Koyeb)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`GitHub: GouthamSER\nServer running at http://0.0.0.0:${PORT}`);
});

export default app;
