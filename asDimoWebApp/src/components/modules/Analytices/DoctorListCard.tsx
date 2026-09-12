import React from "react";
import AnalyticsCardTable from "../../ui/AnalyticsCardTable";

interface DoctorListCardProps {
  doctors: Array<{
    id: number | string;
    profileImage?: string;
    name: string;
    designation: string;
  }>;
}

const DoctorListCard: React.FC<DoctorListCardProps> = ({ doctors }) => {
  const doctorsListheaders = [{ key: "doctor", title: "Doctors List" }];

  return (
    <>
      {doctors.length > 0 ? (
        <AnalyticsCardTable data={doctors} headers={doctorsListheaders} />
      ) : (
        <div className="no-data">No doctors available</div>
      )}
    </>
  );
};

export default DoctorListCard;
