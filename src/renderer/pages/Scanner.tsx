import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Keyboard, 
  RefreshCw, 
  Volume2, 
  User, 
  Clock, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import confetti from 'canvas-confetti';
import { Event, CheckInResult } from '../../types';
import { api } from '../utils/apiBridge';
import { sounds } from '../utils/sound';

interface ScannerProps {
  activeEvent: Event | null;
  onCheckInSuccess?: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ activeEvent, onCheckInSuccess }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual token input state
  const [manualToken, setManualToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Check-in feedback state
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Load available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Could not enumerate video devices', err);
      }
    }
    getDevices();
  }, []);

  // Start or Stop QR Scanner
  useEffect(() => {
    if (!activeEvent || !selectedDeviceId || !videoRef.current) return;

    let reader: BrowserMultiFormatReader | null = new BrowserMultiFormatReader();
    let isCancelled = false;

    async function startScanning() {
      try {
        setCameraError(null);
        setIsCameraActive(true);

        const controls = await reader!.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, error) => {
            if (result && !isProcessing && !isCancelled) {
              const text = result.getText();
              handleVerifyToken(text);
            }
          }
        );

        if (isCancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Camera scan start error:', err);
          setCameraError('تعذر فتح الكاميرا المحددة. يرجى التأكد من توصيلها ومنح الصلاحية.');
          setIsCameraActive(false);
        }
      }
    }

    startScanning();

    return () => {
      isCancelled = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      reader = null;
    };
  }, [selectedDeviceId, activeEvent]);

  // Support for USB / Wireless Handheld Barcode Scanner Guns
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is deliberately typing in another text field
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && target.id !== 'scanner-manual-input') {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const token = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = '';
        if (token.length >= 3) {
          e.preventDefault();
          handleVerifyToken(token);
        }
      } else if (e.key.length === 1) {
        // Barcode scanners send rapid keystrokes (< 60ms between characters)
        // If slow typing (e.g. pause > 200ms), start fresh buffer
        if (diff > 200) {
          barcodeBufferRef.current = '';
        }
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEvent, isProcessing]);

  // Execute verification
  const handleVerifyToken = async (token: string) => {
    if (!activeEvent || isProcessing || !token.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.checkIn(token.trim(), activeEvent.id, 'كاميرا البوابة الرئيسية');
      setLastResult(res);
      setShowFeedback(true);

      if (res.result === 'ACCEPTED') {
        sounds.playSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
        if (onCheckInSuccess) onCheckInSuccess();
      } else {
        sounds.playError();
      }

      // Auto dismiss after 2.8 seconds and get ready for next scan
      setTimeout(() => {
        setShowFeedback(false);
        setIsProcessing(false);
      }, 2800);
    } catch (err) {
      console.error('CheckIn error:', err);
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleVerifyToken(manualToken.trim());
      setManualToken('');
    }
  };

  if (!activeEvent) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        يرجى اختيار مناسبة أولاً لتشغيل قارئ الـ QR.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>ماسح التحقق وتأكيد الدخول المباشر</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            المناسبة: <span className="text-amber-400 font-bold">{activeEvent.name}</span>
          </p>
        </div>

        {/* Camera Selector Dropdown */}
        {videoDevices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">الكاميرا:</span>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `كاميرا ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Scanner Container */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-video max-h-[500px] flex items-center justify-center shadow-2xl">
        
        {/* Video stream */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Scanner Target Guide overlay */}
        {!showFeedback && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64 border-2 border-amber-400/80 rounded-3xl overflow-hidden shadow-2xl backdrop-contrast-125">
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-300 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-300 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-300 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-300 rounded-br-xl" />

              {/* Animated laser scan line */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent scanner-laser shadow-lg shadow-amber-400/50" />
            </div>

            <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-amber-300 text-xs font-semibold backdrop-blur-md">
              وجّه الكاميرا إلى رمز الـ QR لتأكيد الدخول
            </div>
          </div>
        )}

        {/* Camera Error or No Cam Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-white mb-2">{cameraError}</p>
            <p className="text-xs text-slate-400 mb-4">يمكنك استخدام حقل الإدخال اليدوي بالأسفل للتحقق.</p>
          </div>
        )}

        {/* FEEDBACK OVERLAY (ACCEPTED / ALREADY_USED / INVALID) */}
        {showFeedback && lastResult && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 ${
              lastResult.result === 'ACCEPTED'
                ? 'bg-emerald-950/95 border-4 border-emerald-500 text-emerald-100'
                : lastResult.result === 'ALREADY_USED'
                ? 'bg-rose-950/95 border-4 border-rose-500 text-rose-100'
                : 'bg-amber-950/95 border-4 border-amber-500 text-amber-100'
            }`}
          >
            {/* Status Icon */}
            {lastResult.result === 'ACCEPTED' ? (
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 mb-4 animate-bounce">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>
            ) : lastResult.result === 'ALREADY_USED' ? (
              <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 mb-4 animate-pulse">
                <ShieldAlert className="w-12 h-12 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 mb-4">
                <XCircle className="w-12 h-12 stroke-[2.5]" />
              </div>
            )}

            {/* Main Result Headline */}
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
              {lastResult.result === 'ACCEPTED' && 'تم قبول الدخول! أهلاً وسهلاً'}
              {lastResult.result === 'ALREADY_USED' && 'تم استخدام هذه الدعوة مسبقاً!'}
              {lastResult.result === 'INVALID' && 'دعوة غير صالحة!'}
              {lastResult.result === 'WRONG_EVENT' && 'هذه الدعوة تتبع مناسبة أخرى!'}
            </h1>

            {/* Details Box */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 max-w-sm w-full space-y-2 text-right mt-2">
              
              {/* Guest Name */}
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-slate-300">اسم المدعو:</span>
                <span className="font-bold text-sm text-white">
                  {lastResult.guestName || 'غير محدد (بدون اسم)'}
                </span>
              </div>

              {/* Invitation Number */}
              {lastResult.invitationNumber && (
                <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                  <span className="text-slate-300">رقم الدعوة:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    #{String(lastResult.invitationNumber).padStart(3, '0')}
                  </span>
                </div>
              )}

              {/* Previous Used Time (If duplicate) */}
              {lastResult.result === 'ALREADY_USED' && lastResult.previousUsedAt && (
                <div className="flex items-center justify-between text-xs text-rose-300 pt-1">
                  <span>وقت الدخول السابق:</span>
                  <span className="font-mono font-bold">
                    {new Date(lastResult.previousUsedAt).toLocaleTimeString('ar-SA')}
                  </span>
                </div>
              )}

              {/* Current Time (If accepted) */}
              {lastResult.result === 'ACCEPTED' && (
                <div className="flex items-center justify-between text-xs text-emerald-300 pt-1">
                  <span>وقت تسجيل الدخول:</span>
                  <span className="font-mono font-bold">
                    {new Date().toLocaleTimeString('ar-SA')}
                  </span>
                </div>
              )}

            </div>

            <div className="mt-4 text-[11px] text-slate-300 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>جاهز للمسح التالي تلقائياً...</span>
            </div>

          </div>
        )}

      </div>

      {/* Manual & Barcode Scanner Input Fallback Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            جاهز للاستقبال من قارئ الباركود اللاسلكي / السلكي (Barcode Gun) أو الإدخال اليدوي
          </span>
          <span className="text-[11px] text-amber-400/90 font-medium">مسح الباركود سيعمل فوراً وتلقائياً</span>
        </div>
        <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Keyboard className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="scanner-manual-input"
              type="text"
              placeholder="وجّه قارئ الباركود أو اكتب الرمز هنا..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !manualToken.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all shrink-0"
          >
            تأكيد الدخول يدويًا
          </button>
        </form>
      </div>

    </div>
  );
};
