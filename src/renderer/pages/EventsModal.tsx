import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Users, 
  Sparkles, 
  MapPin, 
  Clock, 
  GraduationCap, 
  Heart, 
  Utensils, 
  PartyPopper 
} from 'lucide-react';
import { Event, EventType } from '../../types';
import { api } from '../utils/apiBridge';

interface EventsModalProps {
  events: Event[];
  activeEvent: Event | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelectEvent: (event: Event) => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({
  events,
  activeEvent,
  onClose,
  onRefresh,
  onSelectEvent,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(events.length === 0);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00 مساءً');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [capacity, setCapacity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventTypeOptions: Array<{ id: EventType; label: string; icon: any; defaultName: string }> = [
    { id: 'wedding', label: 'حفل زفاف', icon: Heart, defaultName: 'حفل زفاف محمد وأحمد' },
    { id: 'graduation', label: 'حفل تخرج', icon: GraduationCap, defaultName: 'حفل تخرج كلية التقنية' },
    { id: 'dinner', label: 'دعوة عشاء / غداء', icon: Utensils, defaultName: 'مأدبة عشاء تكريمية' },
    { id: 'celebration', label: 'احتفال وفعالية', icon: PartyPopper, defaultName: 'احتفال وافتتاح رسمي' },
  ];

  const handleSelectEventType = (type: EventType) => {
    setEventType(type);
    if (!name.trim()) {
      const opt = eventTypeOptions.find((o) => o.id === type);
      if (opt) setName(opt.defaultName);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسم المناسبة');
      return;
    }
    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError('يرجى تحديد سعة صحيحة');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newEvent = await api.createEvent({
        name: name.trim(),
        date,
        time: time.trim() || undefined,
        venue: venue.trim() || undefined,
        eventType,
        capacity: capNum,
      });
      setName('');
      setVenue('');
      setShowCreateForm(false);
      onRefresh();
      onSelectEvent(newEvent);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء المناسبة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المناسبة وكافة دعواتها وسجلاتها؟')) {
      await api.deleteEvent(id);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <span>إدارة المناسبات والفعاليات</span>
            </h2>
            <p className="text-xs text-slate-400">اختر مناسبة نشطة أو أضف مناسبة جديدة مع تفاصيل القاعة والوقت</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Toggle Create Button */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مناسبة جديدة</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  بيانات المناسبة الجديدة
                </span>
                {events.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              {/* Event Type Grid */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">نوع المناسبة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {eventTypeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSel = eventType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectEventType(opt.id)}
                        className={`p-2 rounded-xl border text-center text-xs flex flex-col items-center gap-1 transition-all ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم المناسبة / الجهة *</label>
                <input
                  type="text"
                  placeholder="مثال: حفل تخرج كلية تقنية معلومات ومحاسبة"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">موقع القاعة / المكان (يظهر في الكرت)</label>
                <input
                  type="text"
                  placeholder="مثال: قاعة الاحتفالات الكبرى في الجامعة"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">تاريخ المناسبة</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الوقت</label>
                  <input
                    type="text"
                    placeholder="7:00 مساءً"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">السعة (الدعوات)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'جاري الحفظ...' : 'حفظ وإنشاء المناسبة'}</span>
              </button>
            </form>
          )}

          {/* Events List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400">قائمة المناسبات المحفوظة:</h3>
            {events.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                لا توجد مناسبات مسجلة بعد. أنشئ مناسبتك الأولى أعلاه!
              </div>
            ) : (
              events.map((ev) => {
                const isSelected = activeEvent?.id === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      onSelectEvent(ev);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {ev.eventType === 'graduation' ? (
                          <GraduationCap className="w-4 h-4" />
                        ) : ev.eventType === 'dinner' ? (
                          <Utensils className="w-4 h-4" />
                        ) : ev.eventType === 'celebration' ? (
                          <PartyPopper className="w-4 h-4" />
                        ) : (
                          <Heart className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white">{ev.name}</h4>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> النشطة
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2.5 mt-1">
                          {ev.venue && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              {ev.venue}
                            </span>
                          )}
                          <span>•</span>
                          <span>التاريخ: {ev.date}</span>
                          {ev.time && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                {ev.time}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-400" />
                            {ev.capacity} شخص
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(ev.id, e)}
                        title="حذف المناسبة"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
