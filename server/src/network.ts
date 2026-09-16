import os from 'os';

/**
 * Returns the primary local IPv4 address accessible on the LAN.
 * Prioritizes Wi-Fi (wlan/wl) or Ethernet (eth/en) interfaces.
 */
export function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  const candidates: { name: string; address: string; priority: number }[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    // Skip virtual/container interfaces
    if (/^(docker|br-|veth|vmnet|vboxnet|tun|tap)/i.test(name)) continue;

    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        let priority = 1;
        // Prioritize Wi-Fi or standard Ethernet
        if (/^(wlan|wl|wi-fi)/i.test(name)) {
          priority = 3;
        } else if (/^(eth|en|eno|ens)/i.test(name)) {
          priority = 2;
        }
        candidates.push({ name, address: addr.address, priority });
      }
    }
  }

  // Sort candidates by priority descending
  candidates.sort((a, b) => b.priority - a.priority);

  if (candidates.length > 0) {
    return candidates[0].address;
  }

  return '127.0.0.1';
}
