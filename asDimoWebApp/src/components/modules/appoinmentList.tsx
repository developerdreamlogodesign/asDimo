import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL, filebasename } from "../../api/config";
import { tokenManager, getDoneBy } from "../../services/tokenManager";
import Table from "../ui/Table";
import Loader from "../ui/Loaders";
import SearchWithSort from "../ui/SearchWithSort";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import DashboardButtons from "../ui/Buttons";
import { Heading2 } from "../ui/HeadingPara";
import ModalBox from "../ui/ModalBox";
import "../ui/UIstyles.css";

import IButton from "../../assets/Images/iButton.svg";
import type { AvailabilitySlot } from "../ui/TimeSlots";

export interface AppointmentListProps {
  type?: "all" | "completed" | "canceled" | "reschedule" | "online" | "home" | "clinic" | "center" | "video" | string;
  isTeachersOrg?: boolean;
  defaultRowsPerPage?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  showChooseColumns?: boolean;
  onViewAll?: () => void;
  limit?: number;
  selectable?: boolean;
  showSort?: boolean;
}

interface Appointment {
  _id: string;
  parentId: number;
  teacherId: number;
  availabilityId: string;
  date: string;
  time: string;
  status: string;
  doneBy?: string;
  zoomLink: string | null;
  createdAt: string;
  updatedAt: string;

  teacher?: {
    _id: string;
    teacherId: number;
    userId: number;
    name?: string;
    therapist_category?: string;
  };

  parent?: {
    _id: string;
    parentId: number;
    userId: number;
    name?: string;
  };

  organization?: {
    _id: string;
    name: string;
    userId?: number;
  };

  zonalAdmin?: {
    _id: string;
    name: string;
    userId?: number;
  };

  admin?: {
    _id: string;
    name: string;
    userId?: number;
  };
  parentUser?: {
    _id?: string;
    name?: string;
    email?: string;
    userId?: number;
    profileImg?: string | null;
    googleProfile?: {
      name?: string | null;
      picture?: string | null;
      email?: string | null;
    };
    facebookProfile?: {
      name?: string | null;
      picture?: string | null;
      email?: string | null;
    };
  };

  teacherUser?: {
    _id?: string;
    name?: string;
    email?: string;
    userId?: number;
    profileImg?: string | null;
    googleProfile?: {
      name?: string | null;
      picture?: string | null;
      email?: string | null;
    };
    facebookProfile?: {
      name?: string | null;
      picture?: string | null;
      email?: string | null;
    };
  };

  availability?: {
    _id?: string;
    userId?: number;
    date?: string;
    time?: string;
    isBooked?: boolean;
    medium?: string;
    zoomLink?: string | null;
    zoomMeetingId?: string | null;
  };
}

interface AppointmentRow {
  id: string;
  teacherId: number;
  date: string;
  time: string;
  status: string;
  doneBy?: string;
  parent: string;
  parentImage?: string | null;
  teacher: string;
  organization: string;
  zonalAdmin: string;
  admin: string;
  zoomLink: string;
  medium?: string;
}

const TableAvatar: React.FC<{ src?: string; name?: string }> = ({ src, name }) => {
  const [imgError, setImgError] = React.useState(false);
  const initial =
    name && name !== "N/A" && name !== "-"
      ? name.trim().charAt(0).toUpperCase()
      : "U";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || ""}
        className="doctor-image"
        onError={() => setImgError(true)}
      />
    );
  }

  return <div className="doctor-image-initial">{initial}</div>;
};

const getParentProfileImage = (user: any): string | undefined => {
  if (!user) return undefined;
  const image =
    user.googleProfile?.picture ||
    user.profileImg ||
    user.facebookProfile?.picture ||
    null;

  if (!image) return undefined;
  if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://"))) {
    return image;
  }
  return `${filebasename}${image.startsWith("/") ? "" : "/"}${image}`;
};

