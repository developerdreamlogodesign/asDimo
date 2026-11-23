import React, { useEffect, useState } from "react";
import Calendar from "../../components/ui/CalenderAppointment";
import TimeSlots, { type AvailabilitySlot } from "../../components/ui/TimeSlots";
import { Heading2 } from "../../components/ui/HeadingPara";
import { BASE_URL } from "../../api/config";
import { tokenManager } from "../../services/tokenManager";

const AppointmentDetails: React.FC = () => {

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSlots = async () => {
      const userId = tokenManager.getUser()?.userId;
      if (!userId) { setMessage("Logged-in user was not found"); setLoading(false); return; }
      try {
        const response = await fetch(`${BASE_URL}/appointments/available-slots/${userId}`, { headers: { Authorization: `Bearer ${tokenManager.getAccessToken() || ""}` } });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load available slots");
        setSlots(data.data || []);
      } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load available slots"); }
      finally { setLoading(false); }
    };
    loadSlots();
  }, []);

  const handleSave = async (slot: AvailabilitySlot) => {
    const userId = tokenManager.getUser()?.userId;
    try {
      const response = await fetch(`${BASE_URL}/therapists/availability`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenManager.getAccessToken() || ""}` }, body: JSON.stringify({ userId, date: slot.date, time: slot.time, medium: slot.medium || "online" }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save availability");
      const savedSlot = data.data?.user as AvailabilitySlot | undefined;
      if (savedSlot) {
        setSlots((currentSlots) => [
          ...currentSlots.filter((currentSlot) => currentSlot._id !== savedSlot._id),
          savedSlot,
        ]);
      }
      setMessage("Availability saved successfully");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save availability");
      throw error;
    }
  };

  
  return (
    <div className="AppointmentDetails">

      <div className="AppointmentDate">
       <Heading2 text="Calendar"/>

        <Calendar minDate={new Date()} value={selectedDate || undefined} availableDates={Array.from(new Set(slots.map((slot) => slot.date)))} onChange={setSelectedDate} />
      </div>

      {loading && <p>Loading availability...</p>}
      {message && <p>{message}</p>}
      <TimeSlots selectedDate={selectedDate} slots={slots} onSave={handleSave} />
    </div>
  );
};

export default AppointmentDetails;