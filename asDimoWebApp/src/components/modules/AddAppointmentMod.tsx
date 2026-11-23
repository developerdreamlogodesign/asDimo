import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  Building2,
  Stethoscope,
  UserRound,
  CalendarDays,
  Video,
  House,
  Hospital,
} from "lucide-react";

import ProfileForm from "../ui/FormAdd";
import type { Field } from "../ui/FormAdd";
import DashboardButtons from "../ui/Buttons";
import Calendar from "../ui/CalenderAppointment";
import Loader from "../ui/Loaders";
import { BASE_URL } from "../../api/config";
import { tokenManager, getDoneBy } from "../../services/tokenManager";
import "./BookAppointment.css";

type SessionType = "Video Session" | "Clinic Session" | "Home Session";
type PaymentStatus = "Paid" | "Unpaid";

interface AvailabilitySlot {
  _id: string;
  userId: number;
  date: string; // dd-mm-yyyy
  time: string;
  isBooked: boolean;
  medium?: "center" | "home" | "online" | string;
  zoomLink?: string | null;
  zoomMeetingId?: string | null;
}

interface TeacherAvailabilityItem {
  _id: string;
  userId: number;
  name: string;
  email?: string;
  availabilities?: AvailabilitySlot[];
  [key: string]: any;
}

const sessions: {
  name: SessionType;
  medium: "online" | "center" | "home";
  icon: React.ReactNode;
}[] = [
  { name: "Video Session", medium: "online", icon: <Video /> },
  { name: "Clinic Session", medium: "center", icon: <Hospital /> },
  { name: "Home Session", medium: "home", icon: <House /> },
];

const formatToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDDMMYYYY = (dateStr: string): Date | null => {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const BookAppointment: React.FC = () => {
  const [loadingParents, setLoadingParents] = useState<boolean>(true);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);

  const [parentOptions, setParentOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [cityOptions, setCityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [teachersList, setTeachersList] = useState<TeacherAvailabilityItem[]>(
    []
  );

  const [appointmentFormData, setAppointmentFormData] = useState<
    Record<string, any>
  >({
    parent: "",
    category: "",
    city: "",
    therapist: "",
  });

  const [formKey, setFormKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<
    Partial<Record<SessionType, string>>
  >({});

  const [payment, setPayment] = useState<PaymentStatus>("Unpaid");
  const [payableAmount, setPayableAmount] = useState("");
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch Parents (with full-screen loader), Categories, and Cities on mount
  useEffect(() => {
    let isMounted = true;

    const getAuthHeaders = () => {
      const token =
        tokenManager.getAccessToken() || localStorage.getItem("token");
      return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    };

    const fetchInitialData = async () => {
      setLoadingParents(true);
      const headers = getAuthHeaders();

      try {
        const parentRes = await fetch(`${BASE_URL}/auth/getUsersByForParent`, {
          method: "GET",
          headers,
        });
        const parentJson = await parentRes.json();
        const parents = Array.isArray(parentJson?.data) ? parentJson.data : [];

        // if (isMounted) {
        //   setParentOptions(
        //     parents.map((parent: any) => ({
        //       label: parent.email
        //         ? `${parent.name} (${parent.email})`
        //         : parent.name,
        //       value: String(parent.userId ?? parent._id),
        //     }))
        //   );
        // }
        
        if (isMounted) {
          setParentOptions(
            parents
              .sort((a: any, b: any) =>
                String(a.name || "").toLowerCase()
                  .localeCompare(String(b.name || "").toLowerCase())
              )
              .map((parent: any) => ({
                label: parent.email
                  ? `${parent.name} (${parent.email})`
                  : parent.name,
                value: String(parent.userId ?? parent._id),
              }))
          );
        }

      } catch (error) {
        console.error("Error fetching parents:", error);
        if (isMounted) {
          setParentOptions([]);
        }
      } finally {
        if (isMounted) {
          setLoadingParents(false);
        }
      }

      // Fetch Therapist Categories
      try {
        const catRes = await fetch(`${BASE_URL}/auth/therapist-categories`, {
          method: "GET",
          headers,
        });
        const catJson = await catRes.json();
        const categories = Array.isArray(catJson?.data) ? catJson.data : [];

        if (isMounted) {
          setCategoryOptions(
            categories.map((cat: string) => ({
              label: cat,
              value: cat,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching therapist categories:", error);
        if (isMounted) {
          setCategoryOptions([]);
        }
      }

      // Fetch Cities
      try {
        const cityRes = await fetch(`${BASE_URL}/auth/cities`, {
          method: "GET",
          headers,
        });
        const cityJson = await cityRes.json();
        const cities = Array.isArray(cityJson?.data) ? cityJson.data : [];

        if (isMounted) {
          setCityOptions(
            cities.map((city: string) => ({
              label: city,
              value: city,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        if (isMounted) {
          setCityOptions([]);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedParent = appointmentFormData.parent || "";
  const selectedCategory = appointmentFormData.category || "";
  const selectedCity = appointmentFormData.city || "";
  const selectedTherapist = appointmentFormData.therapist || "";

  // 2. Fetch Teachers & Availabilities when Parent, Category, and City are selected
  useEffect(() => {
    let isMounted = true;

    if (!selectedParent || !selectedCategory || !selectedCity) {
      setTeachersList([]);
      return;
    }

    const fetchTeachersAvailability = async () => {
      try {
        setLoadingTeachers(true);
        const token =
          tokenManager.getAccessToken() || localStorage.getItem("token");

        const res = await fetch(
          `${BASE_URL}/auth/getTeachersAvailabilityByCityAndCategory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              city: selectedCity,
              therapist_category: selectedCategory,
            }),
          }
        );

        const response = await res.json();
        const teachers: TeacherAvailabilityItem[] = Array.isArray(
          response?.data
        )
          ? response.data
          : [];

        if (isMounted) {
          setTeachersList(teachers);

          if (teachers.length > 0) {
            const singleTherapistId = String(
              teachers[0].userId ?? teachers[0]._id
            );
            setAppointmentFormData((prev) => ({
              ...prev,
              therapist: singleTherapistId,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching teachers availability:", error);
        if (isMounted) {
          setTeachersList([]);
        }
      } finally {
        if (isMounted) {
          setLoadingTeachers(false);
        }
      }
    };

    fetchTeachersAvailability();

    return () => {
      isMounted = false;
    };
  }, [selectedParent, selectedCategory, selectedCity]);

  const therapistOptions = useMemo(() => {
    return teachersList.map((teacher) => ({
      label: teacher.name,
      value: String(teacher.userId ?? teacher._id),
    }));
  }, [teachersList]);

  const selectedTeacherFees = useMemo<string>(() => {
    if (!selectedTherapist) return "";
    const matchedTeacher = teachersList.find(
      (t) => String(t.userId ?? t._id) === String(selectedTherapist)
    );
    const fees =
      matchedTeacher?.teacherData?.fees ??
      matchedTeacher?.roleData?.fees ??
      matchedTeacher?.fees;
    return fees !== undefined && fees !== null && String(fees).trim() !== ""
      ? String(fees)
      : "";
  }, [teachersList, selectedTherapist]);

  useEffect(() => {
    if (payment === "Unpaid" && String(payableAmount).trim() === "" && selectedTeacherFees) {
      setPayableAmount(selectedTeacherFees);
    }
  }, [payment, selectedTeacherFees]);

  // Active teacher(s) whose availabilities we inspect
  const activeAvailabilities = useMemo<AvailabilitySlot[]>(() => {
    if (!selectedParent || !selectedCategory || !selectedCity) return [];

    if (selectedTherapist) {
      const matchedTeacher = teachersList.find(
        (t) => String(t.userId ?? t._id) === String(selectedTherapist)
      );
      return Array.isArray(matchedTeacher?.availabilities)
        ? matchedTeacher.availabilities
        : [];
    }

    return [];
  }, [
    selectedParent,
    selectedCategory,
    selectedCity,
    selectedTherapist,
    teachersList,
  ]);

  // Unbooked availabilities (isBooked === false)
  const unbookedAvailabilities = useMemo<AvailabilitySlot[]>(() => {
    return activeAvailabilities.filter(
      (slot) => slot && slot.isBooked === false && Boolean(slot.date)
    );
  }, [activeAvailabilities]);

  // Dates (dd-mm-yyyy) to highlight on Calendar
  const availableDates = useMemo<string[]>(() => {
    const uniqueDates = new Set<string>();
    unbookedAvailabilities.forEach((slot) => {
      if (slot.date) {
        uniqueDates.add(slot.date.trim());
      }
    });
    return Array.from(uniqueDates);
  }, [unbookedAvailabilities]);

  // Auto-select the first available date in the current month (>= today) when availabilities change
  useEffect(() => {
    if (!selectedTherapist || availableDates.length === 0) {
      setSelectedDate(null);
      setSelectedTimes({});
      return;
    }

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    const currentMonthUpcomingDates = availableDates
      .map((d) => parseDDMMYYYY(d))
      .filter(
        (d): d is Date =>
          d !== null &&
          d.getTime() >= todayStart &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
      )
      .sort((a, b) => a.getTime() - b.getTime());

    if (currentMonthUpcomingDates.length > 0) {
      setSelectedDate(currentMonthUpcomingDates[0]);
    } else {
      setSelectedDate(null);
    }
    setSelectedTimes({});
  }, [selectedTherapist, availableDates]);

  // Group unbooked times by medium for the currently selected date
  const selectedDateKey = selectedDate ? formatToDDMMYYYY(selectedDate) : null;

  const timesBySession = useMemo<Record<SessionType, string[]>>(() => {
    const grouped: Record<SessionType, string[]> = {
      "Video Session": [],
      "Clinic Session": [],
      "Home Session": [],
    };

    if (!selectedDateKey) return grouped;

    unbookedAvailabilities.forEach((slot) => {
      if (slot.date?.trim() !== selectedDateKey || !slot.time) return;

      const medium = String(slot.medium ?? "").toLowerCase();
      if (medium === "online") {
        if (!grouped["Video Session"].includes(slot.time)) {
          grouped["Video Session"].push(slot.time);
        }
      } else if (medium === "center") {
        if (!grouped["Clinic Session"].includes(slot.time)) {
          grouped["Clinic Session"].push(slot.time);
        }
      } else if (medium === "home") {
        if (!grouped["Home Session"].includes(slot.time)) {
          grouped["Home Session"].push(slot.time);
        }
      }
    });

    return grouped;
  }, [unbookedAvailabilities, selectedDateKey]);

  const hasAnyUnbookedAvailability = unbookedAvailabilities.length > 0;
  const hasAnyTimeForSelectedDate =
    timesBySession["Video Session"].length > 0 ||
    timesBySession["Clinic Session"].length > 0 ||
    timesBySession["Home Session"].length > 0;

  const isAllDropdownsSelected = Boolean(
    selectedParent && selectedCategory && selectedCity && selectedTherapist
  );

  // Handle cascading form state resets when parent/category/city/therapist changes
  const handleFormChange = (updatedData: Record<string, any>) => {
    setAppointmentFormData((prev) => {
      const next = { ...updatedData };

      if (next.parent !== prev.parent) {
        next.category = "";
        next.city = "";
        next.therapist = "";
        setSelectedDate(null);
        setSelectedTimes({});
        setPayableAmount("");
      } else if (next.category !== prev.category) {
        next.city = "";
        next.therapist = "";
        setSelectedDate(null);
        setSelectedTimes({});
        setPayableAmount("");
      } else if (next.city !== prev.city) {
        next.therapist = "";
        setSelectedDate(null);
        setSelectedTimes({});
        setPayableAmount("");
      } else if (next.therapist !== prev.therapist) {
        setSelectedDate(null);
        setSelectedTimes({});
        setPayableAmount("");
      }

      return next;
    });
  };

  const dynamicAppointmentFields: Field[] = [
    {
      name: "parent",
      label: "Select Parent",
      fieldType: "select",
      width: "full",
      required: true,
      placeholder: "Select Parent",
      icon: <UserRound />,
      value: selectedParent,
      options: parentOptions,
    },
    {
      name: "category",
      label: "Select Category",
      fieldType: "select",
      width: "half",
      required: true,
      placeholder: "Select Category",
      icon: <LayoutGrid />,
      value: selectedCategory,
      readOnly: !selectedParent,
      options: categoryOptions,
    },
    {
      name: "city",
      label: "Select City",
      fieldType: "select",
      width: "half",
      required: true,
      placeholder: "Select City",
      icon: <Building2 />,
      value: selectedCity,
      readOnly: !selectedParent || !selectedCategory,
      options: cityOptions,
    },
    {
      name: "therapist",
      label: "Select Therapist",
      fieldType: "select",
      width: "full",
      required: true,
      placeholder: loadingTeachers
        ? "Loading Therapists..."
        : selectedCity && therapistOptions.length === 0
        ? "No Therapist Available"
        : "Select Therapist",
      icon: <Stethoscope />,
      value: selectedTherapist,
      readOnly:
        !selectedParent ||
        !selectedCategory ||
        !selectedCity ||
        loadingTeachers,
      options: therapistOptions,
    },
  ];

  const handleTimeSelect = (session: SessionType, time: string) => {
    if (!isAllDropdownsSelected) return;
    setFormMessage(null);
    setSelectedTimes({
      [session]: time,
    });
  };

  const handleCancel = (clearMessage = true) => {
    if (clearMessage) {
      setFormMessage(null);
    }
    setAppointmentFormData({
      parent: "",
      category: "",
      city: "",
      therapist: "",
    });
    setTeachersList([]);
    setFormKey((previous) => previous + 1);
    setSelectedDate(null);
    setSelectedTimes({});
    setPayment("Unpaid");
    setPayableAmount("");
  };

  const handleBooking = async () => {
    setFormMessage(null);

    if (!isAllDropdownsSelected) {
      setFormMessage({
        type: "error",
        text: "Please select Parent, Category, City and Therapist.",
      });
      return;
    }

    if (!selectedDate) {
      setFormMessage({
        type: "error",
        text: "Please select an appointment date.",
      });
      return;
    }

    const selectedTime = Object.values(selectedTimes).find(Boolean);
    if (!selectedTime) {
      setFormMessage({
        type: "error",
        text: "Please select at least one session time.",
      });
      return;
    }

    const token =
      tokenManager.getAccessToken() || localStorage.getItem("token");

    const effectivePayableAmount =
      String(payableAmount).trim() !== ""
        ? String(payableAmount).trim()
        : selectedTeacherFees;

    if (
      payment === "Unpaid" &&
      String(payableAmount).trim() === "" &&
      selectedTeacherFees
    ) {
      setPayableAmount(selectedTeacherFees);
    }

    const payload = {
      teacherId: Number(selectedTherapist),
      parentId: Number(selectedParent),
      date: formatToDDMMYYYY(selectedDate),
      time: selectedTime,
      paymentId: payment === "Paid" ? "paid" : " ",
      paymentStatus: payment === "Paid" ? "completed" : "pending",
      ...(payment === "Unpaid" && effectivePayableAmount !== ""
        ? { amount: Number(effectivePayableAmount) }
        : {}),
      doneBy: getDoneBy(),
    };

    try {
      setSubmittingBooking(true);

      const res = await fetch(`${BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const response = await res.json().catch(() => null);

      if (!res.ok || !response?.success) {
        throw new Error(response?.message || "Failed to book appointment.");
      }

      handleCancel(false);
      setFormMessage({
        type: "success",
        text: response?.message || "Appointment created successfully",
      });
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      setFormMessage({
        type: "error",
        text: error?.message || "Failed to book appointment.",
      });
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loadingParents) {
    return <Loader fullScreen />;
  }

  return (
    <div className="appointment-form">
      {/* Appointment Details */}
      <div className="appointment-profile-form">
        <ProfileForm
          key={formKey}
          fields={dynamicAppointmentFields}
          showProfilePicture={false}
          showSubmitButton={false}
          onSubmit={() => {}}
          onChange={handleFormChange}
        />
      </div>

      {/* Date and Time */}
      <div
        className={`form-group full-width date-section ${
          !isAllDropdownsSelected ? "disabled-section" : ""
        }`}
      >
        <label className="section-label">
          <span className="section-icon">
            <CalendarDays />
          </span>
          Select Date
        </label>

        <div className="date-time-container">
          <div className="appointment-calendar">
            <Calendar
              value={selectedDate ?? undefined}
              onChange={(date) => {
                if (!isAllDropdownsSelected) return;
                setSelectedDate(date);
                setSelectedTimes({});
              }}
              minDate={new Date()}
              availableDates={availableDates}
              disabled={!isAllDropdownsSelected}
            />
          </div>

          {/* Time Slots */}
          <div className="time-slots-container">
            <h3>Select Time</h3>

            {(isAllDropdownsSelected ||
              (selectedParent &&
                selectedCategory &&
                selectedCity &&
                !loadingTeachers &&
                teachersList.length === 0)) &&
            (!hasAnyUnbookedAvailability || !hasAnyTimeForSelectedDate) ? (
              <p className="not-available-time">not avialable time</p>
            ) : (
              sessions.map((session) => {
                const slotsForSession = isAllDropdownsSelected
                  ? timesBySession[session.name]
                  : [];

                return (
                  <div className="session-group" key={session.name}>
                    <div className="session-heading">
                      <span>{session.icon}</span>
                      <p>{session.name}</p>
                    </div>

                    <div className="time-buttons">
                      {slotsForSession.length > 0 ? (
                        slotsForSession.map((time) => (
                          <button
                            type="button"
                            key={time}
                            disabled={!isAllDropdownsSelected}
                            className={
                              selectedTimes[session.name] === time
                                ? "selected-time"
                                : ""
                            }
                            onClick={() => handleTimeSelect(session.name, time)}
                          >
                            {time}
                          </button>
                        ))
                      ) : isAllDropdownsSelected ? (
                        <p className="not-available-time">not avialable time</p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div
        className={`payment-options ${
          !isAllDropdownsSelected ? "disabled-section" : ""
        }`}
      >
        <label>
          <input
            type="radio"
            name="payment"
            value="Paid"
            disabled={!isAllDropdownsSelected}
            checked={payment === "Paid"}
            onChange={() => setPayment("Paid")}
          />
          <span className="custom-radio" />
          Paid
        </label>

        <label>
          <input
            type="radio"
            name="payment"
            value="Unpaid"
            disabled={!isAllDropdownsSelected}
            checked={payment === "Unpaid"}
            onChange={() => setPayment("Unpaid")}
          />
          <span className="custom-radio" />
          Unpaid
        </label>
      </div>

      {/* Footer */}
      {formMessage && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            fontSize: "15px",
            fontWeight: 600,
            backgroundColor:
              formMessage.type === "success" ? "#e9fbfb" : "#fff4f4",
            color: formMessage.type === "success" ? "#31b68f" : "#e63517",
            border: `1px solid ${
              formMessage.type === "success" ? "#38b991" : "#e63517"
            }`,
          }}
        >
          {formMessage.text}
        </div>
      )}

      <div
        className={`appointment-footer ${
          !isAllDropdownsSelected ? "disabled-section" : ""
        }`}
      >
        {payment === "Unpaid" && (
          <div className="payable-amount">
            <label>Payable Amount -</label>
            <span>₹</span>
            <input
              type="number"
              min="0"
              disabled={!isAllDropdownsSelected}
              placeholder={selectedTeacherFees || "0"}
              value={payableAmount}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setPayableAmount(event.target.value)
              }
              onBlur={() => {
                if (String(payableAmount).trim() === "" && selectedTeacherFees) {
                  setPayableAmount(selectedTeacherFees);
                }
              }}
            />
          </div>
        )}

        <div className="TimeSlotsActions d-flex">
          <DashboardButtons
            text="Cancel"
            variant="SolidBlue"
            textsize="md"
            type="button"
            disabled={!isAllDropdownsSelected}
            onClick={() => handleCancel(true)}
          />

          <DashboardButtons
            text={submittingBooking ? "Booking..." : "Book Appointment"}
            variant="SolidYellow"
            textsize="md"
            type="submit"
            disabled={!isAllDropdownsSelected || submittingBooking}
            onClick={handleBooking}
          />
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
