import React, { useEffect, useState } from "react";
import Tabs from "./Tabs";
import "./Calendar.css";
import { Heading2 } from "../../components/ui/HeadingPara";
import DashboardButtons from "../../components/ui/Buttons";
import {
  Video,
  House,
  Stethoscope,
} from "lucide-react";

type AppointmentType = "online" | "home" | "center";
const FIXED_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:30", "15:30", "16:30", "17:30", "19:00", "20:00"];

export interface AvailabilitySlot { _id?: string; date: string; time: string; medium?: AppointmentType; isBooked: boolean; }

interface TimeSlotsProps {
  selectedDate: Date | null;
  slots: AvailabilitySlot[];
  onSave: (slot: AvailabilitySlot) => Promise<void>;
}

const TimeSlots: React.FC<TimeSlotsProps> = ({
  selectedDate,
  slots,
  onSave,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const dateKey = selectedDate ? `${String(selectedDate.getDate()).padStart(2, "0")}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${selectedDate.getFullYear()}` : "";

  useEffect(() => { setSelectedSlot(null); setIsEditing(false); }, [selectedDate]);

  const saveSelectedSlot = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    try {
      await onSave(selectedSlot);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const renderTimeSlots = (
    type: AppointmentType
  ) => {
    const dateSlots = slots.filter((slot) => slot.date === dateKey);

    return <>
      <div className="TimeSlotsHeading">
        <Heading2 text="Available Time Slots" />
      </div>

      <div className="TimeSlots">
        {FIXED_TIME_SLOTS.map((time) => {
          const slot = dateSlots.find((availableSlot) => availableSlot.time === time);
          const isPresent = Boolean(slot);
          const isBooked = Boolean(slot?.isBooked);
          const slotForSelection = slot || { _id: `${dateKey}-${type}-${time}`, date: dateKey, time, medium: type, isBooked: false };
          const mediumLabel = slot?.medium ? slot.medium.charAt(0).toUpperCase() + slot.medium.slice(1) : "Available";

          return (
            <button
              key={time}
              type="button"
              disabled={!isEditing || isPresent}
              title={isPresent ? `Medium: ${mediumLabel}` : undefined}
              className={`TimeSlotButton ${selectedSlot?._id === slotForSelection._id ? "selected" : ""} ${isPresent ? "api-available" : ""} ${isBooked ? "booked" : ""}`}
              onClick={() => setSelectedSlot(slotForSelection)}
            >
              {time}{isBooked ? " (Booked)" : ""}
            </button>
          );
        })}
      </div>
      <div className="TimeSlotsActions d-flex">
          {!isEditing ? (
            <DashboardButtons text="Change Time" variant="OrangeSolid" onClick={() => setIsEditing(true)}/>
          ) : (
            <>
            <DashboardButtons text={saving ? "Saving..." : "Save"} variant="neon" onClick={saveSelectedSlot} disabled={!selectedSlot || saving}/>
            <DashboardButtons text="Cancel" variant="OrangeSolid" onClick={() => { setSelectedSlot(null); setIsEditing(false); }}/>
            </>
          )}
        </div>
    </>;
  };

  const tabs = [
    {
      id: "online",
      label: (
        <span className="AppointmentTab">
          <Video size={45} />
          <span>Video Appointments</span>
        </span>
      ),
      content: renderTimeSlots("online"),
    },
    {
      id: "home",
      label: (
        <span className="AppointmentTab">
          <House size={45} />
          <span>Home Appointments</span>
        </span>
      ),
      content: renderTimeSlots("home"),
    },
    {
      id: "center",
      label: (
        <span className="AppointmentTab">
          <Stethoscope size={45} />
          <span>Clinic Appointments</span>
        </span>
      ),
      content: renderTimeSlots("center"),
    },
  ];

  if (!selectedDate) {
    return (
      <div className="TimeSlotsWrapper">
        <p>Please select a date first.</p>
      </div>
    );
  }

  return (
    <div className="TimeSlotsWrapper">
      <Tabs
        tabs={tabs}
        variant="Horizontal"
      />
    </div>
  );
};

export default TimeSlots;