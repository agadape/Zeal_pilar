import { useEffect, useRef } from "react";
import { IconX } from "@tabler/icons-react";

export default function FormPanel({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  onSubmit, 
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  isSubmitDisabled = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  onSubmit?: (e: React.FormEvent) => void; 
  submitLabel?: string; 
  cancelLabel?: string; 
  isSubmitDisabled?: boolean 
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="
          absolute inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl
          sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:h-full sm:max-h-full
          sm:w-full sm:max-w-md sm:rounded-none
          bg-white shadow-2xl
          flex flex-col
          animate-slide-up sm:animate-slide-in-right
        "
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        <div className="flex-shrink-0 flex items-start justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup"
          >
            <IconX size={20} />
          </button>
        </div>

        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">
              {children}
            </div>
            <div className="flex-shrink-0 flex gap-3 px-6 sm:px-8 py-5 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#b5852e" }}
              >
                {submitLabel}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 space-y-5 custom-scrollbar">
              {children}
            </div>
            <div className="flex-shrink-0 flex justify-end px-6 sm:px-8 py-5 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
