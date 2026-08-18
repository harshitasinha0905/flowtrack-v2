import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        bg-white
        p-8
        shadow-lg
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
