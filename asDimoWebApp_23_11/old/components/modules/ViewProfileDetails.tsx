import React, { useState, useEffect } from "react";
import ProfileField from "../ui/ProfileField";
import { ProfileImageField } from "../ui/ProfileField";
import { Heading2, Heading3 } from "../../components/ui/HeadingPara";
import DashboardButtons from "../ui/Buttons";
import "./ModulesStyles.css";
import TableCard from "../ui/TableCard";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";
import Loader from "../ui/Loaders";
import { filebasename } from "../../api/config";
import ModalBox from "../ui/ModalBox";

interface Props {
  userId?: number | string;
}

interface TableField {
  label: string;
  path: string;
}

const ViewProfileDetails: React.FC<Props> = ({ userId }) => {
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userFlag, setUserFlag] = useState<number | null>(null);
  const [memberList, setMemberList] = useState<any[]>([]);
  const [listTitle, setListTitle] = useState("Organisation List");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zone, setZone] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [id, setId] = useState("");

  const handleImageChange = async (file: File) => {
    try {
      const token = tokenManager.getAccessToken();

      if (!token || !userId) return;

      const formData = new FormData();
      formData.append("profileImg", file);

      const response =
        await authService.updateProfile(
          token,
          id,
          formData
        );

      setProfileImage(
        response?.data?.profileImg ||
        response?.profileImg ||
        ""
      );
    } catch (error) {
      console.error(error);
    }
  };

  const flattenMember = (item: any) => ({
    ...item,
    ...item.userData,
      fullAddress: [
    item.userData?.address,
    item.userData?.city,
    item.userData?.state,
  ]
    .filter(Boolean)
    .join(", ") +
    (item.userData?.pincode
      ? ` - ${item.userData.pincode}`
      : ""),
  });

  const getOrganizationCount = (
    adminId: number | string,
    relatedData: any
  ) => {
    return (
      relatedData?.organizations?.data?.filter(
        (org: any) => org.adminId === adminId
      ).length || 0
    );
  };

  const getTherapistCount = (
    organizationAdminId: number | string,
    relatedData: any
  ) => {
    return (
      relatedData?.teachers?.data?.filter(
        (teacher: any) =>
          teacher.organizationAdminId === organizationAdminId
      ).length || 0
    );
  };

