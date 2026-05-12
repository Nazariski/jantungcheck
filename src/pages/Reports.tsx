import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  X,
  Trash2
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const Reports = () => {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientFilter = searchParams.get("patient");
  
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(patientFilter || "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Advanced Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedResult, setSelectedResult] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/diagnoses", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setDiagnoses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setDiagnoses([]);
        setLoading(false);
      });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data diagnosa ini?")) return;

    fetch(`/api/diagnoses/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          toast.success("Data diagnosa berhasil dihapus");
          fetchData();
        } else {
          toast.error("Gagal menghapus data");
        }
      })
      .catch(() => toast.error("Terjadi kesalahan"));
  };

  const handlePrint = (diagnosis: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hasil Diagnosa - ${diagnosis.patientName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
            .subtitle { color: #64748b; font-size: 14px; }
            .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; margin-bottom: 30px; }
            .label { font-weight: bold; color: #64748b; }
            .result-card { background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
            .result-title { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
            .score { font-size: 32px; font-weight: bold; color: #10b981; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .solution { background: #eff6ff; padding: 20px; border-radius: 8px; font-size: 14px; line-height: 1.6; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">SISTEM PAKAR JANTUNG</h1>
            <p class="subtitle">Laporan Hasil Diagnosa Pasien</p>
          </div>
          
          <div class="info-grid">
            <div class="label">Nama Pasien:</div>
            <div>${diagnosis.patientName}</div>
            <div class="label">Tanggal:</div>
            <div>${diagnosis.date}</div>
            <div class="label">ID Diagnosa:</div>
            <div>#${diagnosis.id}</div>
          </div>

          <div className="result-card">
            <div className="result-title">Hasil Diagnosa Hibrida</div>
            
            <div style="background: #3b82f6; padding: 25px; border-radius: 15px; text-align: center; color: white; margin-bottom: 15px;">
              <div style="font-size: 10px; font-weight: bold; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px;">Hybrid Score (Total)</div>
              <div style="font-size: 42px; font-weight: 900; margin: 5px 0;">${(diagnosis.score * 100).toFixed(1)}%</div>
              <div style="font-size: 14px; font-weight: 600;">Penyakit: ${diagnosis.result}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Fuzzy Mamdani</div>
                <div style="font-size: 24px; font-weight: 800; color: #1e293b;">${(diagnosis.fuzzyScore || 0).toFixed(1)}</div>
                <div style="font-size: 9px; color: #94a3b8;">Tingkat Keparahan</div>
              </div>
              <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Certainty Factor</div>
                <div style="font-size: 24px; font-weight: 800; color: #1e293b;">${(diagnosis.cfScore || 0).toFixed(2)}</div>
                <div style="font-size: 9px; color: #94a3b8;">Tingkat Kepercayaan</div>
              </div>
            </div>
          </div>

          <div class="section-title">Anjuran Penanganan / Solusi:</div>
          <div class="solution">
            ${diagnosis.solution || "Tidak ada data solusi."}
          </div>

          <div style="margin-top: 50px; text-align: right;">
            <p>Dicetak pada: ${new Date().toLocaleString()}</p>
            <div style="margin-top: 60px;">
              <div style="border-top: 1px solid #000; display: inline-block; width: 200px;">
                Tanda Tangan Petugas
              </div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Seluruh Diagnosa</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
            th { background: #f8fafc; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SISTEM PAKAR JANTUNG</h1>
            <p>Laporan Rekapitulasi Diagnosa Pasien</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Pasien</th>
                <th>Hasil Diagnosa</th>
                <th>Skor CF</th>
              </tr>
            </thead>
            <tbody>
              ${filteredDiagnoses.map((d, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${d.date}</td>
                  <td>${d.patientName}</td>
                  <td>${d.result}</td>
                  <td>${(d.score * 100).toFixed(2)}%</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Total Data: ${filteredDiagnoses.length}</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredDiagnoses.map((d, i) => ({
        "No": i + 1,
        "Tanggal": d.date,
        "Nama Pasien": d.patientName,
        "Hasil Diagnosa": d.result,
        "Skor CF (%)": (d.score * 100).toFixed(2),
        "Solusi": d.solution || "-"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Diagnosa");
      XLSX.writeFile(workbook, `laporan_diagnosa_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Laporan berhasil diunduh sebagai Excel");
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Gagal mengekspor data ke Excel");
    }
  };

  const uniqueResults = ["All", ...new Set(diagnoses.map(d => d.result))];

  const filteredDiagnoses = diagnoses.filter(d => {
    const matchesSearch = d.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = selectedResult === "All" || d.result === selectedResult;
    const matchesDate = (!startDate || d.date >= startDate) && (!endDate || d.date <= endDate);
    const matchesScore = (d.score * 100) >= minScore && (d.score * 100) <= maxScore;
    
    return matchesSearch && matchesResult && matchesDate && matchesScore;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Diagnosa</h2>
          <p className="text-slate-400 text-sm font-medium">Rekapitulasi hasil diagnosa pasien.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer size={20} />
            Cetak Laporan
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
          >
            <Download size={20} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari nama pasien..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  showFilters ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                )}
              >
                <Filter size={18} />
                Filter {showFilters ? "Aktif" : ""}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Rentang Tanggal</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <span className="text-slate-300">-</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Hasil Diagnosa</label>
                <select 
                  value={selectedResult}
                  onChange={(e) => setSelectedResult(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                >
                  {uniqueResults.map(res => (
                    <option key={res} value={res}>{res}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Minimal Skor (%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0%</span>
                  <span className="text-blue-600">{minScore}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Maksimal Skor (%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={maxScore}
                  onChange={(e) => setMaxScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0%</span>
                  <span className="text-blue-600">{maxScore}%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button 
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedResult("All");
                    setMinScore(0);
                    setMaxScore(100);
                    setSearchTerm("");
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">No</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Pasien</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hasil Diagnosa</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skor (CF)</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">Memuat data...</td>
                </tr>
              ) : filteredDiagnoses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data diagnosa yang sesuai filter.</td>
                </tr>
              ) : (
                filteredDiagnoses.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-slate-400">{i + 1}</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{d.date}</td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-800">{d.patientName}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">{d.result}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-emerald-600">{(d.score * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedDiagnosis(d);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        {user?.role === "Admin" && (
                          <button 
                            onClick={() => handleDelete(d.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedDiagnosis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Detail Hasil Diagnosa</h3>
                  <p className="text-slate-400 text-sm font-medium">Laporan ID: #${selectedDiagnosis.id}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pasien</label>
                    <p className="text-slate-800 font-bold">{selectedDiagnosis.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</label>
                    <p className="text-slate-800 font-bold">{selectedDiagnosis.date}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Highlighted Hybrid Score at Top */}
                  <div className="p-8 bg-blue-600 rounded-3xl shadow-xl shadow-blue-100 text-center text-white">
                    <label className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-2">Hybrid (Total) Score</label>
                    <p className="text-5xl font-black">{(selectedDiagnosis.score * 100).toFixed(1)}%</p>
                    <p className="text-xs text-blue-100/70 mt-3 font-medium">Gabungan Fuzzy Mamdani & CF</p>
                  </div>

                  {/* Secondary Scores Below Side-by-Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fuzzy Mamdani</label>
                      <p className="text-xl font-black text-slate-700">{(selectedDiagnosis.fuzzyScore || 0).toFixed(1)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Certainty Factor</label>
                      <p className="text-xl font-black text-slate-700">{(selectedDiagnosis.cfScore || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kesimpulan Diagnosa</label>
                    <p className="text-blue-600 font-extrabold text-xl">{selectedDiagnosis.result}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saran / Penanganan</label>
                  <div className="p-6 bg-blue-50/50 text-blue-800 rounded-3xl border border-blue-100/50 leading-relaxed text-sm font-medium">
                    {selectedDiagnosis.solution || "Tidak ada informasi penanganan khusus."}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                <button 
                  onClick={() => handlePrint(selectedDiagnosis)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all"
                >
                  <Printer size={20} />
                  Cetak Hasil
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Tutup Laporan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
