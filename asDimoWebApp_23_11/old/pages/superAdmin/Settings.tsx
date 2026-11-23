import React, { useEffect, useState } from "react";
import { Heading1 } from "../../components/ui/HeadingPara";
import Tabs from "../../components/ui/Tabs";
import ProfileUpdate from "../../components/modules/ProfileUpdate";
import Loader from "../../components/ui/Loaders";
import { authService } from "../../services/authService";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";


const CustomerDocuments: React.FC = () => {
  const role = getCurrentUserRole();  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("TOKEN NOT FOUND");
          return;
        }

        const response = await authService.getProfile(token);

        setProfileData(response.data);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


const tabsData: {
  label: string;
  content: React.ReactNode;
}[] = [
  {
    label: "General",
    content: loading ? (
      <Loader />
    ) : (
      <ProfileUpdate profileData={profileData} />
    ),
  },
];

if (role === "SuperAdmin") {
  tabsData.push({
    label: "Edit Billing Plans",
    content: <div>Edit Billing Plans Content</div>,
  });
};

  return (
    <div className="CustomerDocuments">
      <Heading1 text="Settings" />
      <Tabs tabs={tabsData} variant="LeftSide" />
    </div>
  );
};

export default CustomerDocuments;