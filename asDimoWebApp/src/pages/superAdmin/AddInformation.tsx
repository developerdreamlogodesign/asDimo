import React, { useEffect, useState } from "react";

import { Heading1, Paragraph } from "../../components/ui/HeadingPara";
import type { Field } from "../../components/ui/FormAdd";
import FormAdd from "../../components/ui/FormAdd";
import { authService } from "../../services/authService";
import { useLocation, useNavigate } from "react-router-dom";
import { countries } from "../../components/ui/countries";
import DashboardButtons from "../../components/ui/Buttons";
import { routes } from "../../routes/AppRoutes";
import { ArrowLeftIcon } from "lucide-animated";
import { tokenManager } from "../../services/tokenManager";


const AddInformation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = tokenManager.getUser();
  const currentLoginFlag =
    currentUser?.flag !== undefined && currentUser?.flag !== null
      ? Number(currentUser.flag)
      : null;
  const currentUserName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "";
  const currentUserId = currentUser?.userId ? String(currentUser.userId) : "";
  const currentUserOrgName =
    currentUser?.org_name ||
    currentUser?.organization?.name ||
    currentUser?.organizationName ||
    currentUserName;

  const flag = Number(location.state?.flag);
  const [adminOptions, setAdminOptions] = useState<Field["options"]>([]);
  const [zonalAdminOptions, setZonalAdminOptions] =
    useState<Field["options"]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Field["options"]>([]);
  const [therapistOptions, settherapistOptions] = useState<Field["options"]>([]);

  // console.log("Flag in AddNewAdminorg:", flag);

  useEffect(() => {
    let isMounted = true;

    const formatUserOptions = (users: any[]) =>
      users.map((user) => ({
        label: user.email ? `${user.name} (${user.email})` : user.name,
        value: String(user.userId),
      }));

    const fetchSelectOptions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No token found");
        }

        if (flag === 7) {
          const response = await authService.getUsersByFlag(token, 6);

          if (isMounted) {
            setZonalAdminOptions(formatUserOptions(response.data));
          }
        }

        if (flag === 1) {
          const response = await authService.getUsersByFlag(token, 7);

          if (isMounted) {
            setAdminOptions(formatUserOptions(response.data));
          }
        }

        if (flag === 3 || flag === 5) {
          const [organizationResponse, adminResponse] = await Promise.all([
            authService.getUsersByFlag(token, 1),
            authService.getUsersByFlag(token, 7),
          ]);

          if (isMounted) {
            setOrganizationOptions(formatUserOptions(organizationResponse.data));
            setAdminOptions(formatUserOptions(adminResponse.data));
          }
        }

        if (flag === 2) {
          const response = await authService.getUsersByFlag(token, 3);

          if (isMounted) {
            settherapistOptions(formatUserOptions(response.data));
          }
        }
      } catch (error) {
        console.error("Error fetching select options:", error);

        if (isMounted) {
          setAdminOptions([]);
          setZonalAdminOptions([]);
          setOrganizationOptions([]);
          settherapistOptions([]);
        }
      }
    };

    fetchSelectOptions();

    return () => {
      isMounted = false;
    };
  }, [flag]);

  const getHeading = (flag: number) => {
    switch (flag) {
      case 6:
        return "Zonal Admin Information";
      case 7:
        return "Admin Information";
      case 1:
        return "Organization Admin Information";
      case 3:
      case 5:
        return "Therapist Information";
      case 2:
        return "Parent Information";
      default:
        return "User Information";
    }
  };


