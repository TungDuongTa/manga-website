import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export default function InputField({
  name,
  label,
  placeholder,
  type = "text",
  register,
  error,
  Icon,
  // validation,
  disabled,
  value,
  children,
}: FormInputProps) {
  return (
    <div className="space-y-2  ">
      <Label
        htmlFor={name}
        className="text-sm font-medium text-foreground mb-2 block"
      >
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          type={type}
          id={name}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          className={cn("pl-10 bg-secondary border-none ", {
            "opacity-50 cursor-not-allowed": disabled,
          })}
          {...register(name)}
        />
        {children && <>{children}</>}
      </div>

      {error && <p className="text-red-500 ">{error.message}</p>}
    </div>
  );
}
