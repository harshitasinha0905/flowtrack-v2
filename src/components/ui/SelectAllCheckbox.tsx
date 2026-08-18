import { useEffect, useRef } from "react";

type SelectAllCheckboxProps = {
  checked: boolean;
  indeterminate: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};
export default function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: SelectAllCheckboxProps) {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  return (
    <input
      type="checkbox"
      className="h-3.5 w-3.5 rounded border-slate-300 cursor-pointer"
      ref={headerCheckboxRef}
      checked={checked}
      onChange={onChange}
    />
  );
}
