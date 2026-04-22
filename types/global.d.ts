import { LucideIcon } from "lucide-react";
declare global {
  type SignInFormData = {
    email: string;
    password: string;
  };

  type SignUpFormData = {
    userName: string;
    email: string;
    password: string;
  };
  type FormInputProps = {
    name: string;
    label: string;
    placeholder: string;
    Icon?: LucideIcon;
    type?: string;
    register: UseFormRegister;
    error?: FieldError;
    validation?: RegisterOptions;
    disabled?: boolean;
    value?: string;
    children?: React.ReactNode;
  };
}
export {};
