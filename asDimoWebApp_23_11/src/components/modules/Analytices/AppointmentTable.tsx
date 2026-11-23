import React from "react";
import AnalyticsCardTable from "../../ui/AnalyticsCardTable";
import Loader from "../../ui/Loaders";

interface AppointmentTableItem {
  id: string;
  profileImage?: string;
  profileImageParent?: string;
  user: string;
  doctor: string;
  admin: string;
  name: string;
  designation: string;
  date: string;
  time: string;
  status: string;
}

interface AppointmentTableProps {
  appointments: AppointmentTableItem[];
  loading?: boolean;
  displayLimit?: number;
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({ appointments, loading = false, displayLimit }) => {
  const appointmentHeaders = [
    { key: "user", title: "User's Name" },
    { key: "doctor", title: "Doctor's Name" },
    { key: "admin", title: "Admin Name" },
    { key: "date", title: "Date" },
    { key: "time", title: "Time" },
    { key: "status", title: "Status" },
    { key: "action", title: "Action" },
  ];

  // Limit appointments if displayLimit is provided
  const displayedAppointments = displayLimit 
    ? appointments.slice(0, displayLimit) 
    : appointments;

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      {displayedAppointments.length > 0 ? (
        <AnalyticsCardTable data={displayedAppointments} headers={appointmentHeaders} />
      ) : (
        <div className="no-data">No appointments available</div>
      )}
    </>
  );
};

export default AppointmentTable;
