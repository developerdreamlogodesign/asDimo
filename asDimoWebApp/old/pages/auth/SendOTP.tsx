// import { useState } from "react";
import { useEffect, useRef, useState } from "react";

import "./auth.css";

import type { FieldConfig } from "../../components/ui/FormInputfields";
import FormInputField from "../../components/ui/FormInputfields";

import { Heading1 } from "../../components/ui/HeadingPara";

import Button from "../../components/ui/Buttons";
import { BASE_URL } from "../../api/config";

const OTP_TIMER_SECONDS = 10 * 60;

  type SendOTPProps = {
    onBackToLogin: () => void;
    onOTPSuccess: (
      email: string,
      otp: string
    ) => void;
  };

function SendOTP({onBackToLogin,onOTPSuccess,}: SendOTPProps) {
  const [showOTPField, setShowOTPField] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    otp1: "",
    otp2: "",
    otp3: "",
    otp4: "",
    otp5: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
  }>({});

  const fields: FieldConfig[] = [
    {
      label: "ENTER YOUR e-MAIL",
      name: "email",
      type: "email",
      placeholder: "Enter your email",
    },
  ];

  const formattedTime = `${Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0")}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  useEffect(() => {
    if (!showOTPField || timeLeft <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [showOTPField, timeLeft]);

  const sendOTP = async () => {
    const apiResponse = await fetch(
      `${BASE_URL}/auth/verify-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
        }),
      }
    );

    const response = await apiResponse.json();

    if (!apiResponse.ok || !response.success) {
      throw new Error(
        response.message || "Failed to send OTP"
      );
    }

    return response;
  };

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

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;

    // allow only number
    const numericValue = value.replace(/\D/g, "");

    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));

    setErrors((prev) => ({
      ...prev,
      otp: "",
    }));

    setApiError("");

    // move to next input
    if (
      numericValue &&
      index < 4
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }
  };
  const handleOTPKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Enter -> next input
    if (
      e.key === "Enter" &&
      index < 4
    ) {
      e.preventDefault();

      otpRefs.current[
        index + 1
      ]?.focus();
    }

    // Backspace -> previous input
    if (
      e.key === "Backspace" &&
      !(
        e.target as HTMLInputElement
      ).value &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    // Left Arrow
    if (
      e.key === "ArrowLeft" &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }

    // Right Arrow
    if (
      e.key === "ArrowRight" &&
      index < 4
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // const handleSubmit = (
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    // SEND OTP
    if (!showOTPField) {
      if (!formData.email) {
        newErrors.email =
          "Email is required";
      }

      setErrors(newErrors);


      if (Object.keys(newErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      setApiError("");

      try {
        const response = await sendOTP();

        console.log("OTP sent:", response);

        setShowOTPField(true);
        setTimeLeft(OTP_TIMER_SECONDS);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      } catch (error) {
        setApiError(
          error instanceof Error
            ? error.message
            : "Failed to send OTP"
        );
      } finally {
        setIsSubmitting(false);
      }
      

      return;
    }

    // VERIFY OTP
    const otp =
      formData.otp1 +
      formData.otp2 +
      formData.otp3 +
      formData.otp4 +
      formData.otp5;

    if (otp.length < 5) {
      newErrors.otp =
        "Please enter valid OTP";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setApiError("");

    try {
      const apiResponse = await fetch(
        `${BASE_URL}/auth/validate-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            otp,
          }),
        }
      );

      const response = await apiResponse.json();

      if (!apiResponse.ok || !response.success) {
        throw new Error(
          response.message || "Invalid OTP"
        );
      }

      console.log(
        "OTP verified:",
        response
      );

      // optional if needed later
      localStorage.setItem(
        "resetUserId",
        response.data.userId
      );

      // onOTPSuccess();
      onOTPSuccess(formData.email,otp);

    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "OTP verification failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setApiError("");
    setErrors((prev) => ({
      ...prev,
      otp: "",
    }));

    try {
      const response = await sendOTP();

      console.log("OTP resent:", response);

      setFormData((prev) => ({
        ...prev,
        otp1: "",
        otp2: "",
        otp3: "",
        otp4: "",
        otp5: "",
      }));
      setTimeLeft(OTP_TIMER_SECONDS);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Failed to resend OTP"
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="login-box">
      <Heading1 text="Forget Password" />

      <div className="LogIn">
        <form onSubmit={handleSubmit}>
          {!showOTPField &&
            fields.map((field) => (
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

          {/* OTP Fields */}
          {showOTPField && (
            <>
              <label className="otp-label">
                ENTER OTP
              </label>

              <div className="otp-wrapper">
                {[1, 2, 3, 4, 5].map((num) => (
                  <input
                    key={num}
                    ref={(el) => {
                      otpRefs.current[
                        num - 1
                      ] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    name={`otp${num}`}
                    value={
                      formData[
                        `otp${num}` as keyof typeof formData
                      ]
                    }
                    onChange={(e) =>
                      handleOTPChange(
                        e,
                        num - 1
                      )
                    }
                    onKeyDown={(e) =>
                      handleOTPKeyDown(
                        e,
                        num - 1
                      )
                    }
                    className="otp-input"
                  />
                ))}
              </div>

              {errors.otp && (
                <p className="error-text">
                  {errors.otp}
                </p>
              )}

              <div className="otp-resend-row">
                {timeLeft > 0 ? (
                  <p className="otp-timer">
                    Resend OTP in {formattedTime}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="otp-resend-link"
                    onClick={handleResendOTP}
                    disabled={isResending}
                  >
                    {isResending
                      ? "Sending..."
                      : "Resend OTP"}
                  </button>
                )}
              </div>
            </>
          )}

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
            text={
              showOTPField
                ? "VERIFY OTP"
                : "SEND OTP"
            }
            width="full"
            textsize="md"
          /> */}
          <Button
            type="submit"
            text={
              isSubmitting
                ? "Please wait..."
                : showOTPField
                ? "VERIFY OTP"
                : "SEND OTP"
            }
            width="full"
            textsize="md"
            disabled={isSubmitting || isResending}
          />
        </form>
      </div>
    </div>
  );
}

export default SendOTP;
