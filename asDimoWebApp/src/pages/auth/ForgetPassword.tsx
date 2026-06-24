import { useState } from "react";

import "./auth.css";

import type { FieldConfig } from "../../components/ui/FormInputfields";
import FormInputField from "../../components/ui/FormInputfields";

import { Heading1 } from "../../components/ui/HeadingPara";

import Button from "../../components/ui/Buttons";
import { BASE_URL } from "../../api/config";

type ForgetPasswordProps = {
  onBackToLogin: () => void;
  email: string;
  otp: string;
};

function ForgetPassword({
  onBackToLogin,
  email,
  otp,
}: ForgetPasswordProps) {
  const [formData, setFormData] = useState({
    password: "",
    confirmpassword: "",
  });

  const [errors, setErrors] = useState<{password?: string;confirmpassword?: string;}>({});

  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: FieldConfig[] = [
    { label: "New Password", name: "password", type: "password", placeholder: "Enter your password", required: true, },
    { label: "Confirm Password", name: "confirmpassword", type: "password", placeholder: "Re-Enter your password", required: true, },
  ];

  const passwordRegex =/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const updatedData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedData);

    const newErrors: typeof errors = {
      ...errors,
      [name]: "",
    };

    // PASSWORD LIVE VALIDATION
    if (name === "password") {
      if (!value) {
        newErrors.password =
          "Password is required";
      } else if (
        !passwordRegex.test(value)
      ) {
        newErrors.password =
          "Min 6 chars, 1 capital, 1 number & 1 special character required";
      } else {
        newErrors.password = "";
      }

      // Check confirm password live
      if (
        updatedData.confirmpassword
      ) {
        if (
          value !==
          updatedData.confirmpassword
        ) {
          newErrors.confirmpassword =
            "Passwords do not match";
        } else {
          newErrors.confirmpassword =
            "";
        }
      }
    }

    // CONFIRM PASSWORD LIVE MATCH
    if (
      name === "confirmpassword"
    ) {
      if (!value) {
        newErrors.confirmpassword =
          "Confirm Password is required";
      } else if (
        value !==
        updatedData.password
      ) {
        newErrors.confirmpassword =
          "Passwords do not match";
      } else {
        newErrors.confirmpassword =
          "";
      }
    }

    setErrors(newErrors);
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    // if (!formData.password) {
    //   newErrors.password = "Password is required";
    // }

    if (!formData.password) {
      newErrors.password =
        "Password is required";
    } else if (
      !passwordRegex.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Min 6 chars, 1 capital, 1 number & 1 special character required";
    }

    // if (!formData.confirmpassword) {
    //   newErrors.confirmpassword =
    //     "Confirm Password is required";
    // }

    if (
      formData.password &&
      formData.confirmpassword &&
      formData.password !==
        formData.confirmpassword
    ) {
      newErrors.confirmpassword =
        "Passwords do not match";
    }

    if (
      formData.password &&
      formData.confirmpassword &&
      formData.password !== formData.confirmpassword
    ) {
      newErrors.confirmpassword =
        "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const apiResponse = await fetch(
        `${BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            password: formData.password,
          }),
        }
      );

      const response = await apiResponse.json();

      if (!apiResponse.ok || !response.success) {
        throw new Error(
          response.message ||
          "Password reset failed"
        );
      }

      console.log(
        "Password reset success",
        response
      );

      // alert(response.message);

      onBackToLogin();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Password reset failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-box">
      <Heading1 text="NEW PASSWORD" />

      <div className="LogIn">
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <FormInputField
              key={field.name}
              {...field}
              value={
                formData[
                  field.name as keyof typeof formData
                ]
              }
              onChange={handleChange}
              error={
                errors[
                  field.name as keyof typeof errors
                ]
              }
            />
          ))}

          {apiError && (
            <p className="error-text">
              {apiError}
            </p>
          )}

          <Button
            text="Back to Login"
            variant="trashparent"
            className="ForgetPassword"
            type="button"
            onClick={onBackToLogin}
          />

          {/* <Button
            type="submit"
            text="Set New Password"
            width="full"
            textsize="md"
          /> */}

          <Button
            type="submit"
            text={
              isSubmitting
                ? "Please wait..."
                : "Set New Password"
            }
            width="full"
            textsize="md"
            disabled={isSubmitting}
          />
        </form>
      </div>
    </div>
  );
}

export default ForgetPassword;