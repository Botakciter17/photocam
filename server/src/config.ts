import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: Number(process.env.PORT) || 3001,
  CLIENT_PORT: Number(process.env.CLIENT_PORT) || 5173,
  STORAGE_DIR: path.resolve(__dirname, '../storage/photos')
};
