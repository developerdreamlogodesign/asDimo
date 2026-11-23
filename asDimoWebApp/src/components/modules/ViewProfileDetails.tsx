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
  const [therapistCategory, setTherapistCategory] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [languages, setLanguages] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [id, setId] = useState("");
  const [assignmemberList, setASMemberList] = useState<any[]>([]);
  const [aslistTitle, setASListTitle] = useState("Assigned to Zonal Admin");
  const [selectedAdminName, setSelectedAdminName] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  // const [adminName, setadminName] = useState("");

  const fetchAssignedMembers = async (
  flag: number,
  currentUserZonalAdminId?: number
) => {
  try {
    const token = tokenManager.getAccessToken();

    if (!token) return;

    let targetFlag: number | null = null;

    if (flag === 7) {
      // Admin -> show Zonal Admins
      targetFlag = 6;
      setASListTitle("Assigned to Zonal Admin");
    } else if (flag === 1) {
      // Organization Admin -> show Admins
      targetFlag = 7;
      setASListTitle("Assigned to Admin");
    } else if (flag === 3) {
      // Zonal Admin -> show Organization Admins
      targetFlag = 1;
      setASListTitle("Assigned to Organization Admin");
    } else {
      setASMemberList([]);
      return;
    }

    const response = await authService.getUsersByFlag(
      token,
      targetFlag
    );

    let users = response?.data || [];

    // Organization Admin:
    // Only show admins belonging to the same Zonal Admin
    if (flag === 1) {
      users = users.filter(
        (admin: any) =>
          admin?.roleData?.zonalAdminId === currentUserZonalAdminId
      );
    }

    setASMemberList(users);
  } catch (error) {
    console.error(
      "Failed to load assigned members:",
      error
    );

    setASMemberList([]);
  }
};

