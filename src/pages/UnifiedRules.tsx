import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";

const UnifiedRules = () => {
  const { token, user } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [newRule, setNewRule] = useState({ 
    conditions: [{ symptomId: "", operator: "NONE", severity: "sedang" }], 
    disease: "",
    diseaseSeverity: "sedang"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<{ conditions?: string; disease?: string; general?: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

  const isAdmin = user?.role === "Admin";

  const fetchData = () => {
    if (!token) return;
    setLoading(true);
    const headers = { "Authorization": `Bearer ${token}` };
    Promise.all([
      fetch("/api/rules", { headers }).then(res => res.ok ? res.json() : []),
      fetch("/api/symptoms", { headers }).then(res => res.ok ? res.json() : []),
      fetch("/api/diseases", { headers }).then(res => res.ok ? res.json() : [])
    ]).then(([rulesData, symptomsData, diseasesData]) => {
      setRules(Array.isArray(rulesData) ? rulesData : []);
      setSymptoms(Array.isArray(symptomsData) ? symptomsData : []);
      setDiseases(Array.isArray(diseasesData) ? diseasesData : []);
      setLoading(false);
    }).catch(() => {
      setRules([]);
      setSymptoms([]);
      setDiseases([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setNewRule({ 
      conditions: rule.conditions?.map((c: any) => ({
        symptomId: c.symptomId,
        operator: c.operator || "NONE",
        severity: c.severity || "sedang"
      })) || [{ symptomId: rule.symptomId, operator: "NONE", severity: "sedang" }], 
      disease: rule.disease,
      diseaseSeverity: rule.diseaseSeverity || "sedang"
    });
    setIsModalOpen(true);
  };

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, { symptomId: "", operator: "AND", severity: "sedang" }]
    }));
  };

  const removeCondition = (index: number) => {
    if (newRule.conditions.length <= 1) return;
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: string, value: string) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }));
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    setRuleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;
    try {
      const response = await fetch(`/api/rules/${ruleToDelete}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Aturan berhasil dihapus");
        fetchData();
      } else {
        toast.error("Gagal menghapus aturan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error deleting rule:", error);
    } finally {
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    const newErrors: { conditions?: string; disease?: string } = {};
    if (newRule.conditions.some(c => !c.symptomId)) newErrors.conditions = "Semua gejala harus dipilih";
    if (!newRule.disease) newErrors.disease = "Penyakit harus dipilih";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
      const method = editingRule ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newRule)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingRule(null);
        setNewRule({ conditions: [{ symptomId: "", operator: "NONE", severity: "sedang" }], disease: "", diseaseSeverity: "sedang" });
        setErrors({});
        toast.success(editingRule ? "Aturan diperbarui" : "Aturan baru ditambahkan");
        fetchData();
      } else {
        const data = await response.json();
        setErrors({ general: data.error || "Gagal menyimpan aturan." });
        toast.error(data.error || "Gagal menyimpan aturan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error saving rule:", error);
      setErrors({ general: "Terjadi kesalahan koneksi." });
    }
  };

  const filteredRules = rules.filter(r => {
    const diseaseMatch = r.disease.toLowerCase().includes(searchTerm.toLowerCase());
    const conditions = r.conditions || [{ symptomId: r.symptomId, operator: "NONE" }];
    const symptomMatch = conditions.some((c: any) => 
      c.symptomId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return diseaseMatch || symptomMatch;
  });

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Hapus Aturan"
        message="Apakah Anda yakin ingin menghapus aturan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        type="danger"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Himpunan Aturan</h2>
          <p className="text-slate-400 text-sm font-medium">Kelola basis aturan Fuzzy + Certainty Factor.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingRule(null);
              setNewRule({ conditions: [{ symptomId: "", operator: "NONE", severity: "sedang" }], disease: "", diseaseSeverity: "sedang" });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Tambah Aturan
          </button>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{editingRule ? "Edit Aturan" : "Tambah Aturan Baru"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto flex-1 text-slate-600">
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{errors.general}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi Gejala</label>
                    <button 
                      onClick={addCondition}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Tambah Gejala
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newRule.conditions.map((condition, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          {idx > 0 && (
                            <select 
                              value={condition.operator}
                              onChange={(e) => updateCondition(idx, "operator", e.target.value)}
                              className="px-3 py-2 bg-blue-100 border-none rounded-xl text-xs font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}
                          <div className="flex-1 text-sm font-bold text-slate-400">Kondisi {idx + 1}</div>
                          {newRule.conditions.length > 1 && (
                            <button 
                              onClick={() => removeCondition(idx)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Gejala</label>
                            <select 
                              value={condition.symptomId}
                              onChange={(e) => updateCondition(idx, "symptomId", e.target.value)}
                              className={cn(
                                "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 transition-all appearance-none",
                                errors.conditions ? "ring-2 ring-red-100" : "focus:ring-blue-100"
                              )}
                            >
                              <option value="">-- Pilih Gejala --</option>
                              {symptoms.map(s => (
                                <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tingkat Keparahan</label>
                            <select 
                              value={condition.severity}
                              onChange={(e) => updateCondition(idx, "severity", e.target.value)}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                            >
                              <option value="ringan">Ringan (Mild)</option>
                              <option value="sedang">Sedang (Moderate)</option>
                              <option value="berat">Berat (Severe)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.conditions && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.conditions}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hasil Penyakit & Tingkat Keparahan</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-slate-600">
                      <select 
                        value={newRule.disease}
                        onChange={(e) => setNewRule({ ...newRule, disease: e.target.value })}
                        className={cn(
                          "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all appearance-none",
                          errors.disease ? "ring-2 ring-red-100" : "focus:ring-blue-100"
                        )}
                      >
                        <option value="">-- Pilih Penyakit --</option>
                        {diseases.map(d => (
                          <option key={d.id} value={d.name}>{d.id} - {d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <select 
                        value={newRule.diseaseSeverity}
                        onChange={(e) => setNewRule({ ...newRule, diseaseSeverity: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                      >
                        <option value="ringan">Tingkat Ringan</option>
                        <option value="sedang">Tingkat Sedang</option>
                        <option value="berat">Tingkat Berat</option>
                      </select>
                    </div>
                  </div>
                  {errors.disease && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.disease}</p>}
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 flex items-center gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 hover:scale-105 transition-all"
                >
                  {editingRule ? "Simpan Perubahan" : "Simpan Aturan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari penyakit atau gejala..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">No</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kondisi Gejala</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Penyakit</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  {isAdmin ? "Aksi" : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-8 py-20 text-center text-slate-400 font-medium">Memuat data...</td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data aturan.</td>
                </tr>
              ) : (
                filteredRules.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-slate-400">{i + 1}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {(r.conditions || [{ symptomId: r.symptomId, operator: "NONE", severity: "sedang" }]).map((c: any, idx: number) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-[10px] font-black text-slate-300 uppercase">{c.operator}</span>}
                            <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                              <span className="text-xs font-bold text-blue-600">{c.symptomId}</span>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded uppercase font-black",
                                c.severity === "berat" ? "bg-red-500 text-white" :
                                c.severity === "sedang" ? "bg-amber-500 text-white" :
                                "bg-emerald-500 text-white"
                              )}>
                                {c.severity || "sedang"}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <ShieldCheck size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{r.disease}</span>
                          <span className={cn(
                            "text-[9px] px-2 py-0.5 mt-1 self-start rounded-full uppercase font-black border",
                            r.diseaseSeverity === "berat" ? "bg-red-50 text-red-500 border-red-100" :
                            r.diseaseSeverity === "sedang" ? "bg-amber-50 text-amber-500 border-amber-100" :
                            "bg-emerald-50 text-emerald-500 border-emerald-100"
                          )}>
                            {r.diseaseSeverity || "sedang"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(r)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRules;
