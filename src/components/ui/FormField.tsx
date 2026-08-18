import Label from "./Label";
import Input from "./Input";

type FormFieldProps = {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

function FormField({
  label,
  error,
  id,
  className = "",
  ...props
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={className} {...props} />
      {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
    </div>
  );
}

export default FormField;
