import React from "react";
import { tokenManager } from "../../services/tokenManager";
import DashboardButtons from "../ui/Buttons";
import IButton from "../../assets/Images/iButton.svg";
import { useNavigate } from 'react-router-dom';
// import { routes } from '../../routes/AppRoutes';

export interface ProfileRow {
  id: string | number;
  profileImage?: string;
  profileImageParent?: string;
  name?: string;
  designation?: string;
  date?: string;
  time?: string;
  status?: string;

  [key: string]: any;
}

interface TableHeader {
  key: string;
  title: string;
}

interface ProfileTableProps {
  headers: TableHeader[];
  data: ProfileRow[];
}

const ProfileTable: React.FC<ProfileTableProps> = ({
  headers,
  data,
}) => {
    const navigate = useNavigate();

  const handleViewDetails = (userId: string | number) => {
    navigate("#");
    console.log("View details for userId:", userId);
  };

  const roleFlag = Number(tokenManager.getUser()?.flag);
  const hiddenHeaderKeysByRole: Record<number, string[]> = {
    6: ["zonalAdmin", "zonal_admin_name"],
    7: ["admin", "admin_name"],
    1: ["organization", "organization_name"],
    3: ["teacher", "doctor", "therapist"],
  };
  const permittedHeaders = headers.filter(
    (header) => !hiddenHeaderKeysByRole[roleFlag]?.includes(header.key)
  );

  return (
    <div className="AnalyticsCardTable">
      <table className="profile-table">
        <thead>
          <tr>
            {permittedHeaders.map((header) => (
              <th key={header.key}>{header.title}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {permittedHeaders.map((header) => (
                <td key={header.key}>
                  {header.key === "doctor" ? (
                    <div className="doctor-info">
                      {/* {row.profileImage && (
                        <img
                          src={row.profileImage}
                          alt={row.name || ""}
                          className="doctor-image"
                        />
                      )} */}

                      <div>
                        <h5>{row.name ?? "-"}</h5>
                        <p>{row.designation ?? "-"}</p>
                      </div>
                    </div>
                  ) : header.key === "user" ? (
                    <div className="doctor-info">
                      {row.profileImageParent && (
                        <img
                          src={row.profileImageParent}
                          alt={row.user || ""}
                          className="doctor-image"
                        />
                      )}
                      <h5>{row.user ?? "-"}</h5>
                    </div>
                    ) : header.key === "status" ? (
                      row.status ? (
                        <span
                          className={`status-badge ${row.status.toLowerCase()}`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        "-"
                      )
                    ) : header.key === "action" ? (
                          <DashboardButtons
                          className="appointment_view"
                            text="View Details"
                            icon={<img src={IButton} alt="view" className="btn-icon" />}
                            variant="trashparent"
                            onClick={() => handleViewDetails(row.userId)}
                          />
                    ) : (
                      row[header.key] ?? "-"
                    )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfileTable;
