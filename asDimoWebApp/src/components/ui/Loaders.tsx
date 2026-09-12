import React from "react";
import "./UIStyles.css";
interface LoaderProps { text?: string; fullScreen?: boolean; }

const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
}) => {
  return (
    <div className={`loader-wrapper ${fullScreen ? "fullscreen" : ""}`}>
      <div className="loader"></div>
    </div>
  );
};

export default Loader;