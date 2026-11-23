import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./layout.css";
import { Outlet } from "react-router-dom";

const DashboardLayOut: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    window.innerWidth >= 768
  );

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;

      setIsDesktop(desktop);

      if (desktop) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="dashboard">
      <Sidebar open={isDesktop ? true : open} isDesktop={isDesktop} closeSidebar={() => setOpen(false)} />

      <div className={`main ${isDesktop ? "desktop" : ""}`}> <Navbar toggle={() => !isDesktop && setOpen((prev) => !prev) } />

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayOut;