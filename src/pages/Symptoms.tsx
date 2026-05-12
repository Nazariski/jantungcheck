import React, { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "sonner";

const Symptoms = () => {
  const { token, user } = useAuth();
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<any>(null);
  const [newSymptom, setNewSymptom] = useState({ id: "", name: "", type: "Gejala Tambahan", cfPakar: "0.0" });
  const [errors, setErrors] = useState<{ id?: string; name?: string }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.role === "Admin";

  const filteredSymptoms = symptoms.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchSymptoms = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/symptoms", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setSymptoms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setSymptoms([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      fetchSymptoms();
    }
  }, [token]);

  const handleEdit = (symptom: any) => {
    setEditingSymptom(symptom);
    setNewSymptom({ 
      id: symptom.id, 
      name: symptom.name, 
      type: symptom.type, 
      cfPakar: String(symptom.cfPakar || 0) 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`/api/symptoms/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Gejala berhasil dihapus");
        fetchSymptoms();
      } else {
        toast.error("Gagal menghapus gejala");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data");
      console.error("Error deleting symptom:", error);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    const newErrors: { id?: string; name?: string } = {};
    
    if (!newSymptom.name.trim()) {
      newErrors.name = "Nama gejala tidak boleh kosong";
    }

    if (!newSymptom.id.trim()) {
      newErrors.id = "Kode gejala tidak boleh kosong";
    } else if (!editingSymptom && symptoms.find(s => s.id.toLowerCase() === newSymptom.id.toLowerCase())) {
      newErrors.id = "Kode gejala sudah digunakan";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingSymptom ? `/api/symptoms/${editingSymptom.id}` : "/api/symptoms";
      const method = editingSymptom ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newSymptom)
      });

      if (response.ok) {
        toast.success(editingSymptom ? "Gejala diperbarui" : "Gejala baru ditambahkan");
        setIsModalOpen(false);
        setEditingSymptom(null);
        setNewSymptom({ id: "", name: "", type: "Gejala Tambahan", cfPakar: "0.0" });
        setErrors({});
        fetchSymptoms();
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menyimpan gejala");
        setErrors({ id: data.error });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error saving symptom:", error);
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
        title="Hapus Gejala"
        message="Apakah Anda yakin ingin menghapus gejala ini? Tindakan ini tidak dapat dibatalkan."
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Gejala</h2>
          <p className="text-slate-400 text-sm font-medium">Kelola daftar gejala penyakit jantung.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Tambah Gejala
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
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{editingSymptom ? "Edit Gejala" : "Tambah Gejala Baru"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kode Gejala</label>
                  <input 
                    type="text" 
                    value={newSymptom.id}
                    onChange={(e) => setNewSymptom({ ...newSymptom, id: e.target.value })}
                    disabled={!!editingSymptom}
                    placeholder="Contoh: G05" 
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                      errors.id ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100",
                      editingSymptom && "opacity-50 cursor-not-allowed"
                    )}
                  />
                  {errors.id && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.id}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Gejala</label>
                  <input 
                    type="text" 
                    value={newSymptom.name}
                    onChange={(e) => setNewSymptom({ ...newSymptom, name: e.target.value })}
                    placeholder="Contoh: Pusing Berlebih" 
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                      errors.name ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100"
                    )}
                  />
                  {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe Gejala</label>
                    <select 
                      value={newSymptom.type}
                      onChange={(e) => setNewSymptom({ ...newSymptom, type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                    >
                      <option value="Gejala Utama">Gejala Utama</option>
                      <option value="Gejala Tambahan">Gejala Tambahan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">CF Pakar (0-1)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="1"
                      value={newSymptom.cfPakar}
                      onChange={(e) => setNewSymptom({ ...newSymptom, cfPakar: e.target.value })}
                      placeholder="0.8" 
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
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
                  {editingSymptom ? "Simpan Perubahan" : "Simpan Gejala"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau kode gejala..." 
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
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kode Gejala</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Gejala</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipe Gejala</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">CF Pakar</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  {isAdmin ? "Aksi" : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-8 py-20 text-center text-slate-400 font-medium">Memuat data...</td>
                </tr>
              ) : filteredSymptoms.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data gejala yang sesuai.</td>
                </tr>
              ) : (
                filteredSymptoms.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">{s.id}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-purple-600 group-hover:text-white transition-all">
                          <Activity size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                        s.type === "Gejala Utama" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-600">{s.cfPakar || 0}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(s)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, id: s.id })}
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

export default Symptoms;
