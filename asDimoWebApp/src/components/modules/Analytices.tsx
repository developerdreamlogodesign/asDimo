import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading4 } from "../ui/HeadingPara.tsx";

import DashboardButtons from "../ui/Buttons.tsx";
import { ArrowRightIcon } from "lucide-animated";
import { authService } from "../../services/authService";
import { tokenManager } from "../../services/tokenManager";
import AnalyticesCard from "./Analytices/AnalyticesCards.tsx";
// import SubscriptionAnalytics from "./Analytices/Subscriptiongraph.tsx";
// import Appointmentgraph from "./Analytices/Appointmentgraph.tsx";
// import SellReportGraph from "./Analytices/SellReportGraph.tsx";
import ZonalAdminTable from "./Analytices/ZonalAdminTable.tsx";
import AppointmentTable from "./Analytices/AppointmentTable.tsx";
// import DoctorListCard from "./Analytices/DoctorListCard.tsx";
import { filebasename } from "../../api/config";
import { routes } from "../../routes/AppRoutes";
// import Loader from "../ui/Loaders";


interface ZonalAdminRow {
  zonaladminname: string;
  location: string;
  numberadmins: number;
  numberorganizations: number;
  numberParents: number;
  numberAppointments: number;
  numbertherapists: number;
  numbersubscriptions: number;
  numberpes: number;
  userId: string | number;
}

const relatedDataKeyByLoginFlag: Record<number, string> = {
  6: "admins",
  7: "organizations",
  1: "teachers",
  3: "parents",
  5: "teachers",
};

const countTeacherAppointments = (
  appointments: any[],
  teacherUserId: string | number | undefined
) => {
  if (teacherUserId === undefined) return 0;

  return appointments.filter(
    (appointment: any) =>
      String(appointment?.teacherUser?.userId) === String(teacherUserId)
  ).length;
};


const countRelatedRecords = (items: any[], field: string, value: string | number | undefined) =>
  
  value === undefined ? 0 : items.filter((item: any) => item?.[field] === value).length;

const getRelatedCount = (relatedData: any, key: string) =>
  relatedData?.[key]?.count ?? relatedData?.[key]?.data?.length ?? 0;

const hasSameUserId = (firstId: string | number | undefined, secondId: string | number | undefined) =>
  firstId !== undefined && secondId !== undefined && String(firstId) === String(secondId);

const getDashboardRoutes = (flag: number) => {
  switch (flag) {
    case 6:
      return { appointment: routes.ZONAL_APPOINTMENT, list: routes.ZONAL_ADMIN };
    case 7:
      return { appointment: routes.ADMIN_APPOINTMENT, list: routes.ADMIN_ORGANIZATION };
    case 1:
      return { appointment: routes.ORGANIZATIONADMIN_APPOINTMENT, list: routes.ORGANIZATIONADMIN_THERAPIST };
    case 3:
    case 5:
      return { appointment: routes.THERAPIST_APPOINTMENT, list: routes.THERAPIST_PARENT };
    case 0:
    default:
      return { appointment: routes.SUP_APPOINTMENT, list: routes.SUP_ZONALADMIN };
  }
};

interface DoctorRow {
  id: number | string;
  profileImage?: string;
  name: string;
  designation: string;
}

interface AppointmentRow {
  id: string;
  profileImage?: string;
  profileImageParent?: string;
  user: string;
  doctor: string;
  admin: string;
  name: string;
  designation: string;
  date: string;
  time: string;
  status: string;
}

interface UserCounts {
  organizationAdmin: number;
  parent: number;
  therapist: number;
  zonalAdmin: number;
  admin: number;
  totalAppointments: number;
}

