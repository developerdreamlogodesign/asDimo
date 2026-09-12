import React, { useState, useEffect } from "react";
import ProfileField from "../ui/ProfileField";
import { ProfileImageField } from "../ui/ProfileField";
import ModalBox from "../ui/ModalBox";
import "../ui/UIstyles.css";
import { filebasename } from "../../api/config";
import { authService } from "../../services/authService";

interface ProfilePageProps {
  profileData: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  profileData,
}) => {
  const [showResetModal, setShowResetModal] =
    useState(false);

  // const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    profileImg: "",
  });

  useEffect(() => {
    if (profileData?.user) {
      setProfile({
        name: profileData.user.name || "",
        email: profileData.user.email || "",
        phone: profileData.user.phone || "",
        role:
          profileData.user.flag === 0
            ? "Super Admin"
            : profileData.user.flag === 7
            ? "Admin"
            : profileData.user.flag === 6
            ? "Zonal Admin"
            : profileData.user.flag === 1
            ? "Organization Admin"
            : "User",
        profileImg: profileData.user.profileImg
          ? `${filebasename}${profileData.user.profileImg}`
          : "",
      });
    }
  }, [profileData]);

  const updateField = async (
    field: string,
    value: string
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const formData = new FormData();

      formData.append(field, value);

      await authService.updateProfile(
        token,
        profileData.user._id,
        formData
      );

      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));

      console.log(`${field} updated`);
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const updateProfileImage = async (
    file: File
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const formData = new FormData();

      formData.append("profileImg", file);

      const response =
        await authService.updateProfile(
          token,
          profileData.user._id,
          formData
        );

      setProfile((prev) => ({
        ...prev,
        profileImg:
          filebasename +
          response.data.profileImg,
      }));

      console.log("Profile image updated");
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* <ProfileField
          showProfileImage
          profileImage={profile.profileImg}
          onImageChange={updateProfileImage}
          label="Full Name"
          value={profile.name}
          onSave={(value) =>
            updateField("name", value)
          }
        />  */}

        <ProfileImageField
          profileImage={profile.profileImg}
          userName={profile.name}
          onImageChange={updateProfileImage}
        />

        <ProfileField
          label="Full Name"
          value={profile.name}
          onSave={(value) =>
            updateField("name", value)
          }
        />

        <ProfileField
          label="Email"
          value={profile.email}
          // onSave={(value) =>
          //   updateField("email", value)
          // }
          editable={false}
        />

        <ProfileField
          label="Contact"
          value={profile.phone || "-"}
          onSave={(value) =>
            updateField("phone", value)
          }
        />

        <ProfileField
          label="Role"
          value={profile.role}
          editable={false}
        />

        <ProfileField
          label="Password"
          value="******"
          isPassword
          onResetPassword={() =>
            setShowResetModal(true)
          }
        />

        {/* <div className="NotificationToggle d-flex">
          <div className="field-info">
            <label>Notifications</label>
          </div>

          <button
            className={`toggle-btn ${
              notificationsEnabled
                ? "active"
                : ""
            }`}
            onClick={() =>
              setNotificationsEnabled(
                !notificationsEnabled
              )
            }
          >
            <span className="toggle-text">
              {notificationsEnabled
                ? "ON"
                : "OFF"}
            </span>

            <span className="toggle-circle"></span>
          </button>
        </div> */}
      </div>

      {showResetModal && (
        <ModalBox
          header={<h3>Reset Password</h3>}
          onCancel={() =>
            setShowResetModal(false)
          }
          body={
            <div className="reset-password-form">
              <p>
                Reset password form here...
              </p>
            </div>
          }
        />
      )}
    </div>
  );
};

export default ProfilePage;