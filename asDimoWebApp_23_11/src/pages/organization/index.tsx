import React, { useEffect, useState } from "react";
// import { Heading2, Heading1Light, ParagraphLight } from "../../components/ui/HeadingPara";
import { tokenManager } from "../../services/tokenManager";
// import { authService } from "../../services/authService";
import { getRoleTypeByFlag } from "../../middleware/AuthMiddleware";
// import AppointmentCalendar from "../../components/ui/AppointmentCalender";
import Analytices from "../../components/modules/Analytices";

const OrganizationAdminIndex: React.FC = () => {
  // const [stats, setStats] = useState({
  const [, setStats] = useState({
    therapistCount: 0,
    parentCount: 0,
    appointmentCount: 0,
    totalBalance: 0,
  });
  // const [appointments, setAppointments] = useState<string[]>([]);
  const [, setAppointments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const user = tokenManager.getUser();
        if (!user) return;

        const userRole = getRoleTypeByFlag(user.flag);
        setRole(userRole);
        console.log("User Role:", role);

        const token = tokenManager.getAccessToken();
        if (!token) return;

        // Fetch based on user role
        if (userRole === "teachersGlobal") {
          // For global teachers, show their stats
          // Get therapists under this user (can be empty for global)
          setStats({
            therapistCount: 0,
            parentCount: 0,
            appointmentCount: 0,
            totalBalance: 30000,
          });
        } else if (userRole === "OrganizationAdmin") {
          // For organization admin, get organization stats
          setStats({
            therapistCount: 0,
            parentCount: 0,
            appointmentCount: 0,
            totalBalance: 0,
          });
        }

        setAppointments([
          "2026-06-28",
          "2026-07-08",
          "2026-08-11",
          "2026-09-19",
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
     <Analytices/>
      {/* <div className="therapistDashboard">
        <div className="paymnetStatus">
          <ParagraphLight text="Total Balance" />
          <Heading1Light text={`₹${stats.totalBalance}`} />
          <div className="d-flex">
            <div style={{ marginRight: "20px" }}>
              <ParagraphLight text="Therapists" />
              <Heading1Light text={String(stats.therapistCount)} />
            </div>
            <div style={{ marginRight: "20px" }}>
              <ParagraphLight text="Parents" />
              <Heading1Light text={String(stats.parentCount)} />
            </div>
            <div>
              <ParagraphLight text="Appointments" />
              <Heading1Light text={String(stats.appointmentCount)} />
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <Heading2 text="Appointment" />
        <AppointmentCalendar appointments={appointments} />
      </div> */}
    </>
  );
};

export default OrganizationAdminIndex;