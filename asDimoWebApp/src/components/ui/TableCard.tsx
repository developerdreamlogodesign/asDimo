import React from "react";
import "./UIstyles.css";
// import PlaceholderImage from "../../assets/Images/PlaceholderImage.svg";

interface TableField {
  label: string;
  path: string;
}

interface TableCardProps {
  title?: string;
  data: Record<string, any>;
  fields?: TableField[];
}

const getNestedValue = (obj: any, path: string) => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const TableCard: React.FC<TableCardProps> = ({
  title,
  data,
  fields = [],
}) => {
  // const profileImage =
  //   getNestedValue(data, "profileImg") || PlaceholderImage;

  // const name = getNestedValue(data, "name") || "-";

  return (
    <div className="table-card">
      {title && <h3>{title}</h3>}

      {/* Profile Row */}
      {/* <div className="table-card-header">
        <img
          src={profileImage}
          alt="Profile"
          className="table-card-profile"
        />

        <div className="table-card-name">
          <h4>{name}</h4>
        </div>
      </div> */}

      {/* Details */}
      {fields.map((field) => (
        <div key={field.path} className="table-card-row">
          <span className="table-card-label">
            {field.label}:
          </span>

          <span className="table-card-value">
            {String(getNestedValue(data, field.path) ?? "-")}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TableCard;