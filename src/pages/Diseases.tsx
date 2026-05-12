import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  X,
  FileText
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import ConfirmModal from "../components/ConfirmModal";

const Diseases = () => {
  const { token, user } = useAuth();
  const [diseases, setDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [diseaseToDelete, setDiseaseToDelete] = useState<string | null>(null);
  const [newDisease, setNewDisease] = useState({ 
    id: "", 
    name: "", 
    description: "",
    solusiRendah: "",
    solusiRingan: "",
    solusiTinggi: ""
  });
  const [errors, setErrors] = useState<{ id?: string; name?: string }>({});
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.role === "Admin";

  const filteredDiseases = diseases.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchDiseases = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/diseases", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setDiseases(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setDiseases([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (token) {
      fetchDiseases();
    }
  }, [token]);

  const handleEdit = (disease: any) => {
    setEditingDisease(disease);
    setNewDisease({
      id: disease.id,
      name: disease.name,
      description: disease.description || "",
      solusiRendah: disease.solusiRendah || "",
      solusiRingan: disease.solusiRingan || "",
      solusiTinggi: disease.solusiTinggi || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setDiseaseToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!diseaseToDelete) return;
    try {
      const response = await fetch(`/api/diseases/${diseaseToDelete}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Data penyakit berhasil dihapus");
        fetchDiseases();
      } else {
        toast.error("Gagal menghapus data penyakit");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error deleting disease:", error);
    } finally {
      setShowDeleteConfirm(false);
      setDiseaseToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    const newErrors: { id?: string; name?: string } = {};
    if (!newDisease.name.trim()) newErrors.name = "Nama penyakit tidak boleh kosong";
    if (!newDisease.id.trim()) {
      newErrors.id = "Kode penyakit tidak boleh kosong";
    } else if (!editingDisease && diseases.find(d => d.id.toLowerCase() === newDisease.id.toLowerCase())) {
      newErrors.id = "Kode penyakit sudah digunakan";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingDisease ? `/api/diseases/${editingDisease.id}` : "/api/diseases";
      const method = editingDisease ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newDisease)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingDisease(null);
        setNewDisease({ 
          id: "", 
          name: "", 
          description: "",
          solusiRendah: "",
          solusiRingan: "",
          solusiTinggi: ""
        });
        setErrors({});
        toast.success(editingDisease ? "Data penyakit diperbarui" : "Penyakit baru ditambahkan");
        fetchDiseases();
      } else {
        const data = await response.json();
        setErrors({ id: data.error });
        toast.error(data.error || "Gagal menyimpan data penyakit");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error saving disease:", error);
    }
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Hapus Penyakit"
        message="Apakah Anda yakin ingin menghapus data penyakit ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        type="danger"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Penyakit</h2>
          <p className="text-slate-400 text-sm font-medium">Kelola daftar penyakit jantung (Master Data).</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingDisease(null);
              setNewDisease({ 
                id: "", 
                name: "", 
                description: "",
                solusiRendah: "",
                solusiRingan: "",
                solusiTinggi: ""
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Tambah Penyakit
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
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{editingDisease ? "Edit Penyakit" : "Tambah Penyakit Baru"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kode Penyakit</label>
                    <input 
                      type="text" 
                      value={newDisease.id}
                      disabled={!!editingDisease}
                      onChange={(e) => setNewDisease({ ...newDisease, id: e.target.value })}
                      placeholder="Contoh: P01" 
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                        editingDisease ? "opacity-50 cursor-not-allowed" : (errors.id ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100")
                      )}
                    />
                    {errors.id && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.id}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Penyakit</label>
                    <input 
                      type="text" 
                      value={newDisease.name}
                      onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
                      placeholder="Contoh: Penyakit Jantung Koroner" 
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                        errors.name ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100"
                      )}
                    />
                    {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deskripsi</label>
                  <textarea 
                    value={newDisease.description}
                    onChange={(e) => setNewDisease({ ...newDisease, description: e.target.value })}
                    placeholder="Keterangan singkat mengenai penyakit..." 
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    Solusi Berdasarkan Tingkat Resiko
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Solusi Resiko Rendah</label>
                      <textarea 
                        value={newDisease.solusiRendah}
                        onChange={(e) => setNewDisease({ ...newDisease, solusiRendah: e.target.value })}
                        placeholder="Saran penanganan untuk resiko rendah..." 
                        className="w-full px-4 py-3 bg-emerald-50/30 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 transition-all min-h-[60px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Solusi Resiko Ringan/Sedang</label>
                      <textarea 
                        value={newDisease.solusiRingan}
                        onChange={(e) => setNewDisease({ ...newDisease, solusiRingan: e.target.value })}
                        placeholder="Saran penanganan untuk resiko ringan/sedang..." 
                        className="w-full px-4 py-3 bg-amber-50/30 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-100 transition-all min-h-[60px] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Solusi Resiko Tinggi</label>
                      <textarea 
                        value={newDisease.solusiTinggi}
                        onChange={(e) => setNewDisease({ ...newDisease, solusiTinggi: e.target.value })}
                        placeholder="Saran penanganan untuk resiko tinggi..." 
                        className="w-full px-4 py-3 bg-red-50/30 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-red-100 transition-all min-h-[60px] resize-none"
                      />
                    </div>
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
                  {editingDisease ? "Simpan Perubahan" : "Simpan Penyakit"}
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
              placeholder="Cari nama atau kode penyakit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kode</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Penyakit</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi</th>
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
              ) : filteredDiseases.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data penyakit yang sesuai.</td>
                </tr>
              ) : (
                filteredDiseases.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">{d.id}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-amber-600 group-hover:text-white transition-all">
                          <ShieldAlert size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-500 max-w-xs truncate">{d.description || "-"}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(d)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(d.id)}
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

export default Diseases;
