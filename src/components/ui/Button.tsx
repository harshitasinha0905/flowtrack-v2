import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-xl
        bg-violet-600
        px-5 py-2.5
        text-sm font-semibold text-white
        shadow-sm
        transition-all duration-200
        hover:bg-violet-700
        hover:shadow-md
        active:scale-[0.98]
        focus:outline-none
        focus:ring-4
        focus:ring-violet-300/40
        disabled:pointer-events-none
        disabled:opacity-50
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
