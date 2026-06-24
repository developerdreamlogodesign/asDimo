import React, { useState } from "react";
import "./layout.css";
import "../../components/ui/UIstyles.css";
import { NavLink } from "react-router-dom";

import { routes } from "../../routes/AppRoutes";
import { useLogout } from "../../services/useLogout";

import Logo from "../../assets/Images/Logo.svg";
import DashBoardIcon from "../../assets/Images/DashBoardIcon.svg";
import ZonalAdminIcon from "../../assets/Images/ZonalAdminIcon.svg";
import AdminIcon from "../../assets/Images/AdminIcon.svg";
import ORGicon from "../../assets/Images/ORGicon.svg";
import DoctorIcon from "../../assets/Images/DoctorIcon.svg";
import UserIcon from "../../assets/Images/UserIcon.svg";
import AppointmentIcon from "../../assets/Images/AppointmentIcon.svg";
import SettingsIcon from "../../assets/Images/SettingsIcon.svg";
import LogOutIcon from "../../assets/Images/LogOutIcon.svg";
import DashboardButtons from "../ui/Buttons";
import ModalBox from "../ui/ModalBox";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";


interface SidebarProps {
  open: boolean;
  isDesktop: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  isDesktop,
  closeSidebar,
}) => {
  const logout = useLogout();

  const [showLogoutModal, setShowLogoutModal] =
    useState(false);

  const handleLogout = async () => {
    setShowLogoutModal(false);

    if (!isDesktop) {
      closeSidebar();
    }

    await logout();
  };

const role = getCurrentUserRole();


const menuConfig = {

  SuperAdmin: [
    { name: "Dashboard", path: routes.SUPERADMIN, icon: DashBoardIcon, },
    { name: "Zonal Admin", path: routes.SUP_ZONALADMIN, icon: ZonalAdminIcon, },
    { name: "Admin", path: routes.SUP_ADMIN, icon: AdminIcon, },
    { name: "Organization", path: routes.SUP_ORGANIZATION, icon: ORGicon, },
    { name: "Doctors/Therapist", path: routes.SUP_THERAPIST, icon: DoctorIcon, },
    { name: "Users/Parents", path: routes.SUP_PARENT, icon: UserIcon, },
    { name: "Appointments", path: routes.SUP_APPOINTMENT, icon: AppointmentIcon, },
    { name: "Settings", path: routes.SUPERADMIN_SETTINGS, icon: SettingsIcon, }
  ],


  zonalAdmin: [
    { name: "Dashboard", path: routes.ZONALADMIN, icon: DashBoardIcon, },
    { name: "Settings", path: routes.ZONAL_SETTINGS, icon: SettingsIcon, }
  ],


  OrganizationAdmin: [
    { name: "Dashboard", path: routes.ORGANIZATIONADMIN, icon: DashBoardIcon, },
    { name: "Settings", path: routes.ORGANIZATION_SETTINGS, icon: SettingsIcon, }
  ],


  Admin: [
    { name: "Dashboard", path: routes.ADMIN, icon: DashBoardIcon, },
    { name: "Settings", path: routes.ADMIN_SETTINGS, icon: SettingsIcon, }
  ],

};

const menuItems =
  role && role in menuConfig
    ? menuConfig[role as keyof typeof menuConfig]
    : [];

  return (
    <div className={`sidebar ${open ? "open" : ""}`}>
      {!isDesktop && (
        <button
          type="button"
          className="sidebar-close"
          onClick={closeSidebar}
        >
          ✕
        </button>
      )}

      <div className="AdminLogo">
        <img src={Logo} alt="Logo" />
      </div>

      <div className="sidebar-menu-container">
        <ul>
          {menuItems.map((item) => {
            const isDashboardRoute =
              item.path === routes.SUPERADMIN ||
              item.path === routes.ZONALADMIN ||
              item.path === routes.ORGANIZATIONADMIN ||
              item.path === routes.ADMIN;

            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  end={isDashboardRoute}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                  onClick={() => {
                    if (!isDesktop) {
                      closeSidebar();
                    }
                  }}
                >
                  <img src={item.icon} alt={item.name} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}

        <li>
          <a
            className="logout-btn"
            onClick={() =>
              setShowLogoutModal(true)
            }
          >
            <img src={LogOutIcon} alt="Logout" />
            <span>Logout</span>
          </a>
        </li>
        </ul>
      </div>

      {showLogoutModal && (
        <ModalBox
          header={<h3>Confirm Logout</h3>}
          onCancel={() =>
            setShowLogoutModal(false)
          }
          body={
            <div className="logout-popup">
              <p>
                Are you sure you want to logout
                from your account?
              </p>

              <div className="logout-popup-actions d-flex">
                <DashboardButtons
                  text="Cancel"
                  variant="DarkGreen"
                  textsize="sm"
                  onClick={() =>
                    setShowLogoutModal(false)
                  }
                />

                <DashboardButtons
                  text="Logout"
                  variant="DarkGreen"
                  textsize="sm"
                  onClick={handleLogout}
                />
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};

export default Sidebar;
