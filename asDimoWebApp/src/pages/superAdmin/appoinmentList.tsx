import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api/config";
import { tokenManager } from "../../services/tokenManager";
import Table from "../../components/ui/Table";
import Loader from "../../components/ui/Loaders";
import { Heading1 } from "../../components/ui/HeadingPara";
import SearchWithSort from "../../components/ui/SearchWithSort";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import DashboardButtons from "../../components/ui/Buttons";
import IButton from "../../assets/Images/iButton.svg";

interface Appointment {
  _id: string;
  parentId: number;
  teacherId: number;
  availabilityId: string;
  date: string;
  time: string;
  status: string;
  zoomLink: string;
  createdAt: string;
  updatedAt: string;

  teacher?: {
    _id: string;
    teacherId: number;
    userId: number;
    name?: string;
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
  };

  zonalAdmin?: {
    _id: string;
    name: string;
  };

  admin?: {
    _id: string;
    name: string;
  };
    parentUser?: {
        _id: string;
        name: string;
    };

    teacherUser?: {
        _id: string;
        name: string;
    };
}

interface AppointmentRow {
  id: string;
  teacherId: number;
  date: string;
  time: string;
  status: string;
  parent: string;
  teacher: string;
  organization: string;
  zonalAdmin: string;
  admin: string;
  zoomLink: string;
}

interface AvailabilitySlot {
  _id: string;
  date: string;
  time: string;
  isBooked: boolean;
}

