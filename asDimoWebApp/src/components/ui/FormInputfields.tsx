import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-animated";

export interface FieldConfig {
  label: string;
  type?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  error?: string;
  options?: string[];
}

const FormInputField: React.FC<FieldConfig> = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  className = "",
  required = false,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={name}>{label}</label>

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
          value={value}
          onChange={onChange}
          required={required}
          className={error ? "input-error" : ""}
        />

        {isPassword && (
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeIcon/> : <EyeOffIcon/> }
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default FormInputField;