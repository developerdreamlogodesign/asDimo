import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-animated";

export interface FieldConfig {
  label: string;
  type?: string;
  fieldType?: "input" | "select";
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?:
    | ((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void)
    | ((e: React.ChangeEvent<HTMLInputElement>) => void)
    | ((e: React.ChangeEvent<HTMLSelectElement>) => void);
  className?: string;
  required?: boolean;
  error?: string;
  options?: {
    label: string;
    value: string;
  }[];
}

const FormInputField: React.FC<FieldConfig> = ({
  label,
  type = "text",
  fieldType = "input",
  name,
  placeholder,
  value,
  onChange,
  className = "",
  required = false,
  error,
  options = [],
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={name}>{label}</label>

      {fieldType === "select" ? (
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
          required={required}
          className={error ? "input-error" : ""}
        >
          <option value="" disabled>
            {placeholder || `Select ${label}`}
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="input-wrapper">
          <input
            id={name}
            type={
              isPassword
                ? showPassword
                  ? "text"
                  : "password"
                : type
            }
            name={name}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
            required={required}
            className={error ? "input-error" : ""}
          />

          {isPassword && (
            <button
              type="button"
              className="eye-btn"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          )}
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default FormInputField;