const [showResetModal, setShowResetModal] = useState(false);

  const getFieldsByFlag = (flag: number | null): TableField[] => {
    switch (flag) {
      case 6:
        return [
          { label: "Flag", path: "flag", },
          { label: "Name", path: "name", },
          { label: "Email", path: "email", },
          { label: "Organization Count", path: "organizationCount", },
          { label: "Phone No", path: "phone", },
          { label: "Address", path: "fullAddress", },
        ];

      case 7:
        return [
          { label: "Flag", path: "flag", },
          { label: "Name", path: "name", },
          { label: "Email", path: "email", },
          { label: "Total Therapists", path: "totalTherapists", },
          { label: "Phone No", path: "phone", },
          { label: "Address", path: "fullAddress", },
        ];

        case 3:
        return [
          { label: "Flag", path: "flag", },
          { label: "Name", path: "name", },
          { label: "Phone No", path: "phone", },
          { label: "Email", path: "email", },
          { label: "Address", path: "fullAddress", },
        ];

      default:
        return [
          { label: "Flag", path: "flag", },
          { label: "Name", path: "name", },
          { label: "Email", path: "email", },
        ];
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const token = tokenManager.getAccessToken();

        if (!token) return;
        if (!userId) {
          console.warn("No userId provided");
          return;
        }

        const res = await authService.getUserById(token, userId);

        const user = res?.data || res;
        // console.log("Fetched user data:", user);
        // console.log("Fetched user flag:", user.flag);

        if (!user) return;

        const totalRelatedUsers =
        (user.relatedData?.admins?.count || 0) +
        (user.relatedData?.organizations?.count || 0) +
        (user.relatedData?.teachers?.count || 0) +
        (user.relatedData?.parents?.count || 0);

        setTotalUsers(totalRelatedUsers);

        setName(user.name || "");
        setProfileImage(user.profileImg || "");
        // setRelatedData(user.relatedData || null);
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setUserFlag(user.flag ?? null);
        setCity(user.city || "");
        setState(user.state || "");
        setPincode(user.pincode || "");
        setAddress(user.address || "");
        setCountry(user.country || "");
        setId(user.id || user._id || "");
        // setLastLogin(user.lastLogin || "");

        console.log(user);

        setZone(
          `${user.city || ""}${
            user.state
              ? `, ${user.state}`
              : user.state
              ? `, ${user.state}`
              : ""
          }`
        );

        switch (user.flag) {
          case 6:
            setListTitle("Admin List");
            setMemberList(
              (user.relatedData?.admins?.data || []).map((admin: any) => ({
                ...flattenMember(admin),
                organizationCount: getOrganizationCount(
                  admin.adminId,
                  user.relatedData
                ),
              }))
            );
            break;

          case 7:
            setListTitle("Organization List");
            setMemberList(
              (user.relatedData?.organizations?.data || []).map(
                (organization: any) => ({
                  ...flattenMember(organization),
                  totalTherapists: getTherapistCount(
                    organization.organizationAdminId,
                    user.relatedData
                  ),
                })
              )
            );
            break;

            case 3:
              setListTitle("Patient List");
              setMemberList(
                (user.relatedData?.parents?.data || []).map(
                  (parent: any) => ({
                    ...flattenMember(parent),
                    
                  })
                )
              );
            break;

          default:
            setListTitle("Organization List");
            setMemberList(
              (user.relatedData?.organizations?.data ||
                user.relatedData?.admins?.data ||
                []).map((item: any) => flattenMember(item))
            );
            break;
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);


    const updateField = async (
      field: string,
      value: string
    ) => {
      try {
        const token = tokenManager.getAccessToken();

        if (!token || !userId) return;

        const formData = new FormData();
        formData.append(field, value);

        await authService.updateProfile(
          token,
          id,
          formData
        );

        switch (field) {
          case "name":
            setName(value);
            break;
          case "phone":
            setPhone(value);
            break;
          case "city":
            setCity(value);
            break;
          case "state":
            setState(value);
            break;
          case "address":
            setAddress(value);
            break;
          case "country":
            setCountry(value);
            break;
          case "pincode":
            setPincode(value);
            break;
        }

        console.log(`${field} updated`);
        window.location.reload();
      } catch (error) {
        console.error(error);
      }
    };

    if (loading) {
      return <Loader fullScreen />;
    }


  return (
    <div className="d-flex ViewProfileDetails">
      <div className="Profile_Editable">
        <div className="boxShadow">
          <ProfileImageField profileImage={ profileImage ? `${filebasename}${profileImage}` : "" } userName={name} onImageChange={handleImageChange} />
          <ProfileField label="Profile" value={name} onSave={(value) => updateField("name", value) } />
          <ProfileField label="Email" value={email} editable={false} /> 
          <ProfileField label="Phone" value={phone} onSave={(value) => updateField("phone", value) } />
          <ProfileField label="Zone" value={zone} editable={true} onClick={() => setShowResetModal(true)} />
        </div>

        <div className="boxShadow">
          <div className="d-flex TotalCount">
            <Heading2 text="Total Subscription" />
            <Heading3 text="60" />
          </div>

          <div className="d-flex TotalCount">
            <Heading2 text="Total Users" />
            <Heading3 text={totalUsers.toString()} />
          </div>
        </div>
      </div>

      <div className="ORGList">
        <div className="boxShadow">
          <div className="d-flex OrganisationList">
            <Heading2 text={listTitle} />
            <DashboardButtons
              text="View All"
              variant="greyborder"
            />
          </div>

          {loading ? (
            <div style={{ padding: 12 }}>Loading...</div>
          ) : memberList.length > 0 ? (
            memberList.map((m, idx) => (
              <TableCard
                key={m.userId || m._id || idx}
                data={flattenMember(m)}
                fields={getFieldsByFlag(userFlag)}
              />
            ))
          ) : (
            <div style={{ textAlign: "center"  }}>
              No records found
            </div>
          )}
        </div>
      </div>
      {showResetModal && (
        <ModalBox header={<h3>Zone Details</h3>} onCancel={() => setShowResetModal(false) }
          body={
            <div className="ZoneDetails">
               <ProfileField label="City" value={ city || "" } onSave={(value) => updateField("city", value) } />
               <ProfileField label="State" value={ state || "" } onSave={(value) => updateField("state", value) } />
               <ProfileField label="Pincode" value={ pincode || "" } onSave={(value) => updateField("pincode", value) } />
               <ProfileField label="Address" value={ address || "" } onSave={(value) => updateField("address", value) } />
               <ProfileField label="Country" value={ country || "" } onSave={(value) => updateField("country", value) } />
            </div>
          }
        />
      )}
    </div>
  );
};

export default ViewProfileDetails;