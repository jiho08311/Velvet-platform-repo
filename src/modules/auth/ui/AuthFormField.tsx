import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

const authFormFieldClassName = "space-y-2";
const authFormLabelClassName = "block text-sm font-medium text-zinc-700";
const authFormInputClassName =
  "w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/10";
const authFormNoticeClassNames = {
  error: "rounded-2xl border border-red-300 bg-red-50 px-4 py-3",
  success: "rounded-2xl border border-green-300 bg-green-50 px-4 py-3",
};
const authFormNoticeTextClassNames = {
  error: "text-sm text-red-600",
  success: "whitespace-pre-line text-sm text-green-700",
};
const authFormSubmitButtonClassName =
  "w-full rounded-2xl bg-[#C2185B] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#D81B60] disabled:cursor-not-allowed disabled:opacity-60";

type AuthFormFieldProps = {
  children: ReactNode;
  htmlFor: string;
  label: ReactNode;
};

type AuthFormInputProps = InputHTMLAttributes<HTMLInputElement>;
type AuthFormNoticeProps = {
  children: ReactNode;
  tone: "error" | "success";
};
type AuthFormSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthFormField({
  children,
  htmlFor,
  label,
}: AuthFormFieldProps) {
  return (
    <div className={authFormFieldClassName}>
      <label htmlFor={htmlFor} className={authFormLabelClassName}>
        {label}
      </label>

      {children}
    </div>
  );
}

export function AuthFormInput({
  className,
  ...props
}: AuthFormInputProps) {
  return (
    <input
      {...props}
      className={[authFormInputClassName, className].filter(Boolean).join(" ")}
    />
  );
}

export function AuthFormNotice({ children, tone }: AuthFormNoticeProps) {
  return (
    <div className={authFormNoticeClassNames[tone]}>
      <p className={authFormNoticeTextClassNames[tone]}>{children}</p>
    </div>
  );
}

export function AuthFormSubmitButton({
  className,
  ...props
}: AuthFormSubmitButtonProps) {
  return (
    <button
      {...props}
      className={[authFormSubmitButtonClassName, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
