import React, { useState, useEffect } from "react";
import "./UIstyles.css";
import UploadCameraIcon from "../../assets/Images/UploadCameraIcon.svg";
import DashboardButtons from "./Buttons";
import { RefreshCcwIcon } from "lucide-animated";
import PenIcon from "../../assets/Images/Pen.svg";
import SaveIcon from "../../assets/Images/SaveIcon.svg";

interface ProfileFieldProps {
  label: string;
  value: string;
  onSave?: (value: string) => void;
  // showProfileImage?: boolean;
  editable?: boolean;
  isPassword?: boolean;
  onResetPassword?: () => void;
  onClick?: () => void;
  // profileImage?: string;
  // onImageChange?: (file: File) => void;
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
  // showProfileImage = false,
  editable = true,
  isPassword = false,
  onResetPassword,
  onClick,
  // profileImage,
  // onImageChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fieldValue, setFieldValue] = useState(value);

  // Local uploaded image preview
  // const [uploadedImage, setUploadedImage] = useState("");

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

  // const handleImageUpload = (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = e.target.files?.[0];

  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);
  //     setUploadedImage(imageUrl);
  //   }
  // };

  // const handleImageUpload = (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = e.target.files?.[0];

  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);

  //     setUploadedImage(imageUrl);

  //     onImageChange?.(file);
  //   }
  // };

  // Show uploaded image first, otherwise API image
  // const imageSrc = uploadedImage || profileImage;

  return (
    <>
      {/* {showProfileImage && (
        <div className="profile-image-container">
          {imageSrc ? (
            <img src={imageSrc} alt="Profile" className="profile-image" />
          ) : (
            <div className="profile-placeholder">
              {value?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <label className="upload-image-btn">
            <img src={UploadCameraIcon} alt="Upload" />
            Upload
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
          </label>
        </div>
      )} */}

      <div className="profile-field">
        <div className="field-info">
          <label>{label}</label>

          {isEditing && !isPassword ? (
            <input type="text" value={fieldValue} onChange={(e) => setFieldValue(e.target.value) } />
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