import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import net from 'net';

const execAsync = util.promisify(exec);

export interface PrinterStatusInfo {
  connected: boolean;
  defaultPrinter: string | null;
  printers: string[];
  statusText: string;
}

/**
 * Checks if a network printer host:port is reachable.
 */
function checkNetworkPrinter(host: string, port: number = 9100, timeoutMs: number = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.once('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.once('error', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Checks if a USB printer is physically connected to the computer hardware.
 */
function isUsbPrinterPhysicallyPresent(uri: string, printerName: string): boolean {
  // 1. Check if kernel USB printer device exists in /dev/usb/lp*
  try {
    if (fs.existsSync('/dev/usb')) {
      const devFiles = fs.readdirSync('/dev/usb');
      if (devFiles.some((f) => f.startsWith('lp'))) {
        return true;
      }
    }
  } catch {}

  // 2. Inspect active USB devices in sysfs (/sys/bus/usb/devices)
  try {
    const sysPath = '/sys/bus/usb/devices';
    if (fs.existsSync(sysPath)) {
      const devices = fs.readdirSync(sysPath);

      // Extract serial from URI if available (e.g., ?serial=5841474B4437353161)
      const serialMatch = uri.match(/[?&]serial=([^&]+)/i);
      const targetSerial = serialMatch ? decodeURIComponent(serialMatch[1]).toLowerCase().trim() : null;

      // Extract name tokens (e.g., "epson", "l3210")
      const searchTokens = (printerName + ' ' + uri)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 3 && !['usb', 'series', 'device', 'interface'].includes(w));

      for (const d of devices) {
        const dir = `${sysPath}/${d}`;

        let product = '';
        let manufacturer = '';
        let serial = '';

        try {
          if (fs.existsSync(`${dir}/product`)) {
            product = fs.readFileSync(`${dir}/product`, 'utf8').trim().toLowerCase();
          }
        } catch {}

        try {
          if (fs.existsSync(`${dir}/manufacturer`)) {
            manufacturer = fs.readFileSync(`${dir}/manufacturer`, 'utf8').trim().toLowerCase();
          }
        } catch {}

        try {
          if (fs.existsSync(`${dir}/serial`)) {
            serial = fs.readFileSync(`${dir}/serial`, 'utf8').trim().toLowerCase();
          }
        } catch {}

        // Match exact serial number
        if (targetSerial && serial && (serial === targetSerial || serial.includes(targetSerial))) {
          return true;
        }

        // Match product/manufacturer against printer name tokens
        const combined = `${product} ${manufacturer} ${serial}`;
        for (const token of searchTokens) {
          if (combined.includes(token)) {
            return true;
          }
        }

        // Check if device specifies printer class (Interface class 7)
        try {
          const subdirs = fs.readdirSync(dir);
          for (const sub of subdirs) {
            const classFile = `${dir}/${sub}/bInterfaceClass`;
            if (fs.existsSync(classFile)) {
              const cls = fs.readFileSync(classFile, 'utf8').trim();
              if (cls === '07' || cls === '7') {
                return true;
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  return false;
}

/**
 * Detects installed printers and validates whether the physical hardware is actually plugged in and ready.
 */
export async function detectPrinterStatus(): Promise<PrinterStatusInfo> {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    try {
      const command =
        'powershell -NoProfile -Command "Get-CimInstance Win32_Printer | Select-Object Name, Default, PrinterStatus, WorkOffline, PortName | ConvertTo-Json"';
      const { stdout } = await execAsync(command, { timeout: 4000 });
      if (!stdout || stdout.trim() === '') {
        return {
          connected: false,
          defaultPrinter: null,
          printers: [],
          statusText: 'Tidak ada printer terdeteksi'
        };
      }

      let parsed = JSON.parse(stdout.trim());
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      const printers = parsed.map((p: any) => String(p.Name || '')).filter(Boolean);
      const defaultItem = parsed.find((p: any) => p.Default === true) || parsed[0];

      if (defaultItem) {
        const isOffline = defaultItem.WorkOffline === true;
        const status = Number(defaultItem.PrinterStatus);
        // Status 3 = Idle/Ready, Status 7 = Offline
        const isReady = !isOffline && (status === 3 || status === 0 || isNaN(status));

        return {
          connected: isReady,
          defaultPrinter: defaultItem.Name || null,
          printers,
          statusText: isReady ? 'Terhubung & Siap' : 'Kabel Belum Dicolok / Offline'
        };
      }

      return {
        connected: false,
        defaultPrinter: null,
        printers,
        statusText: 'Belum ada printer default'
      };
    } catch {
      return {
        connected: false,
        defaultPrinter: null,
        printers: [],
        statusText: 'Gagal mendeteksi printer Windows'
      };
    }
  }

  // Linux / macOS via CUPS (lpstat -p -d -v)
  try {
    const { stdout } = await execAsync('lpstat -p -d -v 2>&1', { timeout: 3000 });
    const lines = stdout.split('\n');

    let defaultPrinter: string | null = null;
    const printers: string[] = [];
    const printerUris = new Map<string, string>();

    for (const line of lines) {
      // e.g. "system default destination: L3210-Series"
      const defaultMatch = line.match(/^system default destination:\s*(.+)$/i);
      if (defaultMatch) {
        defaultPrinter = defaultMatch[1].trim();
      }

      // e.g. "printer L3210-Series is idle..."
      const printerMatch = line.match(/^printer\s+([^\s]+)/i);
      if (printerMatch) {
        const name = printerMatch[1].trim();
        if (!printers.includes(name)) {
          printers.push(name);
        }
      }

      // e.g. "device for L3210-Series: usb://EPSON/L3210%20Series?serial=..."
      const uriMatch = line.match(/^device for\s+([^:]+):\s*(.+)$/i);
      if (uriMatch) {
        printerUris.set(uriMatch[1].trim(), uriMatch[2].trim());
      }
    }

    if (!defaultPrinter && printers.length > 0) {
      defaultPrinter = printers[0];
    }

    if (!defaultPrinter) {
      return {
        connected: false,
        defaultPrinter: null,
        printers: [],
        statusText: 'Tidak ada printer default terpasang'
      };
    }

    const uri = printerUris.get(defaultPrinter) || '';

    // 1. USB Printer verification
    if (uri.startsWith('usb://')) {
      const isPlugged = isUsbPrinterPhysicallyPresent(uri, defaultPrinter);
      return {
        connected: isPlugged,
        defaultPrinter,
        printers,
        statusText: isPlugged ? 'Terhubung & Siap' : 'Kabel USB Belum Dicolok (Offline)'
      };
    }

    // 2. Network / Socket Printer verification
    if (uri.startsWith('socket://') || uri.startsWith('ipp://') || uri.startsWith('http://')) {
      const urlClean = uri.replace(/^[^:]+:\/\//, '');
      const hostPort = urlClean.split('/')[0].split('?')[0];
      const [host, portStr] = hostPort.split(':');
      const port = Number(portStr) || (uri.startsWith('socket://') ? 9100 : 631);

      const isReachable = await checkNetworkPrinter(host, port);
      return {
        connected: isReachable,
        defaultPrinter,
        printers,
        statusText: isReachable ? 'Terhubung & Siap (Jaringan)' : 'Printer Jaringan Offline'
      };
    }

    // 3. Virtual / PDF / File Printer
    return {
      connected: true,
      defaultPrinter,
      printers,
      statusText: 'Printer Virtual / PDF Siap'
    };
  } catch (err: any) {
    const errMsg = String(err?.stdout || err?.message || '');
    if (errMsg.includes('no system default destination') || errMsg.includes('No destinations added')) {
      return {
        connected: false,
        defaultPrinter: null,
        printers: [],
        statusText: 'Belum ada printer di OS'
      };
    }

    return {
      connected: false,
      defaultPrinter: null,
      printers: [],
      statusText: 'CUPS / Spooler Tidak Aktif'
    };
  }
}
