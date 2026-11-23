import React, { useEffect, useState } from "react";
import DashboardCard from "../../ui/DashboardCard";
import ZonalAdminImage from "../../../assets/Images/ZonalAdminDashIcon.svg";
import OrganizationDashIcon from "../../../assets/Images/OrganizationDashIcon.svg";
import DoctorsDashIcon from "../../../assets/Images/DoctorsDashIcon.svg";
import ParentsDashIcon from "../../../assets/Images/ParentsDashIcon.svg";
import SubscriptionsDashIcon from "../../../assets/Images/SubscriptionsDashIcon.svg";
import AppointmentDashIcon from "../../../assets/Images/AppointmentDashIcon.svg";
import { authService } from "../../../services/authService";
import { tokenManager } from "../../../services/tokenManager";
import { getCurrentUserRole } from "../../../middleware/AuthMiddleware";

interface UserCounts {
  organizationAdmin: number;
  parent: number;
  therapist: number;
  zonalAdmin: number;
  admin: number;
  totalAppointments: number;
}

const getRelatedCount = (relatedData: any, key: string) =>
  relatedData?.[key]?.count ?? relatedData?.[key]?.data?.length ?? 0;

const AnalyticesCard: React.FC = () => {
  const role = getCurrentUserRole();

  const [counts, setCounts] = useState<UserCounts>({
    organizationAdmin: 0,
    parent: 0,
    therapist: 0,
    zonalAdmin: 0,
    admin: 0,
    totalAppointments: 0,
  });

  useEffect(() => {
    const loadUserCounts = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) return;

      try {
        const currentUser = tokenManager.getUser();
        const loginFlag = Number(currentUser?.flag) || 0;

        // Flag 0 retains the existing global dashboard totals. Every other
        // role receives counts only from its own relatedData hierarchy.
        if (loginFlag === 0) {
          const response = await authService.getUserCounts(token);
          if (response.success && response.data) {
            setCounts(response.data);
          }
          return;

        }

        const response = await authService.getUserById(
          token,
          currentUser?.userId ?? currentUser?.id
        );
        const user = response?.data || response;
        const relatedData = user?.relatedData || {};

        setCounts({
          zonalAdmin: 0,
          admin: getRelatedCount(relatedData, "admins"),
          organizationAdmin: getRelatedCount(relatedData, "organizations"),
          therapist: getRelatedCount(relatedData, "teachers"),
          parent: getRelatedCount(relatedData, "parents"),
          totalAppointments: 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard user counts:", error);
      }
    };

    loadUserCounts();
  }, []);

  const getRoleRoute = (section: string) => {
    switch (role) {
      case "SuperAdmin":
        return `/superadmin/${section}`;

      case "zonalAdmin":
        return `/zonaladmin/${section}`;

      case "Admin":
        return `/admin/${section}`;

      case "OrganizationAdmin":
        return `/organizationadmin/${section}`;

      default:
        return "#";
    }
  };

  return (
    <>
      {/* Zonal Admin */}
      {role === "SuperAdmin" && (
        <DashboardCard
          title="Zonal Admin"
          description="Total Number of Zonal Admin"
          total={String(counts.zonalAdmin)}
          image={ZonalAdminImage}
          buttonLink={getRoleRoute("zonal-admin")}
        />
      )}

      {/* Admin */}
      {(role === "SuperAdmin" || role === "zonalAdmin") && (
        <DashboardCard
          title="Admin"
          description="Total Number of Admin"
          total={String(counts.admin)}
          image={ZonalAdminImage}
          buttonLink={getRoleRoute("admin")}
        />
      )}

      {/* Organization */}
      {(role === "SuperAdmin" ||
        role === "zonalAdmin" ||
        role === "Admin") && (
        <DashboardCard
          title="Organization"
          description="Total Number of Organization"
          total={String(counts.organizationAdmin)}
          image={OrganizationDashIcon}
          buttonLink={getRoleRoute("organization")}
        />
      )}

      {/* Doctors / Therapists */}
      {(role === "SuperAdmin" ||
        role === "zonalAdmin" ||
        role === "Admin" ||
        role === "OrganizationAdmin" ||
        role === "teachersGlobal") && (
        <DashboardCard
          title="Doctors / Therapists"
          description="Total Doctors / Therapists"
          total={String(counts.therapist)}
          image={DoctorsDashIcon}
          buttonLink={getRoleRoute("therapist")}
        />
      )}

      {/* Parents */}
      <DashboardCard
        title="Users / Parents"
        description="Total Number of users / parents"
        total={String(counts.parent)}
        image={ParentsDashIcon}
        buttonLink={getRoleRoute("parent")}
      />

      {/* Subscriptions */}
      <DashboardCard
        title="Subscriptions"
        description="Total Number of Subscriptions"
        total="11"
        image={SubscriptionsDashIcon}
        buttonLink={getRoleRoute("report")}
      />

      {/* Appointment */}
      <DashboardCard
        title="Appointment"
        description="Total Number of Appointment"
        total={String(counts.totalAppointments)}
        image={AppointmentDashIcon}
        buttonLink={getRoleRoute("appointment")}
      />

      {/* PE */}
      <DashboardCard
        title="PE"
        description="Total PE"
        total="11"
        image={AppointmentDashIcon}
        buttonLink={getRoleRoute("appointment")}
      />
    </>
  );
};

export default AnalyticesCard;