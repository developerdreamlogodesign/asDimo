import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CurrentDates from "../../components/ui/CurrentDates";
import Tabs from "../../components/ui/Tabs";
import AppointmentList from "../../components/modules/appoinmentList";
import GlobalTableList from "../../components/modules/GlobalTableList";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import { tokenManager } from "../../services/tokenManager";
import { BASE_URL } from "../../api/config";
import { routes } from "../../routes/AppRoutes";
import { Heading2 } from "../../components/ui/HeadingPara";
import {
  Video,
  House,
  Stethoscope,
  Target,
} from "lucide-react";

interface SlotData {
  id?: string;
  date: string;
  time: string;
  medium: string;
  isBooked: boolean;
}

interface TimeSlotDisplay {
  time: string;
  booked: boolean;
}

const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const normalizeDateKey = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD-MM-YYYY
      return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2]}`;
    } else if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    }
  }
  return dateStr;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const currentRole = getCurrentUserRole();
  const user = tokenManager.getUser();
  const teacherId = user?.userId || user?.id;
  const filteredUserId = currentRole === "teachersGlobal" ? (user?.userId ? String(user.userId) : undefined) : undefined;

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [availabilityList, setAvailabilityList] = useState<SlotData[]>([]);
  const [, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!teacherId) return;
      setLoadingSlots(true);

      try {
        const token = tokenManager.getAccessToken();
        const headers = {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        };

        const slotMap = new Map<string, SlotData>();

        // 1. Fetch from appointments?teacherId=
        try {
          const appRes = await fetch(`${BASE_URL}/appointments?teacherId=${teacherId}`, {
            headers,
          });
          const appData = await appRes.json().catch(() => null);

          if (appData?.success && Array.isArray(appData.data)) {
            appData.data.forEach((app: any) => {
              const avail = app.availability;
              const date = avail?.date || app.date;
              const time = avail?.time || app.time;
              if (!date || !time) return;

              const normDate = normalizeDateKey(date);
              const medium = (avail?.medium || app.medium || (app.zoomLink ? "online" : "center")).toLowerCase();
              const isBooked = avail?.isBooked !== undefined ? Boolean(avail.isBooked) : true;
              const key = `${normDate}_${time}_${medium}`;

              slotMap.set(key, {
                id: avail?._id || app._id,
                date: normDate,
                time,
                medium: avail?.medium || app.medium || (app.zoomLink ? "online" : "center"),
                isBooked,
              });
            });
          }
        } catch (appErr) {
          console.error("Failed to fetch appointments for teacher:", appErr);
        }

        // 2. Fetch from appointments/available-slots/:teacherId
        try {
          const slotsRes = await fetch(
            `${BASE_URL}/appointments/available-slots/${teacherId}`,
            { headers }
          );
          const slotsData = await slotsRes.json().catch(() => null);

          if (slotsData?.success && Array.isArray(slotsData.data)) {
            slotsData.data.forEach((s: any) => {
              if (!s || !s.date || !s.time) return;

              const normDate = normalizeDateKey(s.date);
              const medium = (s.medium || "online").toLowerCase();
              const key = `${normDate}_${s.time}_${medium}`;

              // If not already present or if we have more specific slot data
              if (!slotMap.has(key)) {
                slotMap.set(key, {
                  id: s._id,
                  date: normDate,
                  time: s.time,
                  medium: s.medium || "online",
                  isBooked: Boolean(s.isBooked),
                });
              } else {
                // If it already exists, ensure booking status is accurate
                const existing = slotMap.get(key)!;
                if (s.isBooked !== undefined) {
                  existing.isBooked = Boolean(s.isBooked);
                }
              }
            });
          }
        } catch (slotsErr) {
          console.error("Failed to fetch available slots:", slotsErr);
        }

        setAvailabilityList(Array.from(slotMap.values()));
      } catch (error) {
        console.error("Error loading availability slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [teacherId]);

  const selectedDateStr = formatDateToDDMMYYYY(selectedDate);

  const selectedAvailability = useMemo(() => {
    const slotsForDate = availabilityList.filter(
      (s) => s.date === selectedDateStr
    );

    const grouped: Record<string, TimeSlotDisplay[]> = {};

    slotsForDate.forEach((s) => {
      let category = "Video Conference";
      const m = (s.medium || "").toLowerCase().trim();

      if (m === "home") {
        category = "At Home";
      } else if (m === "center" || m === "clinic") {
        category = "At Clinic";
      } else if (m === "online" || m === "video") {
        category = "Video Conference";
      } else if (m) {
        category = m.charAt(0).toUpperCase() + m.slice(1);
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }

      if (!grouped[category].some((existing) => existing.time === s.time)) {
        grouped[category].push({
          time: s.time,
          booked: s.isBooked,
        });
      }
    });

    // Sort time slots chronologically within each category
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) =>
        a.time.localeCompare(b.time, undefined, { numeric: true })
      );
    });

    return grouped;
  }, [availabilityList, selectedDateStr]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const appointmentTabs = [
    {
      id: "all",
      label: (
        <span className="AppointmentTab">
          <Target size={45} />
          <span>All Appointments</span>
        </span>
      ),
      content: (
        <AppointmentList
          type="all"
          isTeachersOrg={false}
          showSearch={false}
          showPagination={false}
          showChooseColumns={false}
          selectable={false}
          showSort={false}
          onViewAll={() => navigate(routes.THERAPIST_APPOINTMENT || "/therapist/appointment")}
          limit={4}
        />
      ),
    },
    {
      id: "online",
      label: (
        <span className="AppointmentTab">
          <Video size={45} />
          <span>Video Appointments</span>
        </span>
      ),
      content: (
        <AppointmentList
          type="online"
          isTeachersOrg={false}
          showSearch={false}
          showPagination={false}
          showChooseColumns={false}
          selectable={false}
          showSort={false}
          onViewAll={() => navigate(routes.THERAPIST_APPOINTMENT || "/therapist/appointment")}
          limit={4}
        />
      ),
    },
    {
      id: "home",
      label: (
        <span className="AppointmentTab">
          <House size={45} />
          <span>Home Appointments</span>
        </span>
      ),
      content: (
        <AppointmentList
          type="home"
          isTeachersOrg={false}
          showSearch={false}
          showPagination={false}
          showChooseColumns={false}
          selectable={false}
          showSort={false}
          onViewAll={() => navigate(routes.THERAPIST_APPOINTMENT || "/therapist/appointment")}
          limit={4}
        />
      ),
    },
    {
      id: "clinic",
      label: (
        <span className="AppointmentTab">
          <Stethoscope size={45} />
          <span>Clinic Appointments</span>
        </span>
      ),
      content: (
        <AppointmentList
          type="clinic"
          isTeachersOrg={false}
          showSearch={false}
          showPagination={false}
          showChooseColumns={false}
          selectable={false}
          showSort={false}
          onViewAll={() => navigate(routes.THERAPIST_APPOINTMENT || "/therapist/appointment")}
          limit={4}
        />
      ),
    },
  ];

  const parentColumns = [
    { key: "parent_name", title: "Users", sortable: false, fixed: true },
    { key: "children_details", title: "Children Details", sortable: false },
    ...(currentRole !== "OrganizationAdmin" && currentRole !== "TeachersOrg"
      ? [{ key: "admin_name", title: "Admin", sortable: false }]
      : []),
    ...(currentRole !== "TeachersOrg"
      ? [
          { key: "organization_name", title: "Organization", sortable: false },
          { key: "therapist_name", title: "Therapist", sortable: false },
        ]
      : []),
    { key: "last_appointment", title: "Last Appointment", sortable: false },
    { key: "location", title: "Location" },
    { key: "subscription", title: "Subscription", sortable: false },
    { key: "created", title: "Created", sortable: false },
    { key: "pe", title: "PE", sortable: false },
  ];

  return (
    <>
      <CurrentDates
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />


      <div className="available-time-header">
        <h2>Available Time</h2>

        <button
          type="button"
          className="change-time-btn"
          onClick={() => navigate(routes.THERAPIST_SETTINGS || "/therapist/settings")}
        >
          Change Time
        </button>
      </div>


      <div className="selected-date-label">
        {selectedDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>


      {Object.entries(selectedAvailability).map(([type, slots]) => (
        <div className="time-section" key={type}>
          <h3>{type}</h3>

          <div className="time-slots">
            {slots.map((slot) => {
              return (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-slot ${slot.booked ? "" : "selected"}`}
                >
                  <span className="time-text">{slot.time}</span>
                  {slot.booked && <span className="slot-status">Booked</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}


      {Object.keys(selectedAvailability).length === 0 && (
        <div className="no-slots">
          No time slots available for this date.
        </div>
      )}


      <div style={{ marginTop: "35px" }}>
        <Heading2 text="Upcoming Appointment" />
        <Tabs tabs={appointmentTabs} variant="Horizontal" />
      </div>


      <div style={{ marginTop: "35px" }}>
        <Heading2 text="User List" />
        <GlobalTableList
          flag={[2, 4]}
          columns={parentColumns}
          filteredUserId={filteredUserId}
          showSearch={false}
          showAddButton={false}
          showPagination={false}
          showChooseColumns={false}
          selectable={false}
          showSort={false}
          onViewAll={() => navigate(routes.THERAPIST_PARENT || "/therapist/parent")}
          limit={4}
        />
      </div>
    </>
  );
};

export default Dashboard;