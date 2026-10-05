import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, RefreshCw, CheckCircle2, AlertTriangle, Send, Eye, Ruler } from 'lucide-react';
import { TextPrintLayout, PrintPreset } from '../types/photobooth';
import { printTextDocument } from '../utils/printManager';

interface PrinterStatusData {
  connected: boolean;
  defaultPrinter: string | null;
  printers: string[];
  statusText: string;
}

interface DevPrintViewProps {
  onBack: () => void;
}

const PRESET_TEXTS: Record<PrintPreset, string> = {
  receipt: `PHOTOBOOTH KIOSK #01
Lokasi: Event Booth Hall A
----------------------------------------
Sesi Foto  : #PB-${Math.floor(1000 + Math.random() * 9000)}
Jumlah Shot: 3 Foto Polaroid
Frame      : Vintage 35mm Strip
Status     : LUNAS / COMPLETED
----------------------------------------
Item                 Qty          Harga
Polaroid Strip 2x6     1          Rp 0
Digital BTS Video      1          Rp 0
QR Cloud Download      1          Rp 0
----------------------------------------
Total Cetak: 1 Lembar
----------------------------------------
Terima kasih sudah berfoto bersama kami!
Instagram: @photobooth.id`,

  alignment: `========================================
[+] ALIGNMENT & MARGIN TEST PATTERN [+]
========================================
0123456789012345678901234567890123456789
|<-          40 KARAKTER LEBAR       ->|
----------------------------------------
Tengah Layar:
[ * * * * CENTER ALIGNMENT * * * * ]

Uji Karakter Spesial:
!@#$%^&*()_+~|}{[]:;?><,./

Batas Kiri |                       | Batas Kanan
Batas Kiri |                       | Batas Kanan
----------------------------------------
Jika teks terpotong, sesuaikan margin
printer di pengaturan CUPS / Driver.`,

  custom: `Halo! Ini adalah tes cetak teks dari Photobooth Kiosk.

Baris 1: Printer siap digunakan
Baris 2: Kertas terpasang rapi
Baris 3: Tinta / Ribbon printer normal

Silakan edit teks ini sesuka Anda untuk pengujian!`
};