const parseDateValue = (dateStr: string, timeStr?: string) => {
  if (!dateStr) return 0;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD-MM-YYYY -> YYYY-MM-DD
      const isoStr = `${parts[2]}-${parts[1]}-${parts[0]}${timeStr ? `T${timeStr}` : ""}`;
      const time = new Date(isoStr).getTime();
      if (!isNaN(time)) return time;
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD
      const isoStr = `${dateStr}${timeStr ? `T${timeStr}` : ""}`;
      const time = new Date(isoStr).getTime();
      if (!isNaN(time)) return time;
    }
  }
  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const isJoinCallActive = (dateStr: string, timeStr: string, status: string, zoomLink?: string | null): boolean => {
  if (!status || status.toLowerCase().trim() !== "approved") return false;
  if (!zoomLink || !zoomLink.trim()) return false;
  if (!dateStr || !timeStr) return false;

  let appointmentDate: Date | null = null;
  const dateParts = dateStr.trim().split(/[-/]/);

  const isPM = /pm/i.test(timeStr);
  const isAM = /am/i.test(timeStr);
  const cleanTime = timeStr.replace(/am|pm/gi, "").trim();
  const timeParts = cleanTime.split(":");
  if (timeParts.length < 1) return false;

  let hours = parseInt(timeParts[0], 10);
  let minutes = timeParts.length >= 2 ? parseInt(timeParts[1], 10) : 0;

  if (isNaN(hours) || isNaN(minutes)) return false;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  if (dateParts.length === 3) {
    if (dateParts[0].length === 2 && dateParts[2].length === 4) {
      // DD-MM-YYYY
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      appointmentDate = new Date(year, month, day, hours, minutes, 0, 0);
    } else if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      appointmentDate = new Date(year, month, day, hours, minutes, 0, 0);
    }
  }

  if (!appointmentDate || isNaN(appointmentDate.getTime())) {
    return false;
  }

  const appointmentTimeMs = appointmentDate.getTime();
  const nowMs = Date.now();

  const tenMinutesBeforeMs = appointmentTimeMs - 10 * 60 * 1000;
  const oneHourAfterMs = appointmentTimeMs + 60 * 60 * 1000;

  return nowMs >= tenMinutesBeforeMs && nowMs <= oneHourAfterMs;
};

interface TeachersOrgTableSectionProps {
  title: string;
  data: AppointmentRow[];
  currentRole: string;
  navigate: (path: string) => void;
  isVideoTable?: boolean;
  onMarkAsCompleted?: (row: AppointmentRow) => void;
}

