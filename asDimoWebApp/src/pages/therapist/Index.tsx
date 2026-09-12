import { Heading2, Heading1Light, ParagraphLight } from "../../components/ui/HeadingPara";
import "./therapist.css";
import AppointmentCalendar from "../../components/ui/AppointmentCalender";

const therapistAnalyticsindex: React.FC= ({
}) => {
const appointments = [
  "2026-06-28",
  "2026-07-08",
  "2026-08-11",
  "2026-09-19",
];
  return (
    <>
    <Heading2 text="DASHBOARD"/>
        <div className="therapistDashboard">
            <div className="paymnetStatus">
               <ParagraphLight text="Total Balance"/>
               <Heading1Light text="?30,000"/>
               <div className="d-flex">
                  
               </div>
            </div> 
        </div>
        <div  className="">
           <Heading2 text="Appointment"/>
           <AppointmentCalendar appointments={appointments} />
        </div>
    </>
  )
};
export default therapistAnalyticsindex;