const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
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
  const [updatingAppointmentId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<string>("date");
  const currentRole = getCurrentUserRole();


  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = tokenManager.getAccessToken();
        const currentUser = tokenManager.getUser();
        const query = new URLSearchParams();

        if (search) query.set("search", search);
        if (sortBy) query.set("sortBy", sortBy);
        if (sort) query.set("sortOrder", sort);

        // For teachersGlobal, filter by their teacherId
        if (currentRole === "teachersGlobal" && currentUser?.userId) {
          query.set("teacherId", String(currentUser.userId));
        }

        const response = await fetch(
          `${BASE_URL}/appointments?${query.toString()}`,
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
        // console.log("..responseData..", responseData);

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

          // console.log("Filtering appointments - Flag:", loginUserFlag, "UserId:", loginUserId);

          if (loginUserFlag && loginUserId) {
            appointmentsData = appointmentsData.filter((appointment: any) => {
              let shouldInclude = false;

              switch (Number(loginUserFlag)) {
                case 6: // Zonal Admin - show appointments where zonalAdmin's userId matches
                  shouldInclude = appointment.zonalAdmin?.userId === loginUserId;
                  // console.log(`Flag 6 check - zonalAdmin.userId: ${appointment.zonalAdmin?.userId}, loginUserId: ${loginUserId}, include: ${shouldInclude}`);
                  break;

                case 7: // Admin - show appointments where admin's userId matches
                  shouldInclude = appointment.admin?.userId === loginUserId;
                  // console.log(`Flag 7 check - admin.userId: ${appointment.admin?.userId}, loginUserId: ${loginUserId}, include: ${shouldInclude}`);
                  break;

                case 1: // Organization Admin - show appointments where organization's userId matches
                  shouldInclude = appointment.organization?.userId === loginUserId;
                  // console.log(`Flag 1 check - organization.userId: ${appointment.organization?.userId}, loginUserId: ${loginUserId}, include: ${shouldInclude}`);
                  break;

                case 5: // Organization Admin - show appointments where organization's userId matches
                  shouldInclude = appointment.teacherUser?.userId === loginUserId;
                  // console.log(`Flag 5 check - teacherUser.userId: ${appointment.teacherUser?.userId}, loginUserId: ${loginUserId}, include: ${shouldInclude}`);
                  break;

                case 3: // Teacher - show appointments where teacher's userId matches
                  shouldInclude = appointment.teacherUser?.userId === loginUserId;
                  // console.log(`Flag 3 check - teacherUser.userId: ${appointment.teacherUser?.userId}, loginUserId: ${loginUserId}, include: ${shouldInclude}`);
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

        const formattedRows: AppointmentRow[] = appointmentsData.map(
          (item: Appointment) => ({
            id: item._id,
            teacherId: item.teacherId,
            date: item.date,
            time: item.time,
            status: item.status,
            parent: item.parentUser?.name || "N/A",
            teacher: item.teacherUser?.name || "N/A",
            organization: item.organization?.name || "N/A",
            zonalAdmin: item.zonalAdmin?.name || "N/A",
            admin: item.admin?.name || "N/A",
            zoomLink: item.zoomLink || "",
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
  }, [search, sortBy, sort]);

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
          }),
        }
      );

      const responseData = await response.json().catch(() => null);
      if (!response.ok || !responseData?.success) {
        throw new Error(
          responseData?.message || `Unable to reschedule appointment: ${response.status}`
        );
      }

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === appointmentToReschedule.id
            ? {
                ...appointment,
                date: responseData.data?.date || rescheduleDate,
                time: responseData.data?.time || rescheduleTime,
                status: responseData.data?.status || appointment.status,
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

  const isSuperAdmin = Number(tokenManager.getUser()?.flag) === 0;

  // console.log("...........currentRole",currentRole);

  const columns = useMemo(
    () => [
      {
        key: "parent",
        title: "Name",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("parentUser"),
        fixed: true,
      },
      {
        key: "teacher",
        title: "Dr Name",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("teacherUser"),
      },
      ...(currentRole !== "TeachersOrg" && currentRole !== "OrganizationAdmin" && currentRole !== "Admin"
      ? [
      {
        key: "zonalAdmin",
        title: "Zonal Admin",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("zonalAdmin"),
      },
        ]
      : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "OrganizationAdmin"
      ? [
      {
        key: "admin",
        title: "Admin",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("admin"),
      },
      ]
      : []),
      ...(currentRole !== "TeachersOrg" && currentRole !== "OrganizationAdmin"
      ? [
      {
        key: "organization",
        title: "Organization",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("organization"),
        
      },
      ]
      : []),
      {
        key: "date",
        title: "Date",
        // showFilter: true,
        onFilterClick: () => handleFilterClick("date"),
        fixed: true,
      },
      { key: "time", title: "Time" ,fixed: true, },
      {
        key: "status",
        title: "Status",
      },
      {
        key: "reschedule",
        title: "Action",
        ////// important /////////////////
        // render: (_value: unknown, row: AppointmentRow) => {
        //   const isUpdating = updatingAppointmentId === row.id;

        //   if (isSuperAdmin && row.status.toLowerCase() === "rescheduled") {
        //     return (
        //       <>
        //         <button
        //           type="button"
        //           onClick={() => handleAppointmentStatus(row.id, "approved")}
        //           disabled={isUpdating}
        //         >
        //           Approve
        //         </button>
        //         <button
        //           type="button"
        //           onClick={() => handleAppointmentStatus(row.id, "rejected")}
        //           disabled={isUpdating}
        //         >
        //           Cancel
        //         </button>
        //       </>
        //     );
        //   }

        //   if (isAdmin && row.status.toLowerCase() === "rescheduled") {
        //     return (
        //       <>
        //         <button
        //           type="button"
        //           onClick={() => handleAppointmentStatus(row.id, "approved")}
        //           disabled={isUpdating}
        //         >
        //           Approve
        //         </button>
        //         <button
        //           type="button"
        //           onClick={() => handleAppointmentStatus(row.id, "rejected")}
        //           disabled={isUpdating}
        //         >
        //           Cancel
        //         </button>
        //       </>
        //     );
        //   }

        //   const status = row.status?.toLowerCase();

        //   return status === "approved" ? (
        //     <button type="button" onClick={() => openRescheduleDialog(row)}>
        //       Reschedule
        //     </button>
        //   ) : status === "rejected" ? (
        //     <button type="button" onClick={() => openRescheduleDialog(row)}>
        //       Reschedule
        //     </button>
        //   ) : (
        //     "-"
        //   );
        // },
        //////////////// important ////////////////////
        render: (_value: any, row: any) => (
          <DashboardButtons
            text="View Details"
            icon={<img src={IButton} alt="view" className="btn-icon" />}
            variant="trashparent"
            onClick={() => navigate(`../appointment-details/${row.id}`)}
          />
        ),
        fixed: true,
      },
      // {
      //   key: "zoomLink",
      //   title: "Zoom Link",
      //   render: (value: string) =>
      //     value ? (
      //       <a href={value} target="_blank" rel="noreferrer">
      //         Join
      //       </a>
      //     ) : (
      //       "N/A"
      //     ),
      // },
    ],
    [isSuperAdmin, updatingAppointmentId, navigate]
  );

  function handleFilterClick(key: string) {
    setCurrentPage(1);
    // if (sortBy === key) {
    //   setSort((s) => (s === "asc" ? "desc" : "asc"));
    // } else {
    //   setSortBy(key);
    //   setSort("asc");
    // }

    if (sortBy === key) {
      setSort((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSort("asc");
    }
  }

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

//   const filteredAndSorted = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     let data = appointments.slice();

//     if (q) {
//       data = data.filter((r) => {
//         return (
//           String(r.parent).toLowerCase().includes(q) ||
//           String(r.teacher).toLowerCase().includes(q) ||
//           String(r.organization).toLowerCase().includes(q) ||
//           String(r.date).toLowerCase().includes(q) ||
//           String(r.time).toLowerCase().includes(q) ||
//           String(r.status).toLowerCase().includes(q)
//         );
//       });
//     }

//     data.sort((a, b) => {
//       const va: string = String((a as any)[sortBy] ?? "");
//       const vb: string = String((b as any)[sortBy] ?? "");
//       return sort === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
//     });

//     return data;
//   }, [appointments, search, sort, sortBy]);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div>
      <Heading1 text="Appointments" />

      <SearchWithSort
        searchValue={search}
        onSearchChange={setSearch}
        sortValue={sort}
        onSortChange={(v: string) => setSort(v === "desc" ? "desc" : "asc")}
      />

      {statusActionError && <div className="error-message">{statusActionError}</div>}

      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : (
        <Table
          columns={columns}
          rows={appointments}
          selectable={true}
          // onBulkDelete={true}
          sortBy={sortBy}
          sortOrder={sort}
          // onSort={handleFilterClick}
          pagination={true}
          currentPage={currentPage}
          totalPages={
            Math.max(
              Math.ceil(
                appointments.length / rowsPerPage
              ),
              1
            )
          }
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setCurrentPage(1);
          }}
          showChooseColumns={true}
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
