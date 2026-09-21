import express from 'express';
import cors from 'cors';
import { CONFIG } from './config.js';
import { getLocalIp } from './network.js';
import { sessionsRouter } from './routes/sessions.js';
import { downloadRouter } from './routes/download.js';
import { detectPrinterStatus } from './printer.js';

const app = express();

// Enable CORS for client
app.use(cors());

// Increase payload limit for 1080p base64 photos + animated BTS GIF + MP4
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/sessions', sessionsRouter);
app.use('/', downloadRouter);

// Printer status detection
app.get('/api/printer/status', async (req, res) => {
  try {
    const status = await detectPrinterStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      defaultPrinter: null,
      printers: [],
      statusText: 'Gagal membaca status printer'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const lanIp = getLocalIp();
  res.json({
    status: 'ok',
    lanIp,
    port: CONFIG.PORT,
    clientPort: CONFIG.CLIENT_PORT,
    time: new Date().toISOString()
  });
});

// Start HTTP server
app.listen(CONFIG.PORT, '0.0.0.0', () => {
  const lanIp = getLocalIp();
  console.log('====================================================');
  console.log(`Photobooth Server running on:`);
  console.log(`- Local:    http://localhost:${CONFIG.PORT}`);
  console.log(`- LAN IP:   http://${lanIp}:${CONFIG.PORT}`);
  console.log(`- Storage:  ${CONFIG.STORAGE_DIR}`);
  console.log(`- Retensi:  Permanen (Foto tersimpan selamanya)`);
  console.log('====================================================');
});
