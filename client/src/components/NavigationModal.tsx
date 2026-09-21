import React, { useState, useEffect } from 'react';
import { NavMode, PrintLayout } from '../types/photobooth';
import { Sparkles, Mouse, Hand, Check, X, Printer, RefreshCw } from 'lucide-react';

interface PrinterStatusData {
  connected: boolean;
  defaultPrinter: string | null;
  printers: string[];
  statusText: string;
}

interface NavigationModalProps {
  isOpen: boolean;
  currentMode: NavMode;
  autoPrint: boolean;
  printLayout: PrintLayout;
  isSettingsMode?: boolean; // if true, shows a close button
  onSelectMode: (mode: NavMode) => void;
  onToggleAutoPrint: (enabled: boolean) => void;
  onChangePrintLayout: (layout: PrintLayout) => void;
  onClose?: () => void;
}

export const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  currentMode,
  autoPrint,
  printLayout,
  isSettingsMode = false,
  onSelectMode,
  onToggleAutoPrint,
  onChangePrintLayout,
  onClose
}) => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatusData | null>(null);
  const [isLoadingPrinter, setIsLoadingPrinter] = useState<boolean>(false);

  const fetchPrinterStatus = async () => {
    setIsLoadingPrinter(true);
    try {
      const res = await fetch('/api/printer/status');
      if (res.ok) {
        const data = await res.json();
        setPrinterStatus(data);
      }
    } catch (err) {
      console.warn('Failed to check printer status:', err);
    } finally {
      setIsLoadingPrinter(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrinterStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 md:p-6 select-none animate-fadeIn overflow-y-auto">
      <div className="card-duo max-w-xl w-full p-6 md:p-8 relative shadow-2xl border-4 border-b-8 border-[#E8CEC9] bg-white flex flex-col items-center text-center my-auto">
        {/* Close button if opened from settings */}
        {isSettingsMode && onClose && (
          <button
            data-interactive="true"
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-2xl bg-[#FDF7F5] border-2 border-[#E8CEC9] flex items-center justify-center text-[#8B7B78] hover:text-[#D34B4D] hover:bg-[#FFF0F0] transition-colors cursor-pointer"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0ED] text-duo-red text-xs font-black uppercase tracking-wider border-2 border-duo-border mb-3">
          <Sparkles className="w-4 h-4 fill-duo-red text-duo-red" />
          <span>Pengaturan Photobooth</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-duo-text tracking-tight mb-2">
          PENGATURAN KIOSK
        </h2>
        <p className="text-[#8B7B78] text-xs md:text-sm font-bold max-w-md mb-6 leading-relaxed">
          Atur metode navigasi kontrol dan opsi cetak otomatis untuk kiosk photobooth kamu.
        </p>

        {/* Section 1: Navigation Mode Cards */}
        <div className="w-full text-left mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#4B3F3D]">
            Metode Navigasi Kontrol
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full mb-6">
          {/* Option 1: Hand Tracking */}
          <div
            data-interactive="true"
            onClick={() => onSelectMode('hand')}
            className={`p-4 md:p-5 rounded-3xl border-3 cursor-pointer transition-all duration-150 flex flex-col items-center text-center relative ${
              currentMode === 'hand'
                ? 'bg-[#FFF0ED] border-duo-red border-b-6 border-b-duo-redDeep shadow-duo-sm translate-y-[-2px]'
                : 'bg-[#FDF7F5] border-[#E8CEC9] border-b-5 border-b-[#D5C2BE] hover:bg-[#FFF7F5] hover:border-duo-red/60 active:translate-y-1'
            }`}
          >
            {currentMode === 'hand' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-duo-red text-white flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}

            <div
              className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center mb-2.5 shadow-sm ${
                currentMode === 'hand'
                  ? 'bg-duo-red text-white border-duo-redDeep'
                  : 'bg-white text-duo-red border-[#E8CEC9]'
              }`}
            >
              <Hand className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-black text-duo-text mb-0.5">
              Gestur Tangan
            </h3>
            <span className="text-[10px] font-black uppercase text-duo-red bg-white px-2 py-0.5 rounded-full border border-duo-border mb-1.5">
              Hands-Free
            </span>
            <p className="text-[#8B7B78] text-[11px] font-bold leading-tight">
              Arahkan telapak & kuncupkan jari untuk klik tanpa sentuh layar.
            </p>
          </div>

          {/* Option 2: Mouse / Touchpad */}
          <div
            data-interactive="true"
            onClick={() => onSelectMode('mouse')}
            className={`p-4 md:p-5 rounded-3xl border-3 cursor-pointer transition-all duration-150 flex flex-col items-center text-center relative ${
              currentMode === 'mouse'
                ? 'bg-[#FFF0ED] border-duo-red border-b-6 border-b-duo-redDeep shadow-duo-sm translate-y-[-2px]'
                : 'bg-[#FDF7F5] border-[#E8CEC9] border-b-5 border-b-[#D5C2BE] hover:bg-[#FFF7F5] hover:border-duo-red/60 active:translate-y-1'
            }`}
          >
            {currentMode === 'mouse' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-duo-red text-white flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}

            <div
              className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center mb-2.5 shadow-sm ${
                currentMode === 'mouse'
                  ? 'bg-duo-red text-white border-duo-redDeep'
                  : 'bg-white text-duo-red border-[#E8CEC9]'
              }`}
            >
              <Mouse className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h3 className="text-base font-black text-duo-text mb-0.5">
              Mouse / Touchpad
            </h3>
            <span className="text-[10px] font-black uppercase text-[#8B7B78] bg-white px-2 py-0.5 rounded-full border border-duo-border mb-1.5">
              Standar
            </span>
            <p className="text-[#8B7B78] text-[11px] font-bold leading-tight">
              Gunakan klik mouse/touchpad tanpa perlu kamera kursor aktif.
            </p>
          </div>
        </div>

        {/* Section 2: Auto-Print Settings */}
        <div className="w-full bg-[#FDF7F5] p-4 rounded-3xl border-2 border-[#E8CEC9] border-b-4 border-b-[#D5C2BE] mb-6 text-left">
          {/* Printer Hardware Connection Status Card */}
          <div className="w-full bg-white p-3 rounded-2xl border-2 border-[#E8CEC9] mb-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 text-left min-w-0 flex-1">
              <div
                className={`w-3.5 h-3.5 rounded-full flex-shrink-0 transition-colors ${
                  printerStatus?.connected
                    ? 'bg-[#58CC02] shadow-[0_0_8px_#58CC02]'
                    : 'bg-[#D34B4D] shadow-[0_0_8px_#D34B4D]'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-duo-text">
                    {printerStatus?.connected ? 'Printer Siap' : 'Printer Belum Tersambung'}
                  </span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      printerStatus?.connected
                        ? 'bg-[#EFFFE0] text-[#46A302] border border-[#B4F087]'
                        : 'bg-[#FFF0ED] text-duo-red border border-duo-border'
                    }`}
                  >
                    {printerStatus?.connected ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-[#8B7B78] truncate mt-0.5">
                  {printerStatus?.defaultPrinter
                    ? `${printerStatus.defaultPrinter}: ${printerStatus.statusText}`
                    : 'Belum ada printer terpasang di sistem'}
                </p>
                {!printerStatus?.connected && (
                  <p className="text-[10px] font-black text-duo-red mt-0.5">
                    Colokkan kabel USB printer ke PC lalu klik Cek Ulang
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              data-interactive="true"
              onClick={fetchPrinterStatus}
              disabled={isLoadingPrinter}
              className="btn-duo-secondary px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 ml-2 flex-shrink-0"
              title="Cek ulang koneksi printer"
            >
              <RefreshCw className={`w-3 h-3 stroke-[2.5] ${isLoadingPrinter ? 'animate-spin' : ''}`} />
              <span>Cek Ulang</span>
            </button>
          </div>

          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-duo-red stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#4B3F3D]">
                Auto-Print Selesai Foto
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                data-interactive="true"
                onClick={() => onToggleAutoPrint(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  autoPrint ? 'btn-select-active' : 'btn-select-inactive'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                data-interactive="true"
                onClick={() => onToggleAutoPrint(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  !autoPrint ? 'btn-select-active' : 'btn-select-inactive'
                }`}
              >
                Mati
              </button>
            </div>
          </div>

          <p className="text-[#8B7B78] text-[11px] font-bold leading-tight mb-3">
            Saat aktif, hasil foto langsung otomatis dicetak ke printer default setelah sesi selesai.
          </p>

          {/* Paper Size / Layout */}
          <div className="pt-2 border-t border-[#E8CEC9] flex items-center justify-between">
            <span className="text-[11px] font-black uppercase text-[#4B3F3D]">
              Format Kertas
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                data-interactive="true"
                onClick={() => onChangePrintLayout('single-2x6')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  printLayout === 'single-2x6' ? 'btn-select-active' : 'btn-select-inactive'
                }`}
              >
                1 Strip (2x6")
              </button>
              <button
                type="button"
                data-interactive="true"
                onClick={() => onChangePrintLayout('double-4x6')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all ${
                  printLayout === 'double-4x6' ? 'btn-select-active' : 'btn-select-inactive'
                }`}
              >
                2 Strip (4x6" / 4R)
              </button>
            </div>
          </div>
        </div>

        {/* Confirm / Continue Button */}
        <button
          data-interactive="true"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="w-full h-14 btn-duo-primary text-base md:text-lg flex items-center justify-center gap-2 active:scale-98"
        >
          <span>SIMPAN & TERAPKAN</span>
        </button>
      </div>
    </div>
  );
};
