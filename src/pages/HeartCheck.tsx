import React, { useState, useEffect } from "react";
import { 
  HeartPulse, 
  Users, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ArrowRight,
  ClipboardCheck,
  RefreshCcw,
  ShieldAlert,
  FileText
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";

const HeartCheck = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<{ id: string, intensity: string, confidence: number }[]>([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` };
    
    // Fetch patients
    fetch("/api/patients", { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("HeartCheck: Error fetching patients", err);
        setPatients([]);
        toast.error("Gagal mengambil data pasien untuk diagnosa. Silakan muat ulang.");
      });

    // Fetch symptoms
    fetch("/api/symptoms", { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then(data => setSymptoms(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("HeartCheck: Error fetching symptoms", err);
        setSymptoms([]);
        toast.error("Gagal mengambil data gejala. Silakan muat ulang.");
      });
  }, [token]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    String(p.id).includes(searchPatient)
  );

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) {
        return prev.filter(s => s.id !== id);
      } else {
        return [...prev, { id, intensity: "sedang", confidence: 5 }]; // Default to sedang and 5
      }
    });
  };

  const updateIntensity = (id: string, intensity: string) => {
    setSelectedSymptoms(prev => prev.map(s => s.id === id ? { ...s, intensity } : s));
  };

  const updateConfidence = (id: string, confidence: number) => {
    setSelectedSymptoms(prev => prev.map(s => s.id === id ? { ...s, confidence } : s));
  };

  const handleDiagnose = async () => {
    if (!selectedPatient || selectedSymptoms.length === 0) return;
    
    setIsDiagnosing(true);
    // Masukkan jeda simulasi untuk memberikan kesan sistem sedang memproses (technical feeling)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          // DATA PRE-PROCESSING:
          // Konversi nilai confidence (skala 1-10) menjadi nilai desimal (0.1 - 1.0)
          // yang akan dikalikan dengan CF Pakar di backend.
          selectedSymptoms: selectedSymptoms.map(s => ({
            ...s,
            confidence: s.confidence / 10
          }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        setDiagnosisResult(data);
        setStep(3);
        toast.success("Diagnosa berhasil diselesaikan");
      } else {
        toast.error(data.error || "Gagal melakukan diagnosa");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Diagnosis failed:", error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedSymptoms([]);
    setDiagnosisResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => navigate("/")}
        title="Batalkan Diagnosa"
        message="Apakah Anda yakin ingin membatalkan proses diagnosa ini? Data yang belum disimpan akan hilang."
        confirmText="Ya, Batalkan"
        type="warning"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Observasi & Cek Jantung</h2>
          <p className="text-slate-400 text-sm font-medium">Lakukan diagnosa penyakit jantung berdasarkan observasi gejala.</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-100" : 
                step > s ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              )}
            >
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Pilih Pasien</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama pasien..." 
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                    selectedPatient?.id === p.id 
                      ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100" 
                      : "bg-white border-slate-100 hover:border-blue-100 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold",
                    selectedPatient?.id === p.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: P-{String(p.id).padStart(3, '0')}</p>
                  </div>
                  {selectedPatient?.id === p.id && <CheckCircle2 className="ml-auto text-blue-600" size={20} />}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-end">
              <button
                disabled={!selectedPatient}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Lanjutkan
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Observasi Gejala</h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pasien Terpilih</p>
                <p className="text-sm font-bold text-blue-600">{selectedPatient.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {symptoms.map((s) => {
                const selected = selectedSymptoms.find(item => item.id === s.id);
                return (
                  <div key={s.id} className="space-y-2">
                    <button
                      onClick={() => toggleSymptom(s.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                        selected 
                          ? "bg-purple-50 border-purple-200 ring-2 ring-purple-100" 
                          : "bg-white border-slate-100 hover:border-purple-100 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                        selected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {s.id}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.type}</p>
                      </div>
                      {selected && <CheckCircle2 className="text-purple-600" size={20} />}
                    </button>
                    
                    <AnimatePresence>
                      {selected && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 px-2 overflow-hidden"
                        >
                          <div className="flex items-center gap-2">
                            {[
                              { label: "Ringan", value: "ringan" },
                              { label: "Sedang", value: "sedang" },
                              { label: "Berat", value: "berat" }
                            ].map((level) => (
                              <button
                                key={level.value}
                                onClick={() => updateIntensity(s.id, level.value)}
                                className={cn(
                                  "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all",
                                  selected.intensity === level.value 
                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm" 
                                    : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"
                                )}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Kepercayaan</span>
                              <span className="text-xs font-bold text-purple-600">{selected.confidence} / 10</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={selected.confidence}
                              onChange={(e) => updateConfidence(s.id, parseInt(e.target.value))}
                              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Kembali
              </button>
              <button
                disabled={selectedSymptoms.length === 0 || isDiagnosing}
                onClick={handleDiagnose}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isDiagnosing ? (
                  <>
                    <RefreshCcw size={18} className="animate-spin" />
                    Menganalisa...
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={18} />
                    Proses Diagnosa
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && diagnosisResult && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
              <HeartPulse size={40} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Hasil Diagnosa Selesai</h3>
              <p className="text-slate-400 font-medium">Berdasarkan observasi gejala yang diberikan.</p>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
              {/* Hybrid (Total) Score - Main Highlight */}
              <div className="w-full p-10 bg-blue-600 rounded-[2rem] border border-blue-700 shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] text-center">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-[0.2em] mb-3">Hasil Prediksi (Hybrid Score)</p>
                <p className="text-6xl font-black text-white mb-4">{(diagnosisResult.hybridResult * 100).toFixed(1)}%</p>
                <div className="w-full max-w-sm mx-auto bg-blue-400/30 h-2 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-1000" style={{ width: `${diagnosisResult.hybridResult * 100}%` }}></div>
                </div>
                <p className="text-blue-100/80 text-sm mt-4 font-medium italic">Kombinasi Meta-Heuristic Fuzzy Mamdani & Certainty Factor</p>
              </div>

              {/* Secondary Scores - Side by Side */}
              <div className="grid grid-cols-2 gap-4 w-full">
                {/* Fuzzy Mamdani Score */}
                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tingkat Keparahan (Fuzzy)</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-slate-700">{(diagnosisResult.fuzzyScore || 0).toFixed(1)}</p>
                    <span className="text-slate-400 text-xs font-bold mb-1.5">/ 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${(diagnosisResult.fuzzyScore / 100) * 100}%` }}></div>
                  </div>
                </div>
                
                {/* Certainty Factor Score */}
                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tingkat Kepercayaan (CF)</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-slate-700">{(diagnosisResult.cfScore || 0).toFixed(2)}</p>
                    <span className="text-slate-400 text-xs font-bold mb-1.5">/ 1.0</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-1000" style={{ width: `${(diagnosisResult.cfScore || 0) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {diagnosisResult.hybridResult > 0.7 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-left max-w-2xl mx-auto"
              >
                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-800">Peringatan: Resiko Tinggi Terdeteksi</p>
                  <p className="text-xs text-red-600 font-medium">Hasil diagnosa menunjukkan tingkat resiko yang signifikan. Segera lakukan konsultasi medis mendalam.</p>
                </div>
              </motion.div>
            )}

            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 inline-block w-full max-w-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kesimpulan Diagnosa</p>
              <h4 className="text-xl font-extrabold text-slate-800 mb-4">{diagnosisResult.result}</h4>
              <p className="text-sm text-slate-500 font-medium max-w-md mx-auto mb-6">
                Sistem mendeteksi adanya indikasi {diagnosisResult.result.toLowerCase()} dengan tingkat keyakinan sebesar {(diagnosisResult.hybridResult * 100).toFixed(1)}%.
              </p>
              
              {diagnosisResult.solution && (
                <div className="pt-6 border-t border-slate-200 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Solusi & Penanganan</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 italic">
                    "{diagnosisResult.solution}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span className="font-bold">{selectedPatient.name}</span>
              </div>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span className="font-bold">{selectedSymptoms.length} Gejala</span>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="px-8 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all"
              >
                Diagnosa Baru
              </button>
              <button
                onClick={() => navigate("/reports")}
                className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 hover:scale-105 transition-all"
              >
                Lihat Laporan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeartCheck;
