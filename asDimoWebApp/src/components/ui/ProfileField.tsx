import React, { useState, useEffect } from "react";
import "./UIstyles.css";
import UploadCameraIcon from "../../assets/Images/UploadCameraIcon.svg";
import DashboardButtons from "./Buttons";
import { RefreshCcwIcon } from "lucide-animated";
import PenIcon from "../../assets/Images/Pen.svg";
import SaveIcon from "../../assets/Images/SaveIcon.svg";

interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}



interface ProfileFieldProps {
  label: string;
  value: string;
  onSave?: (value: string) => void;
  editable?: boolean;
  isPassword?: boolean;
  onResetPassword?: () => void;
  onClick?: () => void;
  isDropdown?: boolean;
  options?: DropdownOption[];
}

export const ProfileImageField: React.FC<{
  profileImage?: string;
  userName?: string;
  onImageChange?: (file: File) => void;
}> = ({ profileImage, userName, onImageChange }) => {
  const [uploadedImage, setUploadedImage] = useState("");

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);

      setUploadedImage(imageUrl);
      onImageChange?.(file);
    }
  };

  const imageSrc = uploadedImage || profileImage;

  return (
    <div className="profile-image-container">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Profile"
          className="profile-image"
        />
      ) : (
        <div className="profile-placeholder">
          {userName?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}

      <label className="upload-image-btn">
        <img src={UploadCameraIcon} alt="Upload" />
        Upload
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />
      </label>
    </div>
  );

};


const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  onSave,
  editable = true,
  isPassword = false,
  onResetPassword,
  onClick,
  isDropdown = false,
  options = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);

  // Update field value whenever API data changes
  useEffect(() => {
    setFieldValue(value);
  }, [value]);

  const handleAction = () => {
    if (isEditing) {
      onSave?.(fieldValue);
    }

    setIsEditing(!isEditing);
  };

  return (
    <>
      <div className="profile-field">
        <div className="field-info">
          <label>{label}</label>

        {isEditing && !isPassword ? (
          isDropdown ? (
            <select
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
            >
              <option value="">Select {label}</option>

              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={option.disabled ? "disabled-option" : ""}
                >
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
            />
          )
        ) : (
          <p>{fieldValue || "-"}</p>
        )}

        </div>

          {isPassword ? (
            <DashboardButtons
              text="Reset Password"
              onClick={onResetPassword}
              variant="greyborder"
              icon={<RefreshCcwIcon size={17} className="btn-icon" />}
              className="resetbtn"
            />
          ) : editable && label !== "Zone" ? (
            <DashboardButtons
              text={isEditing ? "Save" : "Edit"}
              onClick={handleAction}
              variant="greyborder"
              icon={
                isEditing ? (
                  <img src={SaveIcon} alt="Save" className="btn-icon" />
                ) : (
                  <img src={PenIcon} alt="Edit" className="btn-icon" />
                )
              }
            />
          ) : label === "Zone" ? (
              <DashboardButtons text="Details" icon={<img src={PenIcon} alt="Save" className="btn-icon" />} onClick={onClick} variant="greyborder" />
          ) : null}         
      </div>
    </>
  );
};

export default ProfileField;


// SaveIcon