const getPageConfig = (flag: number) => {
  switch (flag) {
    case 6:
      return {
        route: routes.SUP_ZONALADMIN,
        text: "Back To Zonal Admin",
      };

    case 7:
      return {
        route: routes.SUP_ADMIN,
        text: "Back To Admin",
      };

     case 1:
      return {
        route: routes.SUP_ORGANIZATION,
        text: "Back To Organization",
    };  

     case 3:
     case 5:
      return {
        route: routes.SUP_THERAPIST,
        text: "Back To Therapist",
    };  

     case 2:
      return {
        route: routes.SUP_PARENT,
        text: "Back To Parent",
    };  

    default:
      return {
        route: routes.SUP_PARENT,
        text: "Back To Parent",
      };
  }
};
const pageConfig = getPageConfig(flag);

  const getSucHeading = (flag: number) => {
    switch (flag) {
      case 6:
        return "Zonal Admin";
      case 7:
        return "Admin";
      case 1:
        return "Organization Admin";
      case 3:
      case 5:
        return "Therapist";
      case 2:
        return "Parent";
      default:
        return "User";
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No token found");
      }

      // console.log(".................",data);
      // console.log("image---------------",data.profileImg);

      // const payload = {
      //   name: data.name,
      //   email: data.email,
      //   phone: data.phone,
      //   address: data.address,
      //   city: data.city,
      //   state: data.State,
      //   pincode: data.zipcode,
      //   country: data.country,
      //   flag,

      //   ...(flag === 6 && {
      //     superAdminId: 1,
      //   }),

      //   ...(flag === 7 && {
      //     zonalAdminId: data.zonalAdminId,
      //   }),

      //   ...(flag === 1 && {
      //     adminId: data.adminId,
      //     organization_type: Number(
      //       data.organization_type
      //     ),
      //   }),

      //   ...(flag === 3 && {
      //     organizationAdminId:
      //       data.organizationAdminId,
      //   }),

      //   ...(flag === 2 && {
      //     teacherId: data.teacherId,
      //   }),
      // };

      // await authService.register(
      //   token,
      //   payload
      // );

      const userScope =
        currentLoginFlag === 1 || currentLoginFlag === 5 || currentLoginFlag === 3
          ? "non_global"
          : data.user_scope;

      const submitFlag =
        userScope === "global" && (flag === 3 || flag === 5)
          ? 5
          : userScope === "global" && flag === 2
          ? 4
          : flag;

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append("city", data.city);
      formData.append("state", data.State);
      formData.append("pincode", data.zipcode);
      formData.append("country", data.country);
      formData.append("flag", String(submitFlag));

      if (flag === 3 || flag === 5 || submitFlag === 3 || submitFlag === 5) {
        formData.append("therapist_category", data.therapist_category);
        formData.append("specialization", data.therapist_category);
        formData.append("gender", data.gender ?? "");
        formData.append(
          "fees",
          data.fees !== undefined && data.fees !== null ? String(data.fees) : ""
        );
        formData.append(
          "about_doctor",
          data.about_doctor ?? data.about ?? ""
        );
        formData.append(
          "qualifications",
          data.qualifications ?? data.qualification ?? ""
        );

        const selectedLanguages = Array.isArray(data.languages)
          ? data.languages
          : typeof data.languages === "string"
            ? data.languages
                .split(",")
                .map((language: string) => language.trim())
                .filter(Boolean)
            : [];

        selectedLanguages.forEach((language: string) => {
          formData.append("languages", language);
        });

        if (data.yearsOfExperience !== undefined && data.yearsOfExperience !== null && data.yearsOfExperience !== "") {
          formData.append("yearsOfExperience", String(data.yearsOfExperience));
        }

        if (userScope === "global" && data.cliniqueName) {
          formData.append("cliniqueName", data.cliniqueName);
        }
      }

      if (data.profileImage) {
        formData.append("profileImg", data.profileImage);
      }

      if (flag === 6) {
        formData.append("superAdminId", "1");
      }

      if (flag === 7) {
        const zonalId = currentLoginFlag === 6 ? currentUserId : data.zonalAdminId;
        if (zonalId) {
          formData.append("zonalAdminId", String(zonalId));
        }
      }

      if (flag === 1) {
        const admId = currentLoginFlag === 7 ? currentUserId : data.adminId;
        if (admId) {
          formData.append("adminId", String(admId));
        }
        formData.append(
          "organization_type",
          String(data.organization_type)
        );
      }

      if (submitFlag === 5) {
        const admId = currentLoginFlag === 7 ? currentUserId : data.adminId;
        if (admId) {
          formData.append("adminId", String(admId));
        }
      }
      if (flag === 4) {
        formData.append("teacherId", "null");
      }
      if (flag === 3 || flag === 5 || submitFlag === 3 || submitFlag === 5) {
        const orgAdminId =
          currentLoginFlag === 1 || currentLoginFlag === 5
            ? currentUserId
            : data.organizationAdminId;
        if (orgAdminId) {
          formData.append(
            "organizationAdminId",
            String(orgAdminId)
          );
        }
      }

      if (flag === 2) {
        const tId = currentLoginFlag === 3 ? currentUserId : data.teacherId;
        if (tId) {
          formData.append(
            "teacherId",
            String(tId)
          );
        }
      }

      // for (const pair of formData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      await authService.register(token, formData);

      // alert("User created successfully");
      window.location.reload();

      navigate(-1);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          "Failed to create user"
      );
    }
  };


  const fields: Field[] = [
    { name: "name", label: "Full Name", placeholder: "Enter Full Name", required: true, },
    { name: "email", label: "Email Address", type: "email", placeholder: "Enter Email Address", required: true, },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter Phone Number", width: "half", required: true, },
    { name: "role", label: "Role", type: "text", value: `${getSucHeading(flag)}`, width: "half", readOnly: true,},
    ...(flag === 1
      ? [
          {
            name: "organization_type",
            label: "Organization Type",
            fieldType: "select" as const,
            width: "half" as const,
            options: [
              {
                label: "Clinic",
                value: "0",
              },
              {
                label: "School",
                value: "1",
              },
            ],
            required: true,
          },
          currentLoginFlag === 7
            ? {
                name: "adminId",
                label: "Under Admin",
                type: "text",
                width: "half" as const,
                value: currentUserName,
                readOnly: true,
                required: true,
              }
            : {
                name: "adminId",
                label: "Under Admin",
                fieldType: "select" as const,
                width: "half" as const,
                options: adminOptions,
                required: true,
              },
            ]
          : []),


...(flag === 7
  ? [
    currentLoginFlag === 6
      ? {
          name: "zonalAdminId",
          label: "Under Zonal Admin",
          type: "text",
          width: "full" as const,
          value: currentUserName,
          readOnly: true,
          required: true,
        }
      : {
          name: "zonalAdminId",
          label: "Under Zonal Admin",
          fieldType: "select" as const,
          width: "full" as const,
          options: zonalAdminOptions,
          required: true,
        },
    ]
: [3, 5].includes(flag)
  ? [
      {
        name: "therapist_category",
        label: "Specialization",
        fieldType: "select" as const,
        width: "full" as const,
        placeholder: "Select Therapist Category",
        options: [
          { label: "Psychologist", value: "Psychologist" },
          { label: "Speech Therapist", value: "speech therapist" },
          { label: "Special Educator", value: "special educator" },

          { label: "Operational Therapist", value: "operational therapist" },
          { label: "Special Package", value: "special package" },
        ],
        required: true,
      },
      {
        name: "languages",
        label: "Languages",
        fieldType: "checkbox" as const,
        width: "half" as const,
        placeholder: "Select Languages",
        options: [
          { label: "English", value: "English" },
          { label: "Hindi", value: "Hindi" },
          { label: "Marathi", value: "Marathi" },
          { label: "Gujarati", value: "Gujarati" },
          { label: "Tamil", value: "Tamil" },
          { label: "Telugu", value: "Telugu" },
          { label: "Bengali", value: "Bengali" },
          { label: "Kannada", value: "Kannada" },
          { label: "Malayalam", value: "Malayalam" },
        ],
        required: true,
      },
      {
        name: "yearsOfExperience",
        label: "Experience (Years)",
        type: "number",
        placeholder: "Enter Years of Experience",
        width: "half" as const,
        required: true,
      },
      {
        name: "qualifications",
        label: "Qualification",
        type: "input",
        placeholder: "Enter Years of Experience",
        width: "half" as const,
        required: true,
      },
      {
        name: "gender",
        label: "Gender",
        width: "half" as const,
        fieldType: "select" as const,
        options: [
          { label: "Male", value: "Male" },
          { label: "Female", value: "Female" },
          { label: "Others", value: "Other" },

        ],
        required: true,
      },
      {
        name: "fees",
        label: "Fees",
        type: "number",
        placeholder: "Enter fees",
        required: true,
      },
      {
        name: "about_doctor",
        label: "About Doctor",
        type: "text",
        placeholder: "Enter About Doctor",
        required: false,
      },
      currentLoginFlag === 1 || currentLoginFlag === 5 || currentLoginFlag === 3
        ? {
            name: "user_scope",
            label: "User Type",
            fieldType: "select" as const,
            width: "full" as const,
            options: [
              {
                label: "Non-Global",
                value: "non_global",
              },
            ],
            value: "non_global",
            readOnly: true,
            required: true,
          }
        : {
            name: "user_scope",
            label: "User Type",
            fieldType: "select" as const,
            width: "full" as const,
            placeholder: "",
            options: [
              {
                label: "Global",
                value: "global",
              },
              {
                label: "Non-Global",
                value: "non_global",
              },
            ],
            required: true,
          },
      {
        name: "cliniqueName",
        label: "Clinic Name",
        placeholder: "Enter Clinic Name",
        showWhen: {
          field: "user_scope",
          value: "global",
        },
        required: true,
      },
      currentLoginFlag === 1 || currentLoginFlag === 5
        ? {
            name: "organizationAdminId",
            label: "Organization Name",
            type: "text",
            width: "full" as const,
            value: currentUserOrgName,
            readOnly: true,
            showWhen: {
              field: "user_scope",
              value: "non_global",
            },
            required: true,
          }
        : {
            name: "organizationAdminId",
            label: "Organization Name",
            fieldType: "select" as const,
            width: "full" as const,
            placeholder: "Select Organization",
            options: organizationOptions,
            showWhen: {
              field: "user_scope",
              value: "non_global",
            },
            required: true,
          },
      currentLoginFlag === 7
        ? {
            name: "adminId",
            label: "Admin Name",
            type: "text",
            width: "full" as const,
            value: currentUserName,
            readOnly: true,
            showWhen: {
              field: "user_scope",
              value: "global",
            },
            required: true,
          }
        : {
            name: "adminId",
            label: "Admin Name",
            fieldType: "select" as const,
            width: "full" as const,
            placeholder: "Select Admin",
            options: adminOptions,
            showWhen: {
              field: "user_scope",
              value: "global",
            },
            required: true,
          },
    ]
: [2].includes(flag)
  ? [
      currentLoginFlag === 1 || currentLoginFlag === 5 || currentLoginFlag === 3
        ? {
            name: "user_scope",
            label: "User Type",
            fieldType: "select" as const,
            width: "full" as const,
            options: [
              {
                label: "Non-Global",
                value: "non_global",
              },
            ],
            value: "non_global",
            readOnly: true,
            required: true,
          }
        : {
            name: "user_scope",
            label: "User Type",
            fieldType: "select" as const,
            width: "full" as const,
            placeholder: "",
            options: [
              {
                label: "Global",
                value: "global",
              },
              {
                label: "Non-Global",
                value: "non_global",
              },
            ],
            required: true,
          },
      currentLoginFlag === 3
        ? {
            name: "teacherId",
            label: "Therapist Name",
            type: "text",
            width: "full" as const,
            value: currentUserName,
            readOnly: true,
            showWhen: {
              field: "user_scope",
              value: "non_global",
            },
            required: true,
          } 
          
        : {
            name: "teacherId",
            label: "Therapist Name",
            fieldType: "select" as const,
            width: "full" as const,
            placeholder: "Select Therapist",
            options: therapistOptions,
            showWhen: {
              field: "user_scope",
              value: "non_global",
            },
            required: true,
          },
    ]
  :  []),

    { name: "address", label: "Address Information", type: "text", placeholder: "Enter Full Address", required: true, },
    { name: "city", label: "City", placeholder: "Enter City", width: "quarter", required: true, },
    { name: "State", label: "State / Province", placeholder: "Enter State / Province", width: "quarter", required: true, },
    { name: "zipcode", label: "Zip Code", placeholder: "Enter Zip Code", width: "quarter", required: true, },
    { name: "country", label: "Country", fieldType: "select", width: "quarter", options: countries, required: true, },
  ];

  return (
    <>
    <div className="d-flex">
        <div className="AddInfoWordWrap">
            <Heading1 text={getHeading(flag)} />
            <Paragraph text={ <> Dashboard <span>&gt;</span> {getSucHeading(flag)}{" "} <span>&gt;</span> {getHeading(flag)} </> } />
        </div>
        <div className="BacktoListButton"> <DashboardButtons text={pageConfig.text} onClick={() => navigate(pageConfig.route)} icon={<ArrowLeftIcon size={18} />} />
        </div>
    </div>



    <div className="boxShadow AddInformation">
        {/* <AddNewAdminorg/> */}
    <FormAdd
      heading={getHeading(flag)}
      showProfilePicture={true}
      fields={fields}
      onSubmit={handleSubmit}
    />
    </div>
    </>
  );
};

export default AddInformation;
