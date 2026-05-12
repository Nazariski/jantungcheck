import React, { useState, useEffect } from "react";
import { 
  Users, 
  Stethoscope, 
  Activity, 
  FileText, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const StatCard = ({ icon: Icon, label, value, color, trend, trendValue }: { icon: any, label: string, value: string | number, color: string, trend: "up" | "down", trendValue: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend === "up" ? "text-emerald-500" : "text-rose-500"}`}>
        {trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
    <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
  </div>
);

const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalSymptoms: 0,
    totalRules: 0,
    totalDiagnoses: 0
  });
  const [diagnoses, setDiagnoses] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    
    fetch("/api/stats", { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setStats(data))
      .catch(err => console.error("Error fetching stats:", err));

    fetch("/api/diagnoses", { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setDiagnoses(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Error fetching diagnoses:", err);
        setDiagnoses([]);
      });
  }, [token]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ringkasan Dashboard</h2>
          <p className="text-slate-400 text-sm font-medium">Selamat datang kembali, {user?.name}.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/heart-check")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95"
          >
            <Stethoscope size={18} />
            Mulai Diagnosa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Pasien" 
          value={stats.totalPatients} 
          color="bg-blue-500" 
          trend="up" 
          trendValue="+12%" 
        />
        <StatCard 
          icon={Stethoscope} 
          label="Total Gejala" 
          value={stats.totalSymptoms} 
          color="bg-purple-500" 
          trend="up" 
          trendValue="+5%" 
        />
        <StatCard 
          icon={Activity} 
          label="Total Aturan" 
          value={stats.totalRules} 
          color="bg-amber-500" 
          trend="down" 
          trendValue="-2%" 
        />
        <StatCard 
          icon={FileText} 
          label="Total Diagnosa" 
          value={stats.totalDiagnoses} 
          color="bg-emerald-500" 
          trend="up" 
          trendValue="+18%" 
        />
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-8">Diagnosa Terbaru</h3>
        <div className="flex flex-col gap-4">
          {diagnoses.length > 0 ? (
            diagnoses.slice(0, 8).map((d, i) => (
              <div key={i} className="flex items-center gap-6 group cursor-pointer p-5 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                  <Activity size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-slate-800">{d.patientName}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{d.result}</p>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock size={10} />
                      {d.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-5">
                    <p className="text-xl font-black text-blue-600">{(d.score * 100).toFixed(0)}%</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/reports?patient=${d.patientName}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105"
                    >
                      <Eye size={14} />
                      Lihat
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 font-medium">Belum ada data diagnosa terbaru.</div>
          )}
        </div>
        
        {diagnoses.length > 8 && (
          <button className="w-full mt-10 py-4 text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-[20px] transition-all border border-dashed border-slate-200 hover:border-blue-200">
            Lihat Semua Diagnosa (${diagnoses.length})
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