const DashboardAnalyticsIndex: React.FC = () => {
  const [zonalAdminRows, setZonalAdminRows] = useState<ZonalAdminRow[]>([]);
  // const [doctorRows, setDoctorRows] = useState<DoctorRow[]>([]);
  const [, setDoctorRows] = useState<DoctorRow[]>([]);
  const [appointmentRows, setAppointmentRows] = useState<AppointmentRow[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({
    organizationAdmin: 0,
    parent: 0,
    therapist: 0,
    zonalAdmin: 0,
    admin: 0,
    totalAppointments: 0,
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = tokenManager.getAccessToken();

      if (!token) {
        console.error("No access token found");
        return;
      }

      setLoading(true);

      try {
        const currentUser = tokenManager.getUser();

        const [zonalResponse, doctorFlag3Response, doctorFlag5Response, appointmentsResponse, userCountsResponse] =
          await Promise.all([
            // Super admins see every zonal admin. Other roles see only the
            // records related to their own user id.
            Number(currentUser?.flag) === 0
              ? authService.getUsersByFlag(token, 6)
              : authService.getUserById(token, currentUser?.userId ?? currentUser?.id),
            authService.getUsersByFlag(token, 3),
            authService.getUsersByFlag(token, 5),
            authService.getAppoinments(token),
            authService.getUserCounts(token),
          ]);

        const loggedInFlag = Number(currentUser?.flag) || 0;
        const profile = zonalResponse?.data || zonalResponse;
        const relatedData = profile?.relatedData || {};
        const sourceRecords = loggedInFlag === 0
          ? (zonalResponse.data || [])
          : (relatedData[relatedDataKeyByLoginFlag[loggedInFlag]]?.data || []);

        const zonalAdmins = sourceRecords.map((item: any) => {
          const user = item.userData || item;
          const recordUserId = user.userId ?? item.userId ?? item._id;
          const adminId = item.adminId ?? recordUserId;
          const organizationAdminId = item.organizationAdminId ?? recordUserId;
          const teacherId = item.teacherId ?? recordUserId;
          const numberAppointments = countTeacherAppointments(
            appointmentsResponse.data || [],
            teacherId
          );

          return {
            zonaladminname: user.name || "-",
            location: [item.city || user.city, item.state || user.state]
              .filter(Boolean)
              .join(", ") || "-",
            numberadmins: loggedInFlag === 0
              ? item.relatedData?.admins?.count ?? item.relatedData?.admins?.data?.length ?? 0
              : 0,
            numberorganizations: loggedInFlag === 0
              ? item.relatedData?.organizations?.count ?? item.relatedData?.organizations?.data?.length ?? 0
              : countRelatedRecords(relatedData.organizations?.data || [], "adminId", adminId),
            numberParents: loggedInFlag === 0
              ? item.relatedData?.parents?.count ?? item.relatedData?.parents?.data?.length ?? 0
              : countRelatedRecords(relatedData.parents?.data || [], "teacherId", teacherId),
            numberAppointments,
            numbertherapists: loggedInFlag === 0
              ? item.relatedData?.therapists?.count ?? item.relatedData?.therapists?.data?.length ?? 0
              : loggedInFlag === 6
                ? countRelatedRecords(relatedData.teachers?.data || [], "adminId", adminId)
                : countRelatedRecords(relatedData.teachers?.data || [], "organizationAdminId", organizationAdminId),
            numbersubscriptions: loggedInFlag === 0
              ? item.relatedData?.subscriptions?.count ?? item.relatedData?.subscriptions?.data?.length ?? 0
              : 0,
            numberpes: loggedInFlag === 0
              ? item.relatedData?.pes?.count ?? item.relatedData?.pes?.data?.length ?? 0
              : loggedInFlag === 6
                ? countRelatedRecords(relatedData.parents?.data || [], "adminId", adminId)
                : loggedInFlag === 7
                  ? countRelatedRecords(relatedData.parents?.data || [], "organizationAdminId", organizationAdminId)
                  : countRelatedRecords(relatedData.parents?.data || [], "teacherId", teacherId),
            userId: recordUserId,
          };
        });

        const mergedDoctors = [
          ...(doctorFlag3Response.data || []),
          ...(doctorFlag5Response.data || []),
        ];

        const uniqueDoctors = Array.from(
          new Map(
            mergedDoctors.map((item: any) => [
              item._id,
              {
                id: item.userId ?? item._id,
                // profileImage: `${filebasename}${item.profileImg}` ?? undefined,
                profileImage: item.profileImg
                ? `${filebasename}${item.profileImg}`
                : undefined,
                name: item.name || "N/A",
                designation: item.relatedData?.organizations?.name || "Global",
              },
            ])
          ).values()
        );

        // Filter appointments based on logged-in user's flag hierarchy
        let appointmentsData = appointmentsResponse.data || [];

        // console.log("Fetched appointments count:", appointmentsData);

        if (currentUser) {
          const loginUserFlag = currentUser.flag;
          const loginUserId = currentUser.userId;

          // Debug log
          // console.log("Filtering appointments - Flag:", loginUserFlag, "UserId:", loginUserId);

          if (loginUserFlag && loginUserId) {
            appointmentsData = appointmentsData.filter((appointment: any) => {
              let shouldInclude = false;

              switch (Number(loginUserFlag)) {
                case 6: // Zonal Admin - show appointments where zonalAdmin's userId matches
                  shouldInclude = hasSameUserId(appointment.zonalAdmin?.userId, loginUserId);
                  break;

                case 7: // Admin - show appointments where admin's userId matches
                  shouldInclude = hasSameUserId(appointment.admin?.userId, loginUserId);
                  break;

                case 1: // Organization Admin - show appointments where organization's userId matches
                  shouldInclude = hasSameUserId(appointment.organization?.userId, loginUserId);
                  break;

                case 3:
                case 5: // Teachers - show appointments where teacher's userId matches
                  shouldInclude = hasSameUserId(appointment.teacherUser?.userId, loginUserId);
                  break;

                default:
                  shouldInclude = true;
              }

              return shouldInclude;
            });

            // console.log("Filtered appointments count:", appointmentsData.length);
          } else {
            console.log("currentUser flag or userId is missing - showing all appointments");
          }
        } else {
          console.log("currentUser is null - showing all appointments");
        }

        // console.log("Final appointments data>>>>>>>>:", appointmentsData);
        const appointments = appointmentsData.map((item: any) => ({
          id: item._id,
          // profileImage: item.teacherUser?.profileImg ?? undefined,
          profileImage: item.teacherUser?.profileImg
                ? `${filebasename}${item.teacherUser?.profileImg}`
                : undefined,
          profileImageParent: item.parentUser?.profileImg
                ? `${filebasename}${item.parentUser.profileImg}`
                : undefined,
          // The API provides the booked user's details in `parentUser` and the
          // assigned administrator's details in `admin`.
          user: item.parentUser?.name || "N/A",
          doctor: item.teacherUser?.name || "N/A",
          admin: item.admin?.name || "N/A",
          name: item.teacherUser?.name || "N/A",
          designation: item.teacher?.therapist_category || "N/A",
          date: item.date || "-",
          time: item.time || "-",
          status: item.status || "-",
          
        }));

        setZonalAdminRows(zonalAdmins);
        setDoctorRows(uniqueDoctors);
        setAppointmentRows(appointments);

        // Super admins retain global counts. Other roles use only the counts
        // from their own getUserById relatedData response.
        if (loggedInFlag === 0 && userCountsResponse.success && userCountsResponse.data) {
          setUserCounts(userCountsResponse.data);
        } else {
          setUserCounts({
            zonalAdmin: 0,
            admin: getRelatedCount(relatedData, "admins"),
            organizationAdmin: getRelatedCount(relatedData, "organizations"),
            therapist: getRelatedCount(relatedData, "teachers"),
            parent: getRelatedCount(relatedData, "parents"),
            totalAppointments: appointmentsData.length,
          });
        }

      } catch (error) {
        console.error("Failed to fetch dashboard analytics data:", error);
      } finally{
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function to get heading text and count based on login flag
  const getHeadingByFlag = () => {
    const currentUser = tokenManager.getUser();
    const flag = Number(currentUser?.flag) || 0;

    switch (flag) {
      case 0:
        return { text: "Zonal Admin", count: userCounts.zonalAdmin };
      case 6:
        return { text: "Admin", count: userCounts.admin };
      case 7:
        return { text: "Organization", count: userCounts.organizationAdmin };
      case 1:
        return { text: "Doctors / Therapists", count: userCounts.therapist };
      case 3:
        return { text: "Users / Parents", count: userCounts.parent };
      case 5:
        return { text: "Doctors / Therapists", count: userCounts.therapist };
      default:
        return { text: "Zonal Admin", count: userCounts.zonalAdmin };
    }
  };

  const headingInfo = getHeadingByFlag();
  const dashboardRoutes = getDashboardRoutes(Number(tokenManager.getUser()?.flag) || 0);

  return (
    <>
    <div className="AnalyticesCard">
      <AnalyticesCard/>     
    </div>
    {/* <div className="SubscriptionAnalyticsGraph">
      <SubscriptionAnalytics/>
    </div> */}

    <div className="analyticsZonalAdmin boxShadow">
       <div className="d-flex">
          <Heading4 text="APPOINTMENTS" span={`(${appointmentRows.length})`} />
          <DashboardButtons onClick={() => navigate(dashboardRoutes.appointment)} text="View All" variant="SolidBlue" textsize="md"/>
       </div>
          <AppointmentTable appointments={appointmentRows} loading={loading} displayLimit={6} />
    </div>
    <div className="analyticsZonalAdmin">
      <div className="d-flex">
          <Heading4 text={headingInfo.text} span={`(${headingInfo.count})`}/>
          <DashboardButtons onClick={() => navigate(dashboardRoutes.list)} text="See All" variant="greenBorder" icon={<ArrowRightIcon size={22} className="btn-icon" />} iconPosition="right" textsize="md"/>
      </div>
       <ZonalAdminTable rows={zonalAdminRows} loading={loading} />
    </div>
    {/* <div className="Appointmentstatistics d-flex">
        <div className="AppointmentstatisticsGraph">
          {loading ? <Loader /> : <Appointmentgraph />}
        </div>
        <div className="DoctorsListAnalytics boxShadow">
          <DoctorListCard doctors={doctorRows} />
        </div>
    </div> */}
    {/* <div className="SellReportGraph ">
       <SellReportGraph/> 
    </div> */}
    </>
  );
};

export default DashboardAnalyticsIndex;