export const DevPrintView: React.FC<DevPrintViewProps> = ({ onBack }) => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingPrinterStatus] = useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');

  const [layout, setLayout] = useState<TextPrintLayout>('single-2x6');
  const [preset, setPreset] = useState<PrintPreset>('receipt');
  const [customText, setCustomText] = useState<string>(PRESET_TEXTS.receipt);
  const [showRuler, setShowRuler] = useState<boolean>(true);

  const [isBrowserPrinting, setIsBrowserPrinting] = useState<boolean>(false);
  const [isServerPrinting, setIsServerPrinting] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPrinterStatus = async () => {
    setIsLoadingPrinterStatus(true);
    try {
      const res = await fetch('/api/printer/status');
      if (res.ok) {
        const data: PrinterStatusData = await res.json();
        setPrinterStatus(data);
        if (data.defaultPrinter && !selectedPrinter) {
          setSelectedPrinter(data.defaultPrinter);
        }
      }
    } catch (err) {
      console.warn('Gagal membaca status printer:', err);
    } finally {
      setIsLoadingPrinterStatus(false);
    }
  };

  useEffect(() => {
    fetchPrinterStatus();
  }, []);

  const handleSelectPreset = (p: PrintPreset) => {
    setPreset(p);
    setCustomText(PRESET_TEXTS[p]);
  };

  const handleBrowserPrint = async () => {
    setIsBrowserPrinting(true);
    setPrintFeedback(null);
    try {
      const success = await printTextDocument({
        title: 'PHOTOBOOTH TEST PRINT',
        text: customText,
        layout,
        showRuler
      });
      if (success) {
        setPrintFeedback({
          type: 'success',
          message: 'Dialog / job cetak browser berhasil dikirim!'
        });
      } else {
        setPrintFeedback({
          type: 'error',
          message: 'Pencetakan browser dibatalkan atau terjadi kendala.'
        });
      }
    } catch (err: any) {
      setPrintFeedback({
        type: 'error',
        message: err.message || 'Gagal memicu pencetakan browser.'
      });
    } finally {
      setIsBrowserPrinting(false);
    }
  };

  const handleServerDirectPrint = async () => {
    setIsServerPrinting(true);
    setPrintFeedback(null);
    try {
      const res = await fetch('/api/printer/test-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText,
          printerName: selectedPrinter || undefined,
          title: 'PHOTOBOOTH TEST PRINT',
          layout
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPrintFeedback({
          type: 'success',
          message: data.jobId ? `${data.message} [ID: ${data.jobId}]` : data.message
        });
      } else {
        setPrintFeedback({
          type: 'error',
          message: data.message || 'Backend gagal mengirim job ke spooler OS.'
        });
      }
    } catch (err: any) {
      setPrintFeedback({
        type: 'error',
        message: err.message || 'Gagal menghubungi server lokal.'
      });
    } finally {
      setIsServerPrinting(false);
    }
  };

  // Preview paper width/style helper
  const getPreviewContainerStyle = () => {
    switch (layout) {
      case 'double-4x6':
        return 'w-[320px] min-h-[460px]';
      case 'thermal-58':
        return 'w-[220px] min-h-[380px]';
      case 'thermal-80':
        return 'w-[280px] min-h-[420px]';
      case 'a4':
        return 'w-[360px] min-h-[500px]';
      case 'single-2x6':
      default:
        return 'w-[220px] min-h-[480px]';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FDF7F5] text-[#4B3F3D] overflow-hidden select-none p-4 md:p-6 gap-4">
      {/* 1. Header Bar */}
      <header className="h-16 px-6 rounded-2xl bg-white border-2 border-b-4 border-[#E8CEC9] flex items-center justify-between z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-[#FDF7F5] border-2 border-[#E8CEC9] flex items-center justify-center text-[#8B7B78] hover:text-duo-red hover:bg-[#FFF0ED] transition-all cursor-pointer"
            title="Kembali ke Menu Utama"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-duo-red">
                DEV PRINTER DIAGNOSTICS
              </span>
              <span className="bg-[#FFF0ED] text-duo-red border border-duo-border px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                Testing Tools
              </span>
            </div>
            <p className="text-xs text-[#8B7B78] font-bold">
              Uji coba cetak teks langsung ke printer fisik atau silent kiosk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPrinterStatus}
            disabled={isLoadingStatus}
            className="btn-duo-secondary px-3 py-2 text-xs font-black flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            <span>Segarkan Status</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Controls & Configuration (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-1">
          {/* Hardware Status Card */}
          <div className="card-duo p-4 bg-white border-2 border-b-4 border-[#E8CEC9] rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-duo-red" />
                <h3 className="font-black text-sm uppercase text-duo-text">Status Hardware Printer</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    printerStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-bold text-[#8B7B78]">
                  {printerStatus?.connected ? 'Online / Siap' : 'Offline / Tidak Terdeteksi'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FDF7F5] p-3 rounded-xl border border-[#E8CEC9]">
                <div className="text-[10px] font-black uppercase text-[#8B7B78] mb-1">Printer Default OS</div>
                <div className="font-black text-sm text-[#4B3F3D] truncate">
                  {printerStatus?.defaultPrinter || 'Tidak Ada'}
                </div>
                <div className="text-[11px] text-[#8B7B78] mt-0.5">{printerStatus?.statusText}</div>
              </div>

              <div className="bg-[#FDF7F5] p-3 rounded-xl border border-[#E8CEC9]">
                <div className="text-[10px] font-black uppercase text-[#8B7B78] mb-1">Target Printer Pengujian</div>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full bg-white border border-[#E8CEC9] rounded-lg px-2 py-1.5 font-bold text-xs text-[#4B3F3D] focus:outline-none focus:border-duo-red"
                >
                  <option value="">Gunakan Default OS ({printerStatus?.defaultPrinter || 'N/A'})</option>
                  {(printerStatus?.printers || []).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuration Card: Layout & Presets */}
          <div className="card-duo p-4 bg-white border-2 border-b-4 border-[#E8CEC9] rounded-2xl flex flex-col gap-3">
            {/* Paper Layout Selector */}
            <div>
              <div className="text-xs font-black uppercase text-[#8B7B78] mb-2 flex items-center justify-between">
                <span>1. Pilih Format Kertas</span>
                <span className="text-[10px] text-duo-red font-bold">@page CSS rule</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'single-2x6', label: 'Strip 2x6"', desc: 'Photobooth' },
                  { id: 'double-4x6', label: 'Strip 4x6"', desc: '2 Side-by-Side' },
                  { id: 'thermal-58', label: 'Thermal 58mm', desc: 'Struk Kasir' },
                  { id: 'thermal-80', label: 'Thermal 80mm', desc: 'Struk Lebar' },
                  { id: 'a4', label: 'Kertas A4', desc: 'Dokumen' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLayout(item.id as TextPrintLayout)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      layout === item.id
                        ? 'border-duo-red bg-[#FFF0ED] text-duo-red shadow-sm'
                        : 'border-[#E8CEC9] bg-[#FDF7F5] text-[#4B3F3D] hover:border-[#D5C2BE]'
                    }`}
                  >
                    <div className="font-black text-xs leading-tight">{item.label}</div>
                    <div className="text-[10px] text-[#8B7B78] font-bold mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets & Ruler Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2E5E2]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase text-[#8B7B78] mr-1">2. Preset Teks:</span>
                {[
                  { id: 'receipt', label: 'Struk Transaksi' },
                  { id: 'alignment', label: 'Uji Margin & Border' },
                  { id: 'custom', label: 'Custom' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPreset(item.id as PrintPreset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                      preset === item.id
                        ? 'bg-duo-red text-white'
                        : 'bg-[#FDF7F5] border border-[#E8CEC9] text-[#8B7B78] hover:text-[#4B3F3D]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#8B7B78]">
                <input
                  type="checkbox"
                  checked={showRuler}
                  onChange={(e) => setShowRuler(e.target.checked)}
                  className="rounded text-duo-red focus:ring-duo-red"
                />
                <Ruler className="w-3.5 h-3.5" />
                <span>Garis Batas & Crosshair (+)</span>
              </label>
            </div>

            {/* Editable Content */}
            <div>
              <div className="text-xs font-black uppercase text-[#8B7B78] mb-1.5 flex items-center justify-between">
                <span>Konten Teks yang Dicetak</span>
                <span className="text-[10px] text-[#8B7B78] font-medium">{customText.length} karakter</span>
              </div>
              <textarea
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setPreset('custom');
                }}
                rows={7}
                className="w-full bg-[#FDF7F5] border-2 border-[#E8CEC9] rounded-xl p-3 font-mono text-xs text-[#333] focus:outline-none focus:border-duo-red resize-y leading-relaxed select-text"
                placeholder="Ketik teks yang ingin dicetak..."
              />
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Browser Print */}
            <button
              onClick={handleBrowserPrint}
              disabled={isBrowserPrinting}
              className="card-duo p-4 bg-duo-red text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-md hover:bg-[#C23C3E] active:translate-y-1 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              <span>{isBrowserPrinting ? 'Membuka Cetak...' : 'CETAK VIA BROWSER (IFRAME)'}</span>
            </button>

            {/* Action 2: Server CUPS Print */}
            <button
              onClick={handleServerDirectPrint}
              disabled={isServerPrinting}
              className="card-duo p-4 bg-white border-2 border-b-4 border-[#E8CEC9] text-[#4B3F3D] rounded-2xl flex items-center justify-center gap-3 font-black text-sm shadow-sm hover:border-duo-red hover:text-duo-red active:translate-y-1 transition-all cursor-pointer"
            >
              <Send className="w-5 h-5 text-duo-red" />
              <span>{isServerPrinting ? 'Mengirim ke OS...' : 'CETAK LANGSUNG (CUPS/OS)'}</span>
            </button>
          </div>

          {/* Feedback Toast */}
          {printFeedback && (
            <div
              className={`p-3.5 rounded-xl border-2 flex items-center gap-3 text-xs font-bold animate-fadeIn ${
                printFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {printFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="flex-1">{printFeedback.message}</div>
            </div>
          )}
        </div>

        {/* Right Column: Live Paper Simulation Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-b-4 border-[#E8CEC9] rounded-2xl p-4 flex flex-col items-center overflow-hidden">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#F2E5E2] shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-duo-red" />
              <span className="text-xs font-black uppercase text-duo-text">Pratinjau Kertas Cetak</span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-[#FDF7F5] border border-[#E8CEC9] px-2 py-0.5 rounded-lg text-[#8B7B78]">
              {layout}
            </span>
          </div>

          {/* Paper View Container */}
          <div className="flex-1 w-full bg-[#E5E0DC] rounded-xl p-4 flex items-center justify-center overflow-auto shadow-inner">
            <div
              className={`bg-white shadow-2xl p-4 text-[#111] font-mono text-[11px] leading-snug transition-all duration-300 relative border border-gray-300 ${getPreviewContainerStyle()}`}
            >
              {/* Corner crosshairs */}
              {showRuler && (
                <>
                  <div className="absolute top-1 left-1 text-xs font-bold text-gray-400 select-none">+</div>
                  <div className="absolute top-1 right-1 text-xs font-bold text-gray-400 select-none">+</div>
                  <div className="absolute bottom-1 left-1 text-xs font-bold text-gray-400 select-none">+</div>
                  <div className="absolute bottom-1 right-1 text-xs font-bold text-gray-400 select-none">+</div>
                </>
              )}

              {/* Simulated Paper Header */}
              <div className="text-center pb-2 mb-2 border-b border-black">
                <div className="font-bold text-xs uppercase tracking-wider">PHOTOBOOTH TEST PRINT</div>
                <div className="text-[9px] text-gray-600">
                  {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div className="text-[9px] text-gray-500">Format: {layout}</div>
              </div>

              {/* Text Body */}
              <div className={`whitespace-pre-wrap break-words ${showRuler ? 'border border-dashed border-gray-300 p-2' : ''}`}>
                {customText}
              </div>

              {/* Simulated Paper Footer */}
              <div className="text-center pt-2 mt-3 border-t border-dashed border-black text-[9px] text-gray-600">
                <div>*** PHOTOBOOTH TEST OK ***</div>
                <div>Hardware & Spooler Diagnostic</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
