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
  PartyPopper,
  Edit3,
  Save
} from 'lucide-react';
import { Event, EventType, AppUser } from '../../types';
import { api } from '../utils/apiBridge';

interface EventsModalProps {
  events: Event[];
  activeEvent: Event | null;
  currentUser?: AppUser | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelectEvent: (event: Event) => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({
  events,
  activeEvent,
  currentUser,
  onClose,
  onRefresh,
  onSelectEvent,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(events.length === 0);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00 مساءً');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [capacity, setCapacity] = useState('100');

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editEventType, setEditEventType] = useState<EventType>('wedding');
  const [editCapacity, setEditCapacity] = useState('100');

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
        company_id: currentUser?.role === 'SUPER_ADMIN' ? null : currentUser?.company_id,
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

  const handleStartEdit = (ev: Event) => {
    setEditingEvent(ev);
    setShowCreateForm(false);
    setEditName(ev.name);
    setEditDate(ev.date || '');
    setEditTime(ev.time || '');
    setEditVenue(ev.venue || '');
    setEditEventType((ev.eventType as EventType) || 'wedding');
    setEditCapacity(String(ev.capacity || 100));
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!editName.trim()) {
      setError('يرجى كتابة اسم المناسبة');
      return;
    }
    const capNum = parseInt(editCapacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError('يرجى تحديد سعة صحيحة');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateEvent(editingEvent.id, {
        name: editName.trim(),
        date: editDate,
        time: editTime.trim() || undefined,
        venue: editVenue.trim() || undefined,
        eventType: editEventType,
        capacity: capNum,
      });

      if (activeEvent?.id === editingEvent.id) {
        onSelectEvent({
          ...activeEvent,
          ...updated,
          name: editName.trim(),
          date: editDate,
          time: editTime.trim() || undefined,
          venue: editVenue.trim() || undefined,
          eventType: editEventType,
          capacity: capNum,
        });
      }

      setEditingEvent(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث بيانات المناسبة');
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
            <p className="text-xs text-slate-400">اختر مناسبة نشطة، أو عدّل اسمها وتفاصيلها، أو أضف مناسبة جديدة</p>
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

          {/* EDIT EVENT FORM */}
          {editingEvent && (
            <form onSubmit={handleUpdate} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/50 shadow-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  تعديل اسم وبيانات المناسبة:
                </span>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  إلغاء
                </button>
              </div>

              {/* Event Type Grid */}
              <div>
                <label className="block text-xs text-slate-300 mb-1.5">نوع المناسبة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {eventTypeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSel = editEventType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEditEventType(opt.id)}
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
                <label className="block text-xs text-slate-300 mb-1">اسم المناسبة الجديد *</label>
                <input
                  type="text"
                  placeholder="مثال: حفل زفاف أحمد سالم"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">موقع القاعة / المكان</label>
                <input
                  type="text"
                  placeholder="مثال: قاعة الاحتفالات الكبرى"
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الوقت</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">السعة (الدعوات)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Toggle Create Button */}
          {!showCreateForm && !editingEvent ? (
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingEvent(null);
              }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(ev);
                        }}
                        title="تعديل اسم وبيانات المناسبة"
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
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
