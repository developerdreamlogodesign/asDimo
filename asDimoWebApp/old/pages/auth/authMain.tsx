import { useState } from "react";

import "./auth.css";

import LogIn from "../auth/Login";
import ForgetPassword from "../auth/ForgetPassword";
import SendOTP from "../auth/SendOTP";

import Logo from "../../assets/Images/Logo.svg";

function AuthMain() {
  // Show Login First
  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [showSendOTP, setShowSendOTP] = useState(false);
  const [resetData, setResetData] =useState({email: "",otp: "",});

  return (
    <div className="FormContainer">
      <div className="IndexHeader">
        <img src={Logo} alt="ASDimo" />
      </div>

      {/* Login Page */}
      {!showForgotPassword &&
        !showSendOTP && (
          <LogIn
            onForgotPassword={() => {
              setShowSendOTP(true);
            }}
          />
        )}

      {/* Send OTP Page */}
      {showSendOTP && (
        <SendOTP
          onBackToLogin={() => {
            setShowSendOTP(false);
            setShowForgotPassword(false);
          }}
          onOTPSuccess={(email, otp) => {
            setResetData({
              email,
              otp,
            });

            setShowSendOTP(false);
            setShowForgotPassword(true);
          }}
        />
      )}

      {/* Forget Password Page */}
      {showForgotPassword && (
        <ForgetPassword
          onBackToLogin={() => {
            setShowForgotPassword(false);
            setShowSendOTP(false);
          }}
          email={resetData.email}
          otp={resetData.otp}
        />
      )}
    </div>
  );
}

export default AuthMain;