const handleAssignedUserSave = async (
  selectedUserId: number | string
) => {
  try {
    const token = tokenManager.getAccessToken();

    if (!token) {
      console.error("Authentication token not found");
      return;
    }

    if (!id) {
      console.error("Current user ID not found");
      return;
    }

    if (!selectedUserId) {
      console.error("Please select a user");
      return;
    }

    // Only Admin (7) and Organization Admin (1)
    if (userFlag !== 7 && userFlag !== 1) {
      return;
    }
    // console.log("........id",userId);
    const payload = {
      flag: userFlag,
      userId: Number(userId),
      updatedUserId: Number(selectedUserId),
    };

    console.log("updateUserRelation payload:", payload);

    const response = await authService.updateUserRelation(
      token,
      payload
    );

    console.log(
      "User relation updated successfully:",
      response
    );

    window.location.reload();
  } catch (error) {
    console.error(
      "Failed to update user relation:",
      error
    );
  }
};

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
        // console.log("Fetched user flag:", user.flag);
        // console.log("Fetched user data:", user);


        if (user.flag == 7) {
          // Admin -> Assigned to Zonal Admin
          setSelectedAdminName(
            user.relatedData?.zonalAdmin?.userData?.name ||
            user.relatedData?.zonalAdmin?.userDataname ||
            user.relatedData?.zonalAdmin?.name ||
            ""
          );
          setSelectedAdminId(
            user.relatedData?.zonalAdmin?.userData?.userId ||
            user.relatedData?.zonalAdmin?.userId ||
            user.roleData?.zonalAdminId ||
            ""
          );
        } else if (user.flag == 3) {
          setSelectedAdminName(
            user.relatedData?.organizations?.userData?.name ||
            user.relatedData?.organization?.userData?.name ||
            user.relatedData?.organizations?.name ||
            user.relatedData?.organization?.name ||
            ""
          );
          setSelectedAdminId(
            user.relatedData?.organizations?.userData?.userId ||
            user.relatedData?.organization?.userData?.userId ||
            user.relatedData?.organizations?.userId ||
            user.relatedData?.organization?.userId ||
            ""
          );
        } else {
          setSelectedAdminName(
            user.relatedData?.Admin?.userData?.name ||
            user.relatedData?.admin?.userData?.name ||
            user.relatedData?.Admin?.name ||
            user.relatedData?.admin?.name ||
            ""
          );
          setSelectedAdminId(
            user.relatedData?.Admin?.userData?.userId ||
            user.relatedData?.admin?.userData?.userId ||
            user.relatedData?.Admin?.userId ||
            user.relatedData?.admin?.userId ||
            ""
          );
        }

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

        const teacherDetails = user.roleData || {};

        setTherapistCategory(teacherDetails.therapist_category || "");

        setYearsOfExperience(
          teacherDetails.yearsOfExperience !== undefined &&
          teacherDetails.yearsOfExperience !== null
            ? String(teacherDetails.yearsOfExperience)
            : ""
        );

        setLanguages(
          Array.isArray(teacherDetails.languages)
            ? teacherDetails.languages.join(", ")
            : teacherDetails.languages || ""
        );

        setClinicName(teacherDetails.cliniqueName || "");

        // setId(user.userId || user.id || user._id || "");
        setId(user._id || "");

        await fetchAssignedMembers(
          user.flag,
          user.roleData?.zonalAdminId ||
          user.relatedData?.zonalAdmin?.userData?.userId ||
          user.relatedData?.zonalAdmin?.userId
        );

        // console.log(user);
        // console.log("zonalAdminIdzonalAdminId",zonalAdminId);

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
            setASListTitle("Assigned to Zonal Admin");
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
              setASListTitle("Assigned to Organization");
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
            setASListTitle("Assigned to Admin");
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
      value: string | string[]
    ) => {
      try {
        const token = tokenManager.getAccessToken();

        if (!token || !userId) return;

        const formData = new FormData();

        if (field === "languages") {
          const languageList = Array.isArray(value)
            ? value
            : String(value)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);

          languageList.forEach((language) => formData.append(field, language));
        } else {
          formData.append(field, String(value));
        }

        await authService.updateProfile(
          token,
          id,
          formData
        );

        switch (field) {
          case "name":
            setName(String(value));
            break;
          case "phone":
            setPhone(String(value));
            break;
          case "city":
            setCity(String(value));
            break;
          case "state":
            setState(String(value));
            break;
          case "address":
            setAddress(String(value));
            break;
          case "country":
            setCountry(String(value));
            break;
          case "pincode":
            setPincode(String(value));
            break;
          case "yearsOfExperience":
            setYearsOfExperience(String(value));
            break;
          case "languages":
            setLanguages(Array.isArray(value) ? value.join(", ") : String(value));
            break;
          case "cliniqueName":
            setClinicName(String(value));
            break;
          case "therapist_category":
            setTherapistCategory(String(value));
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

    const therapistCategoryOptions = [
      { label: "Psychologist", value: "Psychologist" },
      { label: "Speech Therapist", value: "speech therapist" },
      { label: "Special Educator", value: "special educator" },
      { label: "Operational Therapist", value: "operational therapist" },
    ];

    const languageOptions = [
      { label: "English", value: "English" },
      { label: "Hindi", value: "Hindi" },
      { label: "Marathi", value: "Marathi" },
      { label: "Gujarati", value: "Gujarati" },
      { label: "Tamil", value: "Tamil" },
      { label: "Telugu", value: "Telugu" },
      { label: "Bengali", value: "Bengali" },
      { label: "Kannada", value: "Kannada" },
      { label: "Malayalam", value: "Malayalam" },
    ];


  return (
    <div className="d-flex ViewProfileDetails">
      <div className="Profile_Editable">
        <div className="boxShadow">
          <ProfileImageField profileImage={ profileImage ? `${filebasename}${profileImage}` : "" } userName={name} onImageChange={handleImageChange} />
          <ProfileField label="Profile" value={name} onSave={(value) => updateField("name", value) } />
          <ProfileField label="Email" value={email} editable={false} /> 
          <ProfileField label="Phone" value={phone} onSave={(value) => updateField("phone", value) } />

          {(userFlag === 3 || userFlag === 5) && (
            <>
              <ProfileField
                label="Therapist Category"
                value={therapistCategory}
                isDropdown
                options={therapistCategoryOptions}
                onSave={(value) =>
                  updateField("therapist_category", value)
                }
                // editable={false}
              />

              <ProfileField
                label="Years of Experience"
                value={yearsOfExperience}
                onSave={(value) =>
                  updateField("yearsOfExperience", value)
                }
                // editable={false}
              />

              <ProfileField
                label="Languages"
                value={languages}
                isDropdown
                multiple
                options={languageOptions}
                onSave={(value) =>
                  updateField("languages", value)
                }
                // editable={false}
              />

              {/* Clinic Name should ONLY show for Flag 5 */}
              {userFlag === 5 && (
                <ProfileField
                  label="Clinic Name"
                  value={clinicName}
                  onSave={(value) =>
                    updateField("cliniqueName", value)
                  }
                  // editable={false}
                />
              )}
            </>
          )}

          <ProfileField label="Zone" value={zone} editable={true} onClick={() => setShowResetModal(true)} />
          {/* {userFlag !== 6 && (
            <ProfileField
              label={aslistTitle}
              value="Dropdwon Value"
              isDropdown
              // options={assignmemberList.map((assignmember: any) => ({
              //   label: assignmember.name,
              //   value: assignmember.userId,
              // }))}
              onSave={(value) => console.log(value)}
            />
          )} */}

          {(userFlag === 7 || userFlag === 1 || userFlag === 3) && (
              <ProfileField
                label={aslistTitle}
                value={selectedAdminName || "Select"}
                isDropdown
                options={assignmemberList.map((assignmember: any) => ({
                  label: assignmember.name,
                  value: assignmember.userId,
                  disabled: String(assignmember.userId) === String(selectedAdminId),
                }))}
                onSave={(value) => {
                   handleAssignedUserSave(value);
                }}
              />
            )}
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