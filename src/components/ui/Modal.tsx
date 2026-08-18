import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

function Modal({ children, onClose, className = "max-w-lg" }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-h-[87vh] overflow-auto rounded-lg border border-zinc-200 bg-[#fcfcfc] p-6 shadow-lg ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
}

export default Modal;
