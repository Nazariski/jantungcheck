import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  type = "danger"
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  type === "danger" ? "bg-red-50 text-red-600" :
                  type === "warning" ? "bg-amber-50 text-amber-600" :
                  "bg-blue-50 text-blue-600"
                }`}>
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed">{message}</p>
            </div>
            <div className="p-6 bg-slate-50/50 flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 text-sm font-bold text-white rounded-2xl shadow-lg transition-all hover:scale-105 ${
                  type === "danger" ? "bg-red-600 shadow-red-100" :
                  type === "warning" ? "bg-amber-600 shadow-amber-100" :
                  "bg-blue-600 shadow-blue-100"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