const TeachersOrgTableSection: React.FC<TeachersOrgTableSectionProps> = ({
  title,
  data,
  currentRole,
  navigate,
  isVideoTable = false,
  onMarkAsCompleted,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
    key: "date",
    order: "desc",
  });
  const [, setTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFilterClick = (key: string) => {
    setCurrentPage(1);
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    const list = [...data];
    const { key, order } = sortConfig;

    list.sort((a, b) => {
      if (key === "date") {
        const timeA = parseDateValue(a.date, a.time);
        const timeB = parseDateValue(b.date, b.time);
        if (timeA !== timeB) {
          return order === "asc" ? timeA - timeB : timeB - timeA;
        }
      }
      const va: string = String((a as any)[key] ?? "").toLowerCase().trim();
      const vb: string = String((b as any)[key] ?? "").toLowerCase().trim();
      const comparison = va.localeCompare(vb, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return order === "asc" ? comparison : -comparison;
    });
    return list;
  }, [data, sortConfig]);

  const columns = useMemo(
    () => [
      {
        key: "parent",
        title: "Name",
        showFilter: true,
        onFilterClick: () => handleFilterClick("parent"),
        render: (value: string, row: AppointmentRow) => (
          <div className="doctor-info">
            <TableAvatar src={row.parentImage || undefined} name={value || row.parent} />
            <h5>{value || row.parent || "-"}</h5>
          </div>
        ),
        fixed: true,
      },
      {
        key: "teacher",
        title: "Dr Name",
        showFilter: true,
        onFilterClick: () => handleFilterClick("teacher"),
      },
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin" && currentRole !== "Admin"
        ? [
            {
              key: "zonalAdmin",
              title: "Zonal Admin",
              showFilter: true,
              onFilterClick: () => handleFilterClick("zonalAdmin"),
            },
          ]
        : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin"
        ? [
            {
              key: "admin",
              title: "Admin",
              showFilter: true,
              onFilterClick: () => handleFilterClick("admin"),
            },
          ]
        : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin"
        ? [
            {
              key: "organization",
              title: "Organization",
              showFilter: true,
              onFilterClick: () => handleFilterClick("organization"),
            },
          ]
        : []),
      {
        key: "date",
        title: "Date",
        showFilter: true,
        onFilterClick: () => handleFilterClick("date"),
        fixed: true,
      },
      { key: "time", title: "Time", fixed: true },
      {
        key: "status",
        title: "Status",
        showFilter: true,
        onFilterClick: () => handleFilterClick("status"),
        render: (value: string) => (
          <DashboardButtons
            className="status_button"
            text={value}
            variant={
              value?.toLowerCase() === "rescheduled"
                ? "SolidBlue"
                : value?.toLowerCase() === "cancelled" || value?.toLowerCase() === "canceled"
                ? "SolidYellow"
                : value?.toLowerCase() === "rejected"
                ? "red"
                : "SolidNeon"
            }
          />
        ),
      },
      ...(isVideoTable
        ? [
            {
              key: "join",
              title: "Join",
              fixed: true,
              render: (_value: any, row: AppointmentRow) => {
                const active = isJoinCallActive(row.date, row.time, row.status, row.zoomLink);
                return (
                  <DashboardButtons
                    text="Join Call"
                    variant="SolidNeon"
                    disabled={!active}
                    onClick={() => {
                      if (active && row.zoomLink) {
                        window.open(row.zoomLink, "_blank", "noopener,noreferrer");
                      }
                    }}
                  />
                );
              },
            },
          ]
        : []),
      {
        key: "action",
        title: "Action",
        render: (_value: any, row: AppointmentRow) => {
          // console.log(".........dfggg", row);
          const isApproved = row.status?.toLowerCase() === "approved";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {isApproved ? (
                <DashboardButtons
                  text="Mark As Completed"
                  variant="SolidNeon"
                  onClick={() => onMarkAsCompleted?.(row)}
                />
              ) : (
                <span style={{ fontSize: "12px", fontWeight: 500, textTransform: "capitalize", color: "#555" }}>
                  {row.status ? `${row.status} by ${row.doneBy}` : "-"}
                </span>
              )}
              <DashboardButtons
                text="View Details"
                icon={<img src={IButton} alt="view" className="btn-icon" />}
                variant="trashparent"
                onClick={() => {
                  const pathParts = window.location.pathname.split("/").filter(Boolean);
                  const currentBasePath = pathParts[2] || "therapist";
                  // console.log("...........pathParts.............",pathParts);
                  // console.log("...........currentBasePath.............",currentBasePath);
                  navigate(`/${currentBasePath}/appointment-details/${row.id}`);
                }}
              />
            </div>
          );
        },
        fixed: true,
      },
    ],
    [currentRole, isVideoTable, sortConfig, navigate, onMarkAsCompleted]
  );

  const totalPages = Math.max(Math.ceil(sortedData.length / rowsPerPage), 1);

  return (
    <div className="TeacherTableSection" style={{ marginBottom: "35px" }}>
      <div style={{ marginBottom: "15px", marginTop: "10px" }}>
        <Heading2 text={title} />
      </div>
      <Table
        columns={columns}
        rows={sortedData}
        selectable={true}
        sortBy={sortConfig.key}
        sortOrder={sortConfig.order}
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[4, 8, 12, 20]}
        onPageChange={setCurrentPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setCurrentPage(1);
        }}
        showChooseColumns={true}
      />
    </div>
  );
};

