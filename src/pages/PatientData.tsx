import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  X,
  FileSpreadsheet,
  History,
  GripVertical,
  RefreshCcw
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { cn } from "../lib/utils";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "sonner";

const PatientData = () => {
  const { token, user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [newPatient, setNewPatient] = useState({ 
    id: "", 
    name: "", 
    department: "",
    age: "", 
    gender: "Laki-laki", 
    address: "", 
    phone: "" 
  });
  const [errors, setErrors] = useState<any>({});
  const [fieldOrder, setFieldOrder] = useState([
    "id", "name", "department", "age", "gender", "phone", "address"
  ]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: any | null }>({ isOpen: false, id: null });
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "Admin";
  const canManage = ["Admin", "Staff"].includes(user?.role || "");

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchPatients = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/patients", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(async res => {
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let detail = "Unknown error";
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const errData = await res.json();
            detail = errData.error || detail;
          }
          throw new Error(`(Status: ${res.status}, Detail: ${detail})`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPatients(data);
        } else {
          setPatients([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching patients:", err);
        setPatients([]);
        setLoading(false);
        if (token) {
          toast.error("Gagal mengambil data pasien: " + err.message);
        }
      });
  };

  useEffect(() => {
    if (token) {
      fetchPatients();
    }
  }, [token]);

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setNewPatient({
      id: String(patient.id),
      name: patient.name,
      department: patient.department || "",
      age: String(patient.age),
      gender: patient.gender,
      address: patient.address,
      phone: patient.phone
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: any) => {
    if (!canManage) return;
    try {
      const response = await fetch(`/api/patients/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Data pasien berhasil dihapus");
        fetchPatients();
      } else {
        toast.error("Gagal menghapus data pasien");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data");
      console.error("Error deleting patient:", error);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const handleSave = async () => {
    if (!canManage) return;
    const newErrors: any = {};
    if (!newPatient.name.trim()) newErrors.name = "Nama pasien tidak boleh kosong";
    if (!newPatient.id.trim()) newErrors.id = "ID pasien tidak boleh kosong";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingPatient ? `/api/patients/${editingPatient.id}` : "/api/patients";
      const method = editingPatient ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newPatient)
      });

      if (response.ok) {
        toast.success(editingPatient ? "Data pasien diperbarui" : "Pasien baru ditambahkan");
        setIsModalOpen(false);
        setEditingPatient(null);
        setNewPatient({ 
          id: "", 
          name: "", 
          department: "",
          age: "", 
          gender: "Laki-laki", 
          address: "", 
          phone: "" 
        });
        setErrors({});
        fetchPatients();
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menyimpan data pasien");
        setErrors({ id: data.error });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
      console.error("Error saving patient:", error);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Send to backend
      try {
        const response = await fetch("/api/patients/import", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ data })
        });
        if (response.ok) {
          toast.success("Import berhasil!");
          fetchPatients();
        } else {
          toast.error("Gagal mengimport data.");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat mengimport data");
        console.error("Error importing data:", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
        title="Hapus Pasien"
        message="Apakah Anda yakin ingin menghapus data pasien ini? Tindakan ini tidak dapat dibatalkan."
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Data Pasien</h2>
          <p className="text-slate-400 text-sm font-medium">Kelola informasi pasien Klinik Tifico.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          {isAdmin && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-all"
            >
              <FileSpreadsheet size={20} />
              Import Excel
            </button>
          )}
          {canManage && (
            <button 
              onClick={() => {
                setEditingPatient(null);
                setNewPatient({ 
                  id: "", 
                  name: "", 
                  department: "",
                  age: "", 
                  gender: "Laki-laki", 
                  address: "", 
                  phone: "" 
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-105 transition-all"
            >
              <UserPlus size={20} />
              Tambah Pasien
            </button>
          )}
        </div>
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
                <h3 className="text-xl font-bold text-slate-800">{editingPatient ? "Edit Data Pasien" : "Tambah Pasien Baru"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <Reorder.Group axis="y" values={fieldOrder} onReorder={setFieldOrder} className="space-y-6">
                  {fieldOrder.map((fieldId) => (
                    <Reorder.Item 
                      key={fieldId} 
                      value={fieldId}
                      className="bg-white rounded-2xl border border-transparent hover:border-slate-100 hover:shadow-sm transition-all group/item"
                    >
                      <div className="flex items-start gap-4 p-2">
                        <div className="mt-8 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors">
                          <GripVertical size={20} />
                        </div>
                        <div className="flex-1">
                          {fieldId === "id" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID Pasien</label>
                              <input 
                                type="text" 
                                value={newPatient.id}
                                onChange={(e) => setNewPatient({ ...newPatient, id: e.target.value })}
                                placeholder="Contoh: 101" 
                                className={cn(
                                  "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                                  errors.id ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100"
                                )}
                              />
                              {errors.id && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.id}</p>}
                            </div>
                          )}
                          {fieldId === "name" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Pasien</label>
                              <input 
                                type="text" 
                                value={newPatient.name}
                                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                placeholder="Nama Lengkap" 
                                className={cn(
                                  "w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 transition-all",
                                  errors.name ? "ring-2 ring-red-100 placeholder:text-red-300" : "focus:ring-blue-100"
                                )}
                              />
                              {errors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.name}</p>}
                            </div>
                          )}
                          {fieldId === "department" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departemen</label>
                              <input 
                                type="text" 
                                value={newPatient.department}
                                onChange={(e) => setNewPatient({ ...newPatient, department: e.target.value })}
                                placeholder="Contoh: Produksi, HRD, IT" 
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                              />
                            </div>
                          )}
                          {fieldId === "age" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umur</label>
                              <input 
                                type="number" 
                                value={newPatient.age}
                                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                placeholder="Contoh: 25" 
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                              />
                            </div>
                          )}
                          {fieldId === "gender" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jenis Kelamin</label>
                              <select 
                                value={newPatient.gender}
                                onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                              >
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                              </select>
                            </div>
                          )}
                          {fieldId === "phone" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Telepon</label>
                              <input 
                                type="text" 
                                value={newPatient.phone}
                                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                placeholder="0812..." 
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                              />
                            </div>
                          )}
                          {fieldId === "address" && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat</label>
                              <textarea 
                                value={newPatient.address}
                                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                                placeholder="Alamat Lengkap" 
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[80px] resize-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
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
                  {editingPatient ? "Simpan Perubahan" : "Simpan Pasien"}
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
              placeholder="Cari nama atau ID pasien..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchPatients()}
              className={cn(
                "p-3 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 transition-all",
                loading && "animate-spin"
              )}
              disabled={loading}
              title="Perbarui Data"
            >
              <RefreshCcw size={18} />
            </button>
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
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Pasien</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Pasien</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departemen</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Umur</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jenis Kelamin</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alamat</th>
                <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  {canManage ? "Aksi" : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-8 py-20 text-center text-slate-400 font-medium">Memuat data...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="px-8 py-20 text-center text-slate-400 font-medium">Tidak ada data pasien yang sesuai.</td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">P-{String(p.id).padStart(3, '0')}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider">{p.department || "-"}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{p.age} Tahun</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{p.gender}</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{p.address}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/reports?patient=${encodeURIComponent(p.name)}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Lihat Riwayat"
                        >
                          <History size={18} />
                        </Link>
                        {canManage && (
                          <>
                            <button 
                              onClick={() => handleEdit(p)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({ isOpen: true, id: p.id })}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menampilkan 1-{filteredPatients.length} dari {filteredPatients.length} Pasien</p>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50" disabled>
              <ChevronLeft size={20} />
            </button>
            <button className="w-10 h-10 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100">1</button>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50" disabled>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientData;
