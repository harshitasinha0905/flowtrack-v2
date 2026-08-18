import type { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`mb-2 block text-sm font-medium text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;
