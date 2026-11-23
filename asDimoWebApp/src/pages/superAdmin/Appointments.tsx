import React from "react";
import Tabs from "../../components/ui/Tabs";
import AppointmentList from "../../components/modules/appoinmentList";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import { Heading1 } from "../../components/ui/HeadingPara";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Video,
  House,
  Stethoscope,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import DashboardButtons from "../../components/ui/Buttons";
import {XIcon} from 'lucide-animated';
import { routes } from "../../routes/AppRoutes";


const Appointments: React.FC = () => {
  const currentRole = getCurrentUserRole();
  // console.log("...............currentRole", currentRole);
  const navigate = useNavigate();
  const isTeachersOrg = currentRole === "TeachersOrg" || currentRole === "teachersGlobal";

  const tabs = [
    {
      id: "all",
      label: (
        <span className="AppointmentTab">
          <Target size={45} />
          <span>
            {isTeachersOrg ? "Approved SESSION" : "All Appointments"}
          </span>
        </span>
      ),
      content: <AppointmentList type="all" isTeachersOrg={isTeachersOrg} />,

    },
    {
      id: "online",
      label: (
        <span className="AppointmentTab">
          {isTeachersOrg ? (
            <CheckCircle size={45} />
          ) : (
            <Video size={45} />
          )}

          <span>
            {isTeachersOrg ? "Complete SESSION" : "Video Appointments"}
          </span>
        </span>
      ),
      content: <AppointmentList type={isTeachersOrg ? "completed" : "online"} isTeachersOrg={isTeachersOrg} />,
    },
    {
      id: "home",
      label: (
        <span className="AppointmentTab">
          {isTeachersOrg ? (
            <XCircle size={45} />
          ) : (
            <House size={45} />
          )}

          <span>
            {isTeachersOrg ? "Canceled SESSION" : "Home Appointments"}
          </span>
        </span>
      ),
      content: <AppointmentList type={isTeachersOrg ? "canceled" : "home"} isTeachersOrg={isTeachersOrg} />,
    },
    {
      id: "clinic",
      label: (
        <span className="AppointmentTab">
          {isTeachersOrg ? (
            <RefreshCw size={45} />
          ) : (
            <Stethoscope size={45} />
          )}

          <span>
            {isTeachersOrg ? "Reschedule SESSION" : "Clinic Appointments"}
          </span>
        </span>
      ),
      content: <AppointmentList type={isTeachersOrg ? "reschedule" : "clinic"} isTeachersOrg={isTeachersOrg} />,
    },
  ];

  return (
    <div className="MainDashboard">
     <div className="d-flex">
      <Heading1 text="Appointments" />
      <DashboardButtons
      variant="neon"
      textsize="sm"
      icon={<XIcon className="PlusIcon" size={20}/>}
      text="Add New Appointment"
      className="AddAppointment"
        onClick={() =>
          navigate(routes.SUP_ADDAPPOINTMENT)
        }
      />
     </div>
      <Tabs tabs={tabs} variant="Horizontal" />
    </div>
  );
};

export default Appointments;