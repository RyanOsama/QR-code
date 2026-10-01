import React, { useState, useEffect, useId } from 'react';
import {
  Sparkles,
  Check,
  X,
  Layers,
  ArrowLeftRight,
  Maximize2,
  Info,
  Sliders,
  Palette,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  ImageOutpaintingService,
  OutpaintMethod,
  OutpaintComparison,
  OutpaintResult,
} from '../../services/imageOutpaintingService';

interface BackImageOutpaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  frontImage: string;
  backImage: string;
  onApply: (processedBackImage: string, result: OutpaintResult) => void;
}

export const BackImageOutpaintModal: React.FC<BackImageOutpaintModalProps> = ({
  isOpen,
  onClose,
  frontImage,
  backImage,
  onApply,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<OutpaintMethod>('smart_ai');
  const [viewMode, setViewMode] = useState<'side_by_side' | 'before_after'>('side_by_side');
  const [comparison, setComparison] = useState<OutpaintComparison | null>(null);
  const [processedResult, setProcessedResult] = useState<OutpaintResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showExtensionZones, setShowExtensionZones] = useState<boolean>(true);

  // Auto calculate and process on open or method change
  useEffect(() => {
    if (!isOpen || !frontImage || !backImage) return;

    let isMounted = true;
    setIsProcessing(true);

    ImageOutpaintingService.processAndMatchBackImage(frontImage, backImage, selectedMethod)
      .then((res) => {
        if (!isMounted) return;
        setProcessedResult(res);
        setComparison(res.comparison);
      })
      .catch((err) => {
        console.error('Error during outpainting processing:', err);
      })
      .finally(() => {
        if (isMounted) setIsProcessing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, frontImage, backImage, selectedMethod]);

  if (!isOpen || !comparison) return null;

  const handleConfirm = () => {
    if (processedResult) {
      onApply(processedResult.dataUrl, processedResult);
    } else {
      onClose();
    }
  };

  const methodsList: { id: OutpaintMethod; name: string; desc: string; icon: any }[] = [
    {
      id: 'smart_ai',
      name: 'تمديد ذكي متكيف (Smart AI)',
      desc: 'تحليل دقيق لألوان وحواف الكرت مع دمج التدرجات وانعكاس ناعم وخلفية متناسقة 100%',
      icon: Sparkles,
    },
    {
      id: 'seamless_mirror',
      name: 'انعكاس وتدرج ناعم (Mirror Blend)',
      desc: 'تكرار وانعكاس ناعم لأطراف الخلفية مع تلاشي انسيابي خفي',
      icon: ArrowLeftRight,
    },
    {
      id: 'edge_gradient',
      name: 'تدرج لوني محيطي (Edge Gradient)',
      desc: 'تعبئة المساحات الممتدة بتدرج لوني مستخرج من زوايا وأطراف البطاقة',
      icon: Palette,
    },
    {
      id: 'solid_dominant',
      name: 'لون الحواف الموحد (Solid Edge)',
      desc: 'تعبئة بلون الخلفية الأساسي للحواف مع دمج ناعم',
      icon: Sliders,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>تعديل ومطابقة أبعاد الوجهين بالذكاء الاصطناعي</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI Smart Outpainting
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                جعل مقاس الوجه الأمامي (Front) مرجعاً أساسياً وتمديد خلفية الوجه الخلفي (Back) فقط دون تشويه المحتوى الأصلي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Dimension Comparison Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Front reference */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  الوجه الأمامي (المرجع الأساسي)
                </span>
                <span className="text-[10px] text-amber-400/80 font-mono">Front Master</span>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {comparison.front.width} × {comparison.front.height} <span className="text-xs font-normal text-slate-400">بكسل</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                نسبة الأبعاد:{' '}
                <span className="font-mono text-amber-300 font-bold">
                  {comparison.front.aspectRatio.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Back original */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  الوجه الخلفي (الأصلي)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Original Back</span>
              </div>
              <div className="text-base font-mono font-bold text-slate-300">
                {comparison.backOriginal.width} × {comparison.backOriginal.height} <span className="text-xs font-normal text-slate-400">بكسل</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                نسبة الأبعاد:{' '}
                <span className="font-mono text-slate-300 font-bold">
                  {comparison.backOriginal.aspectRatio.toFixed(3)}
                </span>
                {comparison.aspectRatioDiffPercent > 0 && (
                  <span className="text-rose-400 mr-2 text-[10px]">
                    (فارق {comparison.aspectRatioDiffPercent}%)
                  </span>
                )}
              </div>
            </div>

            {/* Back processed target */}
            <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  الوجه الخلفي (بعد المعالجة)
                </span>
                <span className="text-[10px] text-teal-300 font-mono">Matched Back</span>
              </div>
              <div className="text-base font-mono font-bold text-teal-200">
                {comparison.backProcessed.width} × {comparison.backProcessed.height} <span className="text-xs font-normal text-teal-400/80">بكسل</span>
              </div>
              <div className="text-[11px] text-teal-300/80 mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>تطابق تام بنسبة 100% مع الوجه الأمامي</span>
              </div>
            </div>
          </div>

          {/* Extension Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              {comparison.extensionAxis === 'horizontal' ? (
                <span>
                  تم تمديد خلفية الوجه الخلفي <strong>أفقياً (يمين ويسار)</strong> بمقدار{' '}
                  <span className="font-mono text-teal-300">{comparison.padLeft + comparison.padRight}px</span> لتتطابق تماماً مع نسبة أبعاد الوجه الأمامي مع الحفاظ على التصميم والنصوص الأصلية في المنتصف دون أي مط أو تشويه.
                </span>
              ) : comparison.extensionAxis === 'vertical' ? (
                <span>
                  تم تمديد خلفية الوجه الخلفي <strong>رأسياً (أعلى وأسفل)</strong> بمقدار{' '}
                  <span className="font-mono text-teal-300">{comparison.padTop + comparison.padBottom}px</span> لتتطابق تماماً مع نسبة أبعاد الوجه الأمامي مع الحفاظ على التصميم والنصوص الأصلية في المنتصف دون أي مط أو تشويه.
                </span>
              ) : (
                <span>
                  أبعاد الوجهين متطابقة ونسبة الأبعاد متناسقة تماماً. تمت إعادة التحجيم بدقة عالية للحفاظ على جودة الطباعة.
                </span>
              )}
            </div>
          </div>

          {/* Controls Bar: View Mode & Toggle Highlight */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('side_by_side')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'side_by_side'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>معاينة جنباً إلى جنب (Front & Back)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('before_after')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'before_after'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>مقارنة قبل وبعد (Back Before & After)</span>
              </button>
            </div>

            {/* Highlight Extension Zones Toggle */}
            <button
              type="button"
              onClick={() => setShowExtensionZones(!showExtensionZones)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                showExtensionZones
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>إظهار نطاقات التمديد الذكي</span>
            </button>
          </div>

          {/* Visual Previews Display */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800/80 min-h-[300px] flex items-center justify-center">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 text-teal-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">جاري المعالجة وتمديد الخلفية فائق الدقة...</span>
              </div>
            ) : viewMode === 'side_by_side' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Front Master Preview */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1">
                    <span>🖼️ الوجه الأمامي (المرجع)</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({comparison.front.width}×{comparison.front.height})
                    </span>
                  </span>
                  <div
                    className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl bg-black/60 max-w-full flex items-center justify-center"
                    style={{
                      aspectRatio: `${comparison.front.width} / ${comparison.front.height}`,
                      maxHeight: '260px',
                    }}
                  >
                    <img
                      src={frontImage}
                      alt="Front Face"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Back Processed Preview */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-teal-300 mb-2 flex items-center gap-1">
                    <span>✨ الوجه الخلفي (مطابق 100%)</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({comparison.backProcessed.width}×{comparison.backProcessed.height})
                    </span>
                  </span>
                  <div
                    className="relative rounded-2xl overflow-hidden border-2 border-teal-500/50 shadow-xl bg-black/60 max-w-full flex items-center justify-center"
                    style={{
                      aspectRatio: `${comparison.front.width} / ${comparison.front.height}`,
                      maxHeight: '260px',
                    }}
                  >
                    <img
                      src={processedResult ? processedResult.dataUrl : backImage}
                      alt="Back Processed Face"
                      className="w-full h-full object-contain"
                    />

                    {/* Highlight Extension overlays if enabled */}
                    {showExtensionZones && comparison.needsExtension && (
                      <>
                        {comparison.padLeft > 0 && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-teal-500/20 border-r border-dashed border-teal-400/80 pointer-events-none flex items-center justify-center"
                            style={{
                              width: `${(comparison.padLeft / comparison.front.width) * 100}%`,
                            }}
                          >
                            <span className="text-[9px] font-bold text-teal-300 bg-slate-950/80 px-1 py-0.5 rounded shadow">
                              تمديد
                            </span>
                          </div>
                        )}
                        {comparison.padRight > 0 && (
                          <div
                            className="absolute top-0 bottom-0 right-0 bg-teal-500/20 border-l border-dashed border-teal-400/80 pointer-events-none flex items-center justify-center"
                            style={{
                              width: `${(comparison.padRight / comparison.front.width) * 100}%`,
                            }}
                          >
                            <span className="text-[9px] font-bold text-teal-300 bg-slate-950/80 px-1 py-0.5 rounded shadow">
                              تمديد
                            </span>
                          </div>
                        )}
                        {comparison.padTop > 0 && (
                          <div
                            className="absolute top-0 left-0 right-0 bg-teal-500/20 border-b border-dashed border-teal-400/80 pointer-events-none flex items-center justify-center"
                            style={{
                              height: `${(comparison.padTop / comparison.front.height) * 100}%`,
                            }}
                          >
                            <span className="text-[9px] font-bold text-teal-300 bg-slate-950/80 px-1 py-0.5 rounded shadow">
                              تمديد
                            </span>
                          </div>
                        )}
                        {comparison.padBottom > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-teal-500/20 border-t border-dashed border-teal-400/80 pointer-events-none flex items-center justify-center"
                            style={{
                              height: `${(comparison.padBottom / comparison.front.height) * 100}%`,
                            }}
                          >
                            <span className="text-[9px] font-bold text-teal-300 bg-slate-950/80 px-1 py-0.5 rounded shadow">
                              تمديد
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Before & After Mode */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Original Back */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 mb-2">
                    الوجه الخلفي الأصلي ({comparison.backOriginal.width}×{comparison.backOriginal.height})
                  </span>
                  <div
                    className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-lg bg-black/60 max-w-full flex items-center justify-center"
                    style={{
                      aspectRatio: `${comparison.backOriginal.width} / ${comparison.backOriginal.height}`,
                      maxHeight: '260px',
                    }}
                  >
                    <img src={backImage} alt="Back Original" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Processed Back */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-teal-300 mb-2">
                    الوجه الخلفي بعد التمديد الذكي ({comparison.backProcessed.width}×{comparison.backProcessed.height})
                  </span>
                  <div
                    className="relative rounded-2xl overflow-hidden border-2 border-teal-500/50 shadow-xl bg-black/60 max-w-full flex items-center justify-center"
                    style={{
                      aspectRatio: `${comparison.front.width} / ${comparison.front.height}`,
                      maxHeight: '260px',
                    }}
                  >
                    <img
                      src={processedResult ? processedResult.dataUrl : backImage}
                      alt="Back Processed"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Outpaint Algorithm Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>خوارزمية التمديد الذكي المفضلة:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {methodsList.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500/60 shadow-md ring-1 ring-teal-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-teal-200' : 'text-slate-200'}`}>
                          {m.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>سيتم حفظ الصورة الناتجة بدقة عالية ومطابقة تامة لمنع أي تشويه في الـ PDF والطباعة.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
            >
              استخدام الصورة الأصلية دون تعديل
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 cursor-pointer transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>اعتماد ومطابقة أبعاد الوجه الخلفي</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
