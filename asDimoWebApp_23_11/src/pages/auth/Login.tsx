import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./auth.css";

import type { FieldConfig } from "../../components/ui/FormInputfields";
import FormInputField from "../../components/ui/FormInputfields";

import { Heading1 } from "../../components/ui/HeadingPara";

import Button from "../../components/ui/Buttons";
import { getRouteByFlag } from "../../middleware/AuthMiddleware";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";

type LoginProps = {
  onForgotPassword: () => void;
};

function Login({ onForgotPassword }: LoginProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: FieldConfig[] = [
    { label: "Email", name: "email", type: "email", placeholder: "Enter your email" },
    { label: "Password", name: "password", type: "password", placeholder: "Enter your password" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setApiError("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const response = await authService.login(
        formData.email.trim(),
        formData.password
      );

      if (getRouteByFlag(response.data.user.flag) === "/") {
        throw new Error("You are not allowed to login");
      }

      // Store tokens and user data
      tokenManager.setTokens({
        token: response.data.token,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
      tokenManager.setUser(response.data.user);

      navigate(getRouteByFlag(response.data.user.flag));
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-box">
      <Heading1 text="LOGIN" />

      <div className="LogIn">
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <FormInputField
              key={field.name}
              {...field}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
              error={errors[field.name as keyof typeof errors]}
            />
          ))}

          {apiError && (
            <p className="error-text login-error">{apiError}</p>
          )}

          <Button
            text="Forget Your password?"
            variant="trashparent"
            className="ForgetPassword"
            type="button"
            onClick={onForgotPassword}
          />

          <Button
            type="submit"
            text={isSubmitting ? "Please wait..." : "Proceed"}
            width="full"
            textsize="md"
            disabled={isSubmitting}
          />
        </form>
      </div>
    </div>
  );
}

export default Login;
