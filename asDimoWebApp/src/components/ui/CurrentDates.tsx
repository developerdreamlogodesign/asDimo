import React from "react";
import "./UIstyles.css";

interface DateSlot {
  date: Date;
}

interface DateSlotsProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const CurrentDates: React.FC<DateSlotsProps> = ({
  onDateSelect,
  selectedDate,
}) => {
  const today = new Date();

  const dates: DateSlot[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      date,
    };
  });

  const currentMonth = today.toLocaleDateString("en-US", {
    month: "long",
  });

  const isSelected = (date: Date) => {
    if (!selectedDate) {
      return date.toDateString() === today.toDateString();
    }

    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="date-container">
      <div className="currentMonth">
        {currentMonth}
      </div>

      <div className="date-slots">
        {dates.map(({ date }) => {
          const day = date.toLocaleDateString("en-US", {
            weekday: "short",
          });

          const selected = isSelected(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`date-slot ${
                selected ? "selected" : ""
              }`}
              onClick={() => onDateSelect?.(date)}
            >
              <span className="date-day">
                {day}
              </span>

              <span className="date-number">
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CurrentDates;