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


const AddInformation: React.FC = () => {
const location = useLocation();
  const navigate = useNavigate();

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

        if (flag === 3) {
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

      const formData = new FormData();
      const submitFlag =
        data.user_scope === "global" && flag === 3
          ? 5
          : data.user_scope === "global" && flag === 2
          ? 4
          : flag;

      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append("city", data.city);
      formData.append("state", data.State);
      formData.append("pincode", data.zipcode);
      formData.append("country", data.country);
      formData.append("flag", String(submitFlag));

      if (flag === 3) {
        formData.append("therapist_category", data.therapist_category);
      }

      if (data.profileImage) {
        formData.append("profileImg", data.profileImage);
      }

      if (flag === 6) {
        formData.append("superAdminId", "1");
      }

      if (flag === 7) {
        formData.append("zonalAdminId", data.zonalAdminId);
      }

      if (flag === 1) {
        formData.append("adminId", data.adminId);
        formData.append(
          "organization_type",
          String(data.organization_type)
        );
      }

      if (submitFlag === 5) {
        formData.append("adminId", data.adminId);
      }
      if (flag === 4) {
        formData.append("teacherId", "null");
      }
      if (flag === 3) {
        if (data.organizationAdminId) {
          formData.append(
            "organizationAdminId",
            data.organizationAdminId
          );
        }
      }

      if (flag === 2) {
        if (data.teacherId) {
          formData.append(
            "teacherId",
            data.teacherId
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
          {
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
    {
      name: "zonalAdminId",
      label: "Under Zonal Admin",
      fieldType: "select" as const,
      width: "full" as const,
      options: zonalAdminOptions,
      required: true,
    },
    ]
: [3].includes(flag)
  ? [
      {
        name: "therapist_category",
        label: "Therapist Category",
        fieldType: "select" as const,
        width: "full" as const,
        placeholder: "Select Therapist Category",
        options: [
          { label: "Psychologist", value: "Psychologist" },
          { label: "Speech Therapist", value: "Speech Therapist" },
          { label: "Special Educator", value: "Special Educator" },
          { label: "Operational Therapist", value: "Operational Therapist" },
        ],
        required: true,
      },
      {
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
      {
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
      {
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
