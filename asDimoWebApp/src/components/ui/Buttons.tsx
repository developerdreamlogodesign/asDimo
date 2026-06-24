import React from "react";
import "./UIstyles.css";

interface GlobalButtons {
  text: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  textsize?: "sm" | "md" | "lg";
  variant?: "trashparent" | "solid" | "red" | "greyborder" | "neon" | "DarkGreen" | "blueborder" | "string";
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  iconPosition?: "left" | "right"; 
  width?: "full" | ""; 
}

const DashboardButtons: React.FC<GlobalButtons> = ({
  text,
  icon,
  onClick,
  textsize = "sm",
  type = "button",
  variant = "solid",
  disabled = false,
  className = "",
  iconPosition = "left",
  width = "",
}) => {
  return (
    <div className={`GlobalButton ${className}`}>
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`Global-button d-flex ${width} ${variant} ${textsize}`} >
      {iconPosition === "left" && icon}
      {text}
      {iconPosition === "right" && icon}
    </button>
    </div>
  );
};

export default DashboardButtons;