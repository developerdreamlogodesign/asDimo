import React, { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-animated";

interface AppointmentCalendarProps {
  appointments: string[];
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
}) => {
  const today = new Date();

  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);

  const [currentMonth, setCurrentMonth] = useState(minMonth);

  // Move it here
  const [showFullCurrentMonth, setShowFullCurrentMonth] =
    useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Days in current selected month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isCurrentMonth =
    year === today.getFullYear() &&
    month === today.getMonth();

  // Show only 5 days in current month
const startDay =
  isCurrentMonth && !showFullCurrentMonth
    ? Math.max(1, today.getDate() - 2)
    : 1;

const endDay =
  isCurrentMonth && !showFullCurrentMonth
    ? Math.min(daysInMonth, today.getDate() + 2)
    : daysInMonth;

  const visibleDays = Array.from(
    { length: endDay - startDay + 1 },
    (_, i) => startDay + i
  );

  const isPrevDisabled =
    year === minMonth.getFullYear() &&
    month === minMonth.getMonth();

  const isNextDisabled =
    year === maxMonth.getFullYear() &&
    month === maxMonth.getMonth();

  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <button
          disabled={isPrevDisabled}
            onClick={() => {
            if (isCurrentMonth && showFullCurrentMonth) {
                // Collapse back to the 5-day view
                setShowFullCurrentMonth(false);
            } else {
                setCurrentMonth(new Date(year, month - 1, 1));
                setShowFullCurrentMonth(false);
            }
            }}
        >
          <ChevronLeftIcon size={18} />
        </button>

        <h3>{monthName}</h3>

        <button
          disabled={isNextDisabled}
            onClick={() => {
            if (isCurrentMonth && !showFullCurrentMonth) {
                // First click: expand current month
                setShowFullCurrentMonth(true);
            } else {
                // Second click: move to next month
                setCurrentMonth(new Date(year, month + 1, 1));
                setShowFullCurrentMonth(false);
            }
            }}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="calendar-days">
        {visibleDays.map((day) => {
          const date = new Date(year, month, day);

          const formatted = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;

          const hasAppointment = appointments.includes(formatted);

          const isToday =
            date.toDateString() === today.toDateString();

          return (
            <div
              key={day}
            className={`day-card
            ${isToday ? "today" : ""}
            ${hasAppointment ? "appointment" : ""}
            `}
            >
              <span className="weekday">
                {weekDays[date.getDay()]}
              </span>

              <span className="day-number">{day}</span>

            {hasAppointment && (
            <>
                <span className="appointment-dot" />
                <span className="appointment-badge">Booked</span>
            </>
            )}
            </div>
          );
})}
      </div>
    </div>
  );
};

export default AppointmentCalendar;
