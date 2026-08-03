import { useState, useEffect } from 'react';
import { CheckCircle2, FileEdit, Clock, AlertTriangle, Loader2, LogIn, LogOut, Send, FileText, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getActivityLogs, ActivityLog } from '../utils/activityStore';

interface UnifiedActivity {
  id: string;
  timestamp: string;
  icon: any;
  bgColor: string;
  iconColor: string;
  title: string;
  time: string;
  dateStr: string;
}

export function ActivityFeed() {
  const [allActivities, setAllActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const logs: ActivityLog[] = await getActivityLogs();
        const unified: UnifiedActivity[] = [];

        logs.forEach(log => {
          const dateObj = new Date(log.timestamp);
          const formattedTime = format(dateObj, "d MMMM yyyy 'pukul' HH.mm", { locale: localeId }) + " WITA";
          
          let dateStr = "";
          try {
             // In local timezone, getting YYYY-MM-DD
             const yyyy = dateObj.getFullYear();
             const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
             const dd = String(dateObj.getDate()).padStart(2, '0');
             dateStr = `${yyyy}-${mm}-${dd}`;
          } catch (e) {}
          
          let icon = Clock;
          let bgColor = 'bg-slate-100';
          let iconColor = 'text-slate-700';

          if (log.type === 'login') {
            icon = LogIn;
            bgColor = 'bg-indigo-100';
            iconColor = 'text-indigo-700';
          } else if (log.type === 'logout') {
            icon = LogOut;
            bgColor = 'bg-slate-100';
            iconColor = 'text-slate-600';
          } else if (log.type === 'pengajuan_sppd') {
            icon = Send;
            bgColor = 'bg-[#cde7f0]';
            iconColor = 'text-[#003344]';
          } else if (log.type === 'status_sppd') {
            if (log.title.toLowerCase().includes('ditolak')) {
              icon = AlertTriangle;
              bgColor = 'bg-[#ffdad6]';
              iconColor = 'text-[#ba1a1a]';
            } else if (log.title.toLowerCase().includes('disetujui')) {
              icon = CheckCircle2;
              bgColor = 'bg-green-100';
              iconColor = 'text-green-700';
            } else {
              icon = Clock;
              bgColor = 'bg-[#ffddbb]';
              iconColor = 'text-[#5f3800]';
            }
          } else if (log.type === 'pembuatan_spj') {
            icon = FileText;
            bgColor = 'bg-purple-100';
            iconColor = 'text-purple-700';
          } else if (log.type === 'status_spj') {
            if (log.title.toLowerCase().includes('perbaikan') || log.title.toLowerCase().includes('ditolak')) {
              icon = AlertTriangle;
              bgColor = 'bg-[#ffdad6]';
              iconColor = 'text-[#ba1a1a]';
            } else if (log.title.toLowerCase().includes('selesai') || log.title.toLowerCase().includes('dibayar')) {
              icon = CheckCircle2;
              bgColor = 'bg-green-100';
              iconColor = 'text-green-700';
            } else {
              icon = FileEdit;
              bgColor = 'bg-amber-100';
              iconColor = 'text-amber-700';
            }
          }

          unified.push({
            id: log.id,
            timestamp: log.timestamp,
            icon,
            bgColor,
            iconColor,
            title: log.title,
            time: `${formattedTime} • ${log.description || log.user.nama}`,
            dateStr
          });
        });

        setAllActivities(unified.length > 0 ? unified : FALLBACK);
      } catch (err) {
        setAllActivities(FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Auto-refresh every minute to update timeAgo
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  const activities = allActivities.slice(0, 5);
  const filteredActivities = selectedDate 
    ? allActivities.filter(a => a.dateStr === selectedDate) 
    : allActivities;

  return (
    <>
      <section className="bg-white p-6 rounded-xl border border-slate-200/10 shadow-sm">
        <h3 className="text-sm font-black text-[#191c1e] uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00475e]"></span>
          Log Aktivitas Terbaru
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-[#4c616d]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Memuat aktivitas...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`w-8 h-8 rounded-full ${activity.bgColor} ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#191c1e] leading-snug">{activity.title}</p>
                  <p className="text-[10px] text-[#40484d] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={() => setIsDialogOpen(true)}
          className="w-full mt-8 text-xs font-bold text-[#4c616d] hover:text-[#00475e] transition-colors py-2 border-t border-slate-200"
        >
          Lihat Semua Log
        </button>
      </section>

      {/* Dialog Lihat Semua Log */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-[#00475e]">Semua Log Aktivitas</h3>
                <p className="text-sm text-slate-500 mt-1">Histori aktivitas sistem secara lengkap</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-5 h-5 text-slate-400" />
                <label className="text-sm font-semibold text-slate-600">Filter Tanggal:</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#00475e]/20 outline-none flex-1 sm:flex-none"
                />
              </div>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate("")} 
                  className="text-sm text-[#00475e] hover:underline font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full ${activity.bgColor} ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e] leading-snug">{activity.title}</p>
                      <p className="text-[12px] text-[#40484d] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-medium">Tidak ada aktivitas pada tanggal tersebut.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const FALLBACK: UnifiedActivity[] = [
  { id: '1', timestamp: new Date().toISOString(), icon: CheckCircle2, bgColor: 'bg-green-100', iconColor: 'text-green-700',
    title: 'Pengajuan SPPD Disetujui', time: 'Belum ada data terbaru', dateStr: new Date().toISOString().split('T')[0] },
  { id: '2', timestamp: new Date().toISOString(), icon: FileEdit, bgColor: 'bg-[#cde7f0]', iconColor: 'text-[#003344]',
    title: 'Buat pengajuan untuk melihat aktivitas', time: 'Halaman Pengajuan', dateStr: new Date().toISOString().split('T')[0] },
];