const AppointmentList: React.FC<AppointmentListProps> = ({
  type = "all",
  isTeachersOrg: isTeachersOrgProp,
  defaultRowsPerPage = 10,
  showSearch = true,
  showPagination = true,
  showChooseColumns = true,
  onViewAll,
  limit,
  selectable = true,
  showSort = true,
}) => {
  const navigate = useNavigate();
  const currentRole = getCurrentUserRole() ?? "";
  const isTeachersOrg = isTeachersOrgProp ?? (currentRole === "TeachersOrg" || currentRole === "teachersGlobal");
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentToReschedule, setAppointmentToReschedule] =
    useState<AppointmentRow | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [availabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading] = useState(false);
  const [statusActionError] = useState<string | null>(null);

  const [appointmentToComplete, setAppointmentToComplete] = useState<AppointmentRow | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
    key: "date",
    order: "desc",
  });
  const currentUser = tokenManager.getUser();

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = tokenManager.getAccessToken();
        const query = new URLSearchParams();

        // For teachersGlobal or TeachersOrg, filter by their teacherId
        if ((currentRole === "teachersGlobal" || currentRole === "TeachersOrg") && currentUser?.userId) {
          query.set("teacherId", String(currentUser.userId));
        }

        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await fetch(
          `${BASE_URL}/appointments${queryString}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.message ||
              `Failed to fetch appointments: ${response.status}`
          );
        }

        let responseData = await response.json();

        if (!responseData.success) {
          throw new Error(
            responseData.message || "Unable to load appointments"
          );
        }

        // Apply hierarchical filtering based on logged-in user's flag
        let appointmentsData = responseData.data || [];

        if (currentUser) {
          const loginUserFlag = currentUser.flag;
          const loginUserId = currentUser.userId;

          if (loginUserFlag !== undefined && loginUserFlag !== null && loginUserId && Number(loginUserFlag) !== 0) {
            appointmentsData = appointmentsData.filter((appointment: any) => {
              let shouldInclude = false;

              switch (Number(loginUserFlag)) {
                case 6: // Zonal Admin - show appointments where zonalAdmin's userId matches
                  shouldInclude = appointment.zonalAdmin?.userId === loginUserId;
                  break;

                case 7: // Admin - show appointments where admin's userId matches
                  shouldInclude = appointment.admin?.userId === loginUserId;
                  break;

                case 1: // Organization Admin - show appointments where organization's userId matches
                  shouldInclude = appointment.organization?.userId === loginUserId;
                  break;

                case 5: // Organization Teacher - show appointments where teacher's userId matches
                  shouldInclude = appointment.teacherUser?.userId === loginUserId;
                  break;

                case 3: // Teacher - show appointments where teacher's userId matches
                  shouldInclude = appointment.teacherUser?.userId === loginUserId;
                  break;

                default:
                  shouldInclude = true;
              }

              return shouldInclude;
            });
          }
        }

        // Apply medium/type filtering based on tab type prop
        if (type) {
          const normalizedType = type.toLowerCase().trim();
          appointmentsData = appointmentsData.filter((item: Appointment) => {
            const medium = (
              item.availability?.medium ||
              (item as any).medium ||
              (item.zoomLink || item.availability?.zoomLink ? "online" : "")
            ).toLowerCase().trim();
            const status = (item.status || "").toLowerCase().trim();

            if (isTeachersOrg) {
              if (normalizedType === "all") {
                return status === "approved";
              }
              if (normalizedType === "completed") {
                return status === "completed";
              }
              if (normalizedType === "canceled" || normalizedType === "cancelled") {
                return status === "canceled" || status === "cancelled" || status === "rejected";
              }
              if (normalizedType === "reschedule" || normalizedType === "rescheduled") {
                return status === "rescheduled";
              }
              return true;
            } else {
              if (normalizedType === "all") {
                return true;
              }
              if (normalizedType === "online" || normalizedType === "video") {
                return medium === "online" || medium === "video";
              }
              if (normalizedType === "clinic" || normalizedType === "center") {
                return medium === "center" || medium === "clinic";
              }
              if (normalizedType === "home") {
                return medium === "home";
              }
              if (normalizedType === "completed") {
                return status === "completed";
              }
              if (normalizedType === "canceled" || normalizedType === "cancelled") {
                return status === "canceled" || status === "cancelled" || status === "rejected";
              }
              if (normalizedType === "reschedule" || normalizedType === "rescheduled") {
                return status === "rescheduled";
              }
              return true;
            }
          });
        }

        const formattedRows: AppointmentRow[] = appointmentsData.map(
          (item: Appointment) => ({
            id: item._id,
            teacherId: item.teacherId,
            date: item.date,
            time: item.time,
            status: item.status,
            parent: item.parentUser?.name || "N/A",
            parentImage: getParentProfileImage(item.parentUser),
            teacher: item.teacherUser?.name || "N/A",
            organization: item.organization?.name || "N/A",
            zonalAdmin: item.zonalAdmin?.name || "N/A",
            admin: item.admin?.name || "N/A",
            zoomLink: item.zoomLink || item.availability?.zoomLink || "",
            medium: item.availability?.medium || (item.zoomLink || item.availability?.zoomLink ? "online" : ""),
            doneBy: item.doneBy || "User",
          })
        );

        setAppointments(formattedRows);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : String(fetchError)
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [type, currentRole, currentUser?.userId, isTeachersOrg]);

  const handleConfirmComplete = async () => {
    if (!appointmentToComplete) return;

    setCompleting(true);
    setCompleteError(null);

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(
        `${BASE_URL}/appointments/complete/${appointmentToComplete.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            doneBy: getDoneBy(currentUser?.flag),
          }),
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok || (responseData && responseData.success === false)) {
        throw new Error(
          responseData?.message || `Failed to complete appointment: ${response.status}`
        );
      }

      setAppointments((prev) =>
        prev.map((app) =>
          app.id === appointmentToComplete.id
            ? { ...app, status: "completed" }
            : app
        )
      );

      setAppointmentToComplete(null);
    } catch (err) {
      setCompleteError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setCompleting(false);
    }
  };

  const availableTimes = availabilitySlots.filter(
    (slot) => slot.date === rescheduleDate && !slot.isBooked
  );

  const dates = Array.from(new Set(availabilitySlots.map((slot) => slot.date)));

  const handleDateChange = (date: string) => {
    setRescheduleDate(date);
    const firstAvailableTime = availabilitySlots.find(
      (slot) => slot.date === date && !slot.isBooked
    )?.time;
    setRescheduleTime(firstAvailableTime || "");
  };

  const handleReschedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!appointmentToReschedule || !rescheduleDate || !rescheduleTime) return;

    setRescheduling(true);
    setRescheduleError(null);

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(
        `${BASE_URL}/appointments/reschedule/${appointmentToReschedule.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            date: rescheduleDate,
            time: rescheduleTime,
            doneBy: getDoneBy(currentUser?.flag),
          }),
        }
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok || !responseData?.success) {
        throw new Error(
          responseData?.message || `Unable to reschedule appointment: ${response.status}`
        );
      }

      let updatedStatus = responseData.data?.status || appointmentToReschedule.status;

      if (currentUser && [0, 6, 7].includes(Number(currentUser.flag))) {
        try {
          const statusRes = await fetch(`${BASE_URL}/therapists/appointments/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              appointmentId: appointmentToReschedule.id,
              status: "approved",
              doneBy: getDoneBy(currentUser?.flag),
            }),
          });
          const statusData = await statusRes.json().catch(() => null);
          if (statusData?.data?.status) {
            updatedStatus = statusData.data.status;
          } else {
            updatedStatus = "approved";
          }
        } catch (statusErr) {
          console.error("Error auto-approving appointment after reschedule:", statusErr);
        }
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentToReschedule.id
            ? {
                ...appointment,
                date: responseData.data?.date || rescheduleDate,
                time: responseData.data?.time || rescheduleTime,
                status: updatedStatus,
              }
            : appointment
        )
      );
      setAppointmentToReschedule(null);
    } catch (rescheduleError) {
      setRescheduleError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : String(rescheduleError)
      );
    } finally {
      setRescheduling(false);
    }
  };

  const handleFilterClick = (key: string) => {
    setCurrentPage(1);
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const columns = useMemo(
    () => [
      {
        key: "parent",
        title: "Name",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("parent"),
        render: (value: string, row: AppointmentRow) => (
          <div className="doctor-info">
            <TableAvatar src={row.parentImage || undefined} name={value || row.parent} />
            <h5>{value || row.parent || "-"}</h5>
          </div>
        ),
        fixed: true,
      },
      {
        key: "teacher",
        title: "Dr Name",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("teacher"),
      },
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin" && currentRole !== "Admin"
      ? [
      {
        key: "zonalAdmin",
        title: "Zonal Admin",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("zonalAdmin"),
      },
        ]
      : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin"
      ? [
      {
        key: "admin",
        title: "Admin",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("admin"),
      },
      ]
      : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "teachersGlobal" && currentRole !== "OrganizationAdmin"
      ? [
      {
        key: "organization",
        title: "Organization",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("organization"),
      },
      ]
      : []),
      {
        key: "date",
        title: "Date",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("date"),
        fixed: true,
      },
      { key: "time", title: "Time" ,fixed: true, },
      {
        key: "status",
        title: "Status",
        showFilter: showSort,
        onFilterClick: () => handleFilterClick("status"),
        render: (value: string) => (
          <DashboardButtons
            className="status_button"
            text={value}
            variant={
              value?.toLowerCase() === "rescheduled"
                ? "SolidBlue"
                : value?.toLowerCase() === "cancelled" || value?.toLowerCase() === "canceled"
                ? "SolidYellow"
                : value?.toLowerCase() === "rejected"
                ? "red"
                : "SolidNeon"
            }
          />
        ),
      },
      {
        key: "reschedule",
        title: "Action",
        render: (_value: any, row: any) => (
          <DashboardButtons
            text="View Details"
            icon={<img src={IButton} alt="view" className="btn-icon" />}
            variant="trashparent"
            onClick={() => {
              const pathParts = window.location.pathname.split("/").filter(Boolean);
              const currentBasePath = pathParts[2] || "therapist";
              // console.log("...........pathParts.............",pathParts);
              // console.log("...........currentBasePath.............",currentBasePath);
              navigate(`/${currentBasePath}/appointment-details/${row.id}`);
            }}
          />
        ),
        fixed: true,
      },
    ],
    [currentRole, sortConfig, navigate, showSort]
  );

  // Reset page when search changes
  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let data = appointments.slice();

    if (q) {
      data = data.filter((r) => {
        return (
          String(r.parent || "").toLowerCase().includes(q) ||
          String(r.teacher || "").toLowerCase().includes(q) ||
          String(r.organization || "").toLowerCase().includes(q) ||
          String(r.zonalAdmin || "").toLowerCase().includes(q) ||
          String(r.admin || "").toLowerCase().includes(q) ||
          String(r.date || "").toLowerCase().includes(q) ||
          String(r.time || "").toLowerCase().includes(q) ||
          String(r.status || "").toLowerCase().includes(q) ||
          String(r.medium || "").toLowerCase().includes(q)
        );
      });
    }

    const { key, order } = sortConfig;
    data.sort((a, b) => {
      if (key === "date") {
        const timeA = parseDateValue(a.date, a.time);
        const timeB = parseDateValue(b.date, b.time);
        if (timeA !== timeB) {
          return order === "asc" ? timeA - timeB : timeB - timeA;
        }
      }
      const va: string = String((a as any)[key] ?? "").toLowerCase().trim();
      const vb: string = String((b as any)[key] ?? "").toLowerCase().trim();
      const comparison = va.localeCompare(vb, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      return order === "asc" ? comparison : -comparison;
    });

    return data;
  }, [appointments, search, sortConfig]);

  const videoAppointments = useMemo(() => {
    return appointments.filter((r) => {
      const isVideo = r.medium === "online" || r.medium === "video" || Boolean(r.zoomLink);
      if (!isVideo) return false;
      if (isTeachersOrg && type === "all") return r.status?.toLowerCase() === "approved";
      if (isTeachersOrg && type === "completed") return r.status?.toLowerCase() === "completed";
      return true;
    });
  }, [appointments, isTeachersOrg, type]);

  const homeAppointments = useMemo(() => {
    return appointments.filter((r) => {
      if (r.medium !== "home") return false;
      if (isTeachersOrg && type === "all") return r.status?.toLowerCase() === "approved";
      if (isTeachersOrg && type === "completed") return r.status?.toLowerCase() === "completed";
      return true;
    });
  }, [appointments, isTeachersOrg, type]);

  const clinicAppointments = useMemo(() => {
    return appointments.filter((r) => {
      if (r.medium !== "center" && r.medium !== "clinic") return false;
      if (isTeachersOrg && type === "all") return r.status?.toLowerCase() === "approved";
      if (isTeachersOrg && type === "completed") return r.status?.toLowerCase() === "completed";
      return true;
    });
  }, [appointments, isTeachersOrg, type]);

  if (loading) {
    return (
      <div
        className="AppointmentsList table-loading-wrapper"
        style={{
          minHeight: "260px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <Loader fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="AppointmentsList">
      {!isTeachersOrg && showSearch && (
        <SearchWithSort
          searchValue={search}
          onSearchChange={setSearch}
          sortValue={sortConfig.order}
          onSortChange={(v: string) =>
            setSortConfig((prev) => ({
              ...prev,
              order: v === "desc" ? "desc" : "asc",
            }))
          }
        />
      )}

      {statusActionError && <div className="error-message">{statusActionError}</div>}

      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : isTeachersOrg ? (
        <div className="TeachersOrgTables">
          <TeachersOrgTableSection
            title={`Video Appointments (${videoAppointments.length})`}
            data={videoAppointments}
            currentRole={currentRole}
            navigate={navigate}
            isVideoTable={true}
            onMarkAsCompleted={(row) => {
              setAppointmentToComplete(row);
              setCompleteError(null);
            }}
          />
          <TeachersOrgTableSection
            title={`Home Appointments (${homeAppointments.length})`}
            data={homeAppointments}
            currentRole={currentRole}
            navigate={navigate}
            isVideoTable={false}
            onMarkAsCompleted={(row) => {
              setAppointmentToComplete(row);
              setCompleteError(null);
            }}
          />
          <TeachersOrgTableSection
            title={`Clinic Appointments (${clinicAppointments.length})`}
            data={clinicAppointments}
            currentRole={currentRole}
            navigate={navigate}
            isVideoTable={false}
            onMarkAsCompleted={(row) => {
              setAppointmentToComplete(row);
              setCompleteError(null);
            }}
          />
        </div>
      ) : (
        <Table
          columns={columns}
          rows={limit ? filteredAndSorted.slice(0, limit) : filteredAndSorted}
          selectable={selectable}
          sortBy={sortConfig.key}
          sortOrder={sortConfig.order}
          pagination={showPagination}
          currentPage={currentPage}
          totalPages={
            Math.max(
              Math.ceil(
                (limit ? filteredAndSorted.slice(0, limit) : filteredAndSorted).length / rowsPerPage
              ),
              1
            )
          }
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[4, 8, 12, 20]}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setCurrentPage(1);
          }}
          showChooseColumns={showChooseColumns}
          onViewAll={onViewAll}
        />
      )}

      {appointmentToComplete && (
        <ModalBox
          header={<h3>Complete Appointment</h3>}
          onCancel={() => {
            if (!completing) {
              setAppointmentToComplete(null);
              setCompleteError(null);
            }
          }}
          body={
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ fontSize: "15px", marginBottom: "20px", color: "#333", lineHeight: "1.5" }}>
                Are you sure you want to mark the appointment with <strong>{appointmentToComplete.parent}</strong> on <strong>{appointmentToComplete.date}</strong> at <strong>{appointmentToComplete.time}</strong> as completed?
              </p>

              {completeError && (
                <div className="error-message" style={{ marginBottom: "15px", color: "red" }}>
                  {completeError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "15px" }}>
                <DashboardButtons
                  text="Cancel"
                  variant="trashparent"
                  onClick={() => {
                    if (!completing) {
                      setAppointmentToComplete(null);
                      setCompleteError(null);
                    }
                  }}
                  disabled={completing}
                />
                <DashboardButtons
                  text={completing ? "Completing..." : "Confirm"}
                  variant="SolidNeon"
                  onClick={handleConfirmComplete}
                  disabled={completing}
                />
              </div>
            </div>
          }
        />
      )}

      {appointmentToReschedule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reschedule-title"
          className="reschedule-dialog"
        >
          <form onSubmit={handleReschedule}>
            <h2 id="reschedule-title">Reschedule Appointment</h2>
            {rescheduleError && <div className="error-message">{rescheduleError}</div>}
            <label>
              Date
              <select
                value={rescheduleDate}
                onChange={(event) => handleDateChange(event.target.value)}
                disabled={availabilityLoading || dates.length === 0}
                required
              >
                <option value="">Select a date</option>
                {dates.map((date) => {
                  const hasAvailableTime = availabilitySlots.some(
                    (slot) => slot.date === date && !slot.isBooked
                  );
                  return (
                    <option key={date} value={date} disabled={!hasAvailableTime}>
                      {date}{!hasAvailableTime ? " (No availability)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Time
              <select
                value={rescheduleTime}
                onChange={(event) => setRescheduleTime(event.target.value)}
                disabled={availabilityLoading || !rescheduleDate || availableTimes.length === 0}
                required
              >
                <option value="">Select a time</option>
                {availableTimes.map((slot) => (
                  <option key={slot._id} value={slot.time}>
                    {slot.time}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setAppointmentToReschedule(null)}
              disabled={rescheduling}
            >
              Cancel
            </button>
            <button type="submit" disabled={rescheduling || availabilityLoading || !rescheduleTime}>
              {rescheduling ? "Rescheduling..." : "Reschedule"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default AppointmentList;
