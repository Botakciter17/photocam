import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localSourceDir = path.resolve(__dirname, '../node_modules/@mediapipe/hands');
const rootSourceDir = path.resolve(__dirname, '../../node_modules/@mediapipe/hands');
const targetDir = path.resolve(__dirname, '../public/mediapipe');

const sourceDir = fs.existsSync(localSourceDir)
  ? localSourceDir
  : fs.existsSync(rootSourceDir)
  ? rootSourceDir
  : null;

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (sourceDir) {
  const files = fs.readdirSync(sourceDir);
  let copied = 0;
  for (const file of files) {
    if (file.endsWith('.wasm') || file.endsWith('.binarypb') || file.endsWith('.js') || file.endsWith('.tflite') || file.endsWith('.data')) {
      fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
      copied++;
    }
  }
  console.log(`[MediaPipe Offline Assets] Copied ${copied} binary/model files to ${targetDir}`);
} else {
  console.log('[MediaPipe Offline Assets] @mediapipe/hands not found in node_modules yet.');
}
