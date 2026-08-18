import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`
        h-11 w-full
        rounded-xl
        border border-slate-300
        bg-white
        px-4
        text-sm
        text-slate-900
        placeholder:text-slate-400
        outline-none
        transition-all
        focus:border-violet-600
        focus:ring-4
        focus:ring-violet-200
        disabled:cursor-not-allowed
        disabled:bg-slate-100
        hover:border-slate-400
        ${className}
      `}
      {...props}
    />
  );
}

export default Input;
