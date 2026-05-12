import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  FileText, 
  Settings, 
  Bell, 
  Search, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  Heart,
  Activity,
  ChevronRight,
  Plus,
  ShieldAlert,
  HeartPulse
} from "lucide-react";
import { cn } from "./lib/utils";
import { motion, AnimatePresence } from "motion/react";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

// Pages
import Dashboard from "./pages/Dashboard";
import PatientData from "./pages/PatientData";
import Symptoms from "./pages/Symptoms";
import UnifiedRules from "./pages/UnifiedRules";
import Reports from "./pages/Reports";
import Diseases from "./pages/Diseases";
import HeartCheck from "./pages/HeartCheck";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

const SidebarItem = ({ icon: Icon, label, to, active, allowedRoles }: { icon: any, label: string, to: string, active: boolean, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
          : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "group-hover:scale-110 transition-transform")} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const AppContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/login") {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transition-transform duration-300 lg:static lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">HeartExpert</h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">Klinik Tifico</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              to="/" 
              active={location.pathname === "/"} 
            />
            <SidebarItem 
              icon={Users} 
              label="Data Pasien" 
              to="/patients" 
              active={location.pathname === "/patients"} 
            />
            <SidebarItem 
              icon={HeartPulse} 
              label="Cek Jantung" 
              to="/heart-check" 
              active={location.pathname === "/heart-check"} 
              allowedRoles={["Admin", "Staff"]}
            />
            <SidebarItem 
              icon={Stethoscope} 
              label="Data Gejala" 
              to="/symptoms" 
              active={location.pathname === "/symptoms"} 
              allowedRoles={["Admin"]}
            />
            <SidebarItem 
              icon={ShieldAlert} 
              label="Data Penyakit" 
              to="/diseases" 
              active={location.pathname === "/diseases"} 
              allowedRoles={["Admin"]}
            />
            <SidebarItem 
              icon={Activity} 
              label="Himpunan Aturan" 
              to="/rules" 
              active={location.pathname === "/rules"} 
              allowedRoles={["Admin"]}
            />
            <SidebarItem 
              icon={FileText} 
              label="Laporan" 
              to="/reports" 
              active={location.pathname === "/reports"} 
            />
            <SidebarItem 
              icon={Users} 
              label="Manajemen User" 
              to="/users" 
              active={location.pathname === "/users"} 
              allowedRoles={["Admin"]}
            />
          </nav>

          <div className="pt-6 border-t border-slate-100 space-y-2">
            <SidebarItem 
              icon={Settings} 
              label="Pengaturan" 
              to="/settings" 
              active={location.pathname === "/settings"} 
              allowedRoles={["Admin"]}
            />
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
              <Menu size={24} />
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Cari data pasien..." 
                className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl w-72 text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || "User"}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user?.role || "Role"}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/heart-check" element={<ProtectedRoute allowedRoles={["Admin", "Staff"]}><HeartCheck /></ProtectedRoute>} />
                <Route path="/patients" element={<ProtectedRoute><PatientData /></ProtectedRoute>} />
                <Route path="/symptoms" element={<ProtectedRoute allowedRoles={["Admin"]}><Symptoms /></ProtectedRoute>} />
                <Route path="/diseases" element={<ProtectedRoute allowedRoles={["Admin"]}><Diseases /></ProtectedRoute>} />
                <Route path="/rules" element={<ProtectedRoute allowedRoles={["Admin"]}><UnifiedRules /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={["Admin"]}><UserManagement /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute allowedRoles={["Admin"]}><div className="p-8 text-center text-slate-400">Halaman Pengaturan Segera Hadir</div></ProtectedRoute>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <AppContent />
    </AuthProvider>
  );
};

export default function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}
