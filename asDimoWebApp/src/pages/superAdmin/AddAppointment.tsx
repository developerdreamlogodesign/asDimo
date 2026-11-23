import React from "react";
import { Heading1, Paragraph } from "../../components/ui/HeadingPara";
import AddAppointmentMod from "../../components/modules/AddAppointmentMod";

const AddAppointment: React.FC = () => {

  return (
    <div className="MainDashboard">
      <Heading1 text="BOOK AN APPOINTMENT" />
      <Paragraph text="Dashboard > Appointment > Book an Appointment"/>
      <AddAppointmentMod/>
    </div>
  );
};

export default AddAppointment;