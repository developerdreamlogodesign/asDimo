import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserIcon, ArrowLeftIcon, HomeIcon, CalendarDaysIcon, XIcon, IdCardIcon, CheckIcon } from 'lucide-animated';
import { Heading1, Paragraph, Paragraph2 } from "../../components/ui/HeadingPara";
import DashboardButtons from "../../components/ui/Buttons";
import { BASE_URL, filebasename } from "../../api/config";
import { tokenManager, getDoneBy } from "../../services/tokenManager";
import Loader from "../../components/ui/Loaders";
import { getCurrentUserRole } from "../../middleware/AuthMiddleware";
import "./AppointmentDetails.css";
import "../../components/ui/UIstyles.css";
import Button from "../../components/ui/Buttons";
// import ModalBox from "../../components/ui/ModalBox";

interface UserDetails {
  userId?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string;
  city?: string;
  state?: string;
  profileImg?: string | null;
  childAge?: string | null;
}

interface AppointmentDetailsData {
  _id: string;
  parentId: number;
  teacherId: number;
  date: string;
  time: string;
  status: string;
  doneBy?: string;
  paymentStatus?: string;
  amount?: number;
  paymentId?: string | number;
  razorpayPaymentId?: string;
  zoomLink?: string;
  teacher?: { therapist_category?: string };
  teacherUser?: UserDetails;
  parentUser?: UserDetails;
  childDetails?: any;
  organization?: UserDetails;
  zonalAdmin?: UserDetails;
  admin?: UserDetails;
}

interface PaymentDetailsData {
  user?: UserDetails;
  orderId?: string;
  receipt?: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
  metadata?: {
    webhookEvent?: {
      payload?: {
        payment?: { entity?: { method?: string } };
      };
    };
  };
  createdAt?: string;
  paymentId?: number;
  razorpayPaymentId?: string;
}

interface AvailableSlot {
  _id: string;
  userId: number;
  date: string;
  time: string;
  isBooked: boolean;
}

const valueOrFallback = (value?: string | number | null) =>
  value === undefined || value === null || value === "" ? "N/A" : String(value);

const dateValue = (date: string) => {
  const [day, month, year] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"reschedule" | "cancel" | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState<"approved" | "rejected" | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailsData | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const currentUser = tokenManager.getUser();
  const userFlag = currentUser?.flag !== undefined ? Number(currentUser.flag) : null;

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) {
        setError("Appointment ID is missing");
        setLoading(false);
        return;
      }

      try {
        const token = tokenManager.getAccessToken();
        const response = await fetch(`${BASE_URL}/appointments/${appointmentId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const responseData = await response.json().catch(() => null);

        if (!response.ok || !responseData?.success) {
          throw new Error(responseData?.message || "Unable to load appointment details");
        }

        const appointmentData = responseData.data as AppointmentDetailsData;
        setAppointment(appointmentData);

        const paymentId = appointmentData.paymentId ?? appointmentData.razorpayPaymentId;
        if (paymentId !== undefined && paymentId !== null && String(paymentId).trim() !== "") {
          setPaymentLoading(true);
          const paymentResponse = await fetch(
            `${BASE_URL}/payments/${encodeURIComponent(String(paymentId))}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          const paymentResponseData = await paymentResponse.json().catch(() => null);

          if (!paymentResponse.ok || !paymentResponseData?.success) {
            setPaymentDetails(null);
          } else {
            setPaymentDetails((paymentResponseData.data as PaymentDetailsData) || null);
          }

          // paymentDetails handled above
        }

        if (appointmentData.teacherUser?.userId) {
          setSlotsLoading(true);
          const slotsResponse = await fetch(
            `${BASE_URL}/appointments/available-slots/${appointmentData.teacherUser.userId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          const slotsResponseData = await slotsResponse.json().catch(() => null);

          if (!slotsResponse.ok || !slotsResponseData?.success) {
            throw new Error(slotsResponseData?.message || "Unable to load available slots");
          }

          const slots = (slotsResponseData.data || []).filter(
            (slot: AvailableSlot) => !slot.isBooked
          );
          setAvailableSlots(slots);
        }
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.message === "Unable to load payment details") {
          setPaymentError(fetchError.message);
        } else {
          setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
        }
      } finally {
        setSlotsLoading(false);
        setPaymentLoading(false);
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  const today = new Date();
  const todayValue = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const rescheduleSlots = availableSlots.filter(
    (slot) => dateValue(slot.date) > todayValue
  );
  const availableDates = Array.from(new Set(rescheduleSlots.map((slot) => slot.date)));
  const availableTimes = rescheduleSlots
    .filter((slot) => slot.date === selectedDate)
    .map((slot) => slot.time);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(rescheduleSlots.find((slot) => slot.date === date)?.time || "");
  };

  const closeModal = () => {
    if (!actionLoading) {
      setActiveModal(null);
      setActionError(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment || !cancellationReason.trim()) {
      setActionError("Cancellation reason is required");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(`${BASE_URL}/appointments/cancel/${appointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          reason: cancellationReason.trim(),
          doneBy: getDoneBy(userFlag),
        }),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.success) {
        throw new Error(responseData?.message || "Unable to cancel appointment");
      }

      let updatedStatus = responseData.data?.status || "cancelled";

      // // If superadmin (0), zonal admin (6), or admin (7), auto-call status update to "approved"
      // if (userFlag !== null && [0, 6, 7].includes(userFlag)) {
      //   try {
      //     const statusRes = await fetch(`${BASE_URL}/therapists/appointments/status`, {
      //       method: "PATCH",
      //       headers: {
      //         "Content-Type": "application/json",
      //         Authorization: token ? `Bearer ${token}` : "",
      //       },
      //       body: JSON.stringify({
      //         appointmentId: appointment._id,
      //         status: "approved",
      //         doneBy: getDoneBy(userFlag),
      //       }),
      //     });
      //     const statusData = await statusRes.json().catch(() => null);
      //     if (statusData?.data?.status) {
      //       updatedStatus = statusData.data.status;
      //     } else {
      //       updatedStatus = "approved";
      //     }
      //   } catch (statusErr) {
      //     console.error("Error auto-approving appointment after cancel:", statusErr);
      //   }
      // }

      setAppointment((current) => current ? { ...current, status: updatedStatus } : current);
      setActiveModal(null);
      setCancellationReason("");
    } catch (cancelError) {
      setActionError(cancelError instanceof Error ? cancelError.message : String(cancelError));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!appointment || !selectedDate || !selectedTime || !rescheduleReason.trim()) {
      setActionError("Date, time, and reschedule reason are required");
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(`${BASE_URL}/appointments/reschedule/${appointment._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          reason: rescheduleReason.trim(),
          doneBy: getDoneBy(userFlag),
        }),
      });
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.success) {
        throw new Error(responseData?.message || "Unable to reschedule appointment");
      }

      let updatedStatus = responseData?.data?.status || appointment.status || "rescheduled";

      // If superadmin (0), zonal admin (6), or admin (7), auto-call status update to "approved"
      // if (userFlag !== null && [0, 6, 7].includes(userFlag)) {
      //   try {
      //     const statusRes = await fetch(`${BASE_URL}/therapists/appointments/status`, {
      //       method: "PATCH",
      //       headers: {
      //         "Content-Type": "application/json",
      //         Authorization: token ? `Bearer ${token}` : "",
      //       },
      //       body: JSON.stringify({
      //         appointmentId: appointment._id,
      //         status: "approved",
      //         doneBy: getDoneBy(userFlag),
      //       }),
      //     });
      //     const statusData = await statusRes.json().catch(() => null);
      //     if (statusData?.data?.status) {
      //       updatedStatus = statusData.data.status;
      //     } else {
      //       updatedStatus = "approved";
      //     }
      //   } catch (statusErr) {
      //     console.error("Error auto-approving appointment after reschedule:", statusErr);
      //   }
      // }

      setAppointment((current) => current ? {
        ...current,
        date: responseData.data?.date || selectedDate,
        time: responseData.data?.time || selectedTime,
        status: updatedStatus,
      } : current);
      setActiveModal(null);
      setRescheduleReason("");
    } catch (rescheduleError) {
      setActionError(rescheduleError instanceof Error ? rescheduleError.message : String(rescheduleError));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "approved" | "rejected") => {
    if (!appointment?._id) return;

    setStatusActionLoading(newStatus);
    setStatusMessage(null);

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(`${BASE_URL}/therapists/appointments/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          appointmentId: appointment._id,
          status: newStatus,
          doneBy: getDoneBy(userFlag),
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok || (responseData && responseData.success === false)) {
        throw new Error(responseData?.message || `Failed to update appointment status to ${newStatus}`);
      }

      const updatedStatus = responseData?.data?.status || newStatus;
      setAppointment((current) => current ? { ...current, status: updatedStatus } : current);
      setStatusMessage({
        type: "success",
        text: `Appointment status updated to "${newStatus}" successfully.`,
      });
    } catch (statusErr) {
      console.error("Status update error:", statusErr);
      setStatusMessage({
        type: "error",
        text: statusErr instanceof Error ? statusErr.message : "Failed to update appointment status",
      });
    } finally {
      setStatusActionLoading(null);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (error || !appointment) {
    return <div className="error-message appointment-details-error">{error || "Appointment not found"}</div>;
  }

  const isAllowedRole = userFlag !== null && [0, 1, 6, 7].includes(userFlag);
  const currentRole = getCurrentUserRole() ?? "";
  const isTeachersOrgOrGlobal = currentRole === "TeachersOrg" || currentRole === "teachersGlobal" || (userFlag !== null && [3, 5].includes(userFlag));
  const isTeacherRole = userFlag !== null && [3, 5].includes(userFlag);

  const appointmentStatus = (appointment.status || "").toLowerCase();
  const isCancelledOrRescheduled = appointmentStatus === "cancelled" || appointmentStatus === "canceled" || appointmentStatus === "rescheduled";
  const doneBy = (appointment.doneBy || "").toLowerCase();
  const isAdminDoneBy = ["admin", "superadmin", "zonaladmin"].includes(doneBy);

  const getDisplayStatus = () => {
    const rawStatus = appointment.status || "";
    if (!rawStatus) return "N/A";
    const rawStatusLower = rawStatus.toLowerCase();
    if (isAdminDoneBy) {
      if (["rejected", "cancelled", "canceled", "rescheduled"].includes(rawStatusLower)) {
        return `${rawStatus} by ${appointment.doneBy}`;
      }
      return `${rawStatus} by ${appointment.doneBy}`;
    }
    return rawStatus;
  };

  const showApproveReject = isAllowedRole && isCancelledOrRescheduled && !isAdminDoneBy;

  const parent = appointment.parentUser || {};
  const child = appointment.childDetails?.[0] || {};  
  const teacher = appointment.teacherUser || {};
  const imageUrl = parent.profileImg ? `${filebasename}${parent.profileImg}` : undefined;
  const patientName = valueOrFallback(parent.name);
  const childAge = valueOrFallback(child.childAge); 
  const patientInfo = [
    { label: "Parent Name", value: patientName },
    { label: "Appointment ID", value: appointment._id },
    { label: "Age", value: childAge + " years" },
  ];
  const contactInfo = [
    { label: "Contact Number", value: parent.phone },
    { label: "Email", value: parent.email },
    { label: "Address", value: [parent.address, parent.city, parent.state].filter(Boolean).join(", ") },
  ];
  const doctorInfo = [
    { label: "Doctor Name", value: teacher.name },
    { label: "Specialization", value: appointment.teacher?.therapist_category },
    { label: "Contact", value: teacher.phone },
    { label: "Appointment Date", value: appointment.date },
    { label: "Appointment Time", value: appointment.time },
    { label: "Status", value: getDisplayStatus() },
    { label: "Zoom Link", value: appointment.zoomLink },
  ];
  const organisationInfo = [
    { label: "Organisation Name", value: appointment.organization?.name },
    { label: "Admin Name", value: appointment.admin?.name },
    { label: "Zonal Admin Name", value: appointment.zonalAdmin?.name },
  ];
  const paymentMethod = paymentDetails?.metadata?.webhookEvent?.payload?.payment?.entity?.method;
  const paymentDate = paymentDetails?.createdAt
    ? new Date(paymentDetails.createdAt).toLocaleString()
    : undefined;

interface InfoRowProps {
  label: string;
  value?: string | number | null;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => 
      <div className="info-row">
          <span className="info-label">{label}</span>
          <strong className="info-value">{valueOrFallback(value)}</strong>
      </div>;
  return (
    <>
      <div className="appointment-header">
        <div>
          <Heading1 text="Appointment DETAILS" />
          <Paragraph text="View and manage appointment information." /></div>
          <div className="header-actions">
             {isAdminDoneBy ? (
               <div
                 className="status-display-badge"
                 style={{
                   padding: "8px 16px",
                   borderRadius: "6px",
                   fontWeight: 600,
                   fontSize: "14px",
                   textTransform: "capitalize",
                   backgroundColor:
                     appointmentStatus === "approved" || appointmentStatus === "completed"
                       ? "#e9fbfb"
                       : appointmentStatus === "cancelled" || appointmentStatus === "canceled" || appointmentStatus === "rejected"
                       ? "#fff4f4"
                       : "#eff6ff",
                   color:
                     appointmentStatus === "approved" || appointmentStatus === "completed"
                       ? "#31b68f"
                       : appointmentStatus === "cancelled" || appointmentStatus === "canceled" || appointmentStatus === "rejected"
                       ? "#e63517"
                       : "#2563eb",
                   border: `1px solid ${
                     appointmentStatus === "approved" || appointmentStatus === "completed"
                       ? "#38b991"
                       : appointmentStatus === "cancelled" || appointmentStatus === "canceled" || appointmentStatus === "rejected"
                       ? "#e63517"
                       : "#93c5fd"
                   }`,
                   display: "inline-flex",
                   alignItems: "center",
                 }}
               >
                 {getDisplayStatus()}
               </div>
             ) : showApproveReject ? (
               <>
                 <DashboardButtons 
                    text={statusActionLoading === "approved" ? "Approving..." : "Approve"} 
                    variant="DarkGreen" 
                    textsize="sm" 
                    icon={<CheckIcon size={18} />} 
                    disabled={statusActionLoading !== null}
                    onClick={() => handleUpdateStatus("approved")} 
                  />
                 <DashboardButtons 
                    text={statusActionLoading === "rejected" ? "Rejecting..." : "Reject"} 
                    variant="red" 
                    textsize="sm" 
                    icon={<XIcon size={18} />} 
                    disabled={statusActionLoading !== null}
                    onClick={() => handleUpdateStatus("rejected")} 
                 />
               </>
             ) : isTeacherRole && isCancelledOrRescheduled ? null : (
               <>
                 <DashboardButtons 
                    text="Reschedule" 
                    variant="blueborder" 
                    textsize="sm" 
                    icon={<CalendarDaysIcon size={18} />} 
                    onClick={() => { setActionError(null); 
                    setActiveModal("reschedule"); }} 
                  />
                 {!isTeachersOrgOrGlobal && (
                   <DashboardButtons 
                      text="Cancel Appointment" 
                      variant="redborder" 
                      textsize="sm" 
                      icon={<XIcon size={18} />} 
                      onClick={() => { setActionError(null); 
                      setActiveModal("cancel"); }} 
                    />
                 )}
               </>
             )}
             <DashboardButtons 
                text="Back to Appointments" 
                variant="blueborder" 
                textsize="sm" 
                icon={<ArrowLeftIcon size={18} />} 
                onClick={() => navigate(-1)} 
             />
          </div>
        </div>
        {statusMessage && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: "16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              backgroundColor: statusMessage.type === "success" ? "#e9fbfb" : "#fff4f4",
              color: statusMessage.type === "success" ? "#31b68f" : "#e63517",
              border: `1px solid ${statusMessage.type === "success" ? "#38b991" : "#e63517"}`,
            }}
          >
            {statusMessage.text}
          </div>
        )}
        <section className="details-card patient-card">
           <div className="card-title blue-title">
               <span className="title-icon">
               <UserIcon size={20} /></span>
               <Paragraph2 text="Patient/Appointment Taking Person Details" />
            </div>
            <div className="patient-content">
               <div className="patient-profile">
                  <div className="patient-avatar">
                    {imageUrl ? <img src={imageUrl} alt={patientName} />
                    : <span className="patient-initial">{patientName.charAt(0)}</span>}
                  </div>
                  <div className="info-list">
                     {patientInfo.map((item) => 
                       <InfoRow 
                         key={item.label} 
                         label={item.label} 
                         value={item.value} 
                       />
                     )}
                  </div>
               </div>
               <div className="vertical-divider" />
                 <div className="info-list parent-info">
                  {contactInfo.map((item) => 
                     <InfoRow 
                       key={item.label} 
                       label={item.label} 
                       value={item.value} 
                     />
                  )}
                 </div>
               </div>
        </section>
        <div className="two-column">
          <section className="details-card">
            <div className="card-title blue-title">
               <span className="title-icon"><UserIcon size={20} /></span>
               <Paragraph2 text="Appointed Doctor Details" />
            </div>
            <div className="card-body">
               {doctorInfo.map((item) => 
                  <InfoRow 
                    key={item.label} 
                    label={item.label} 
                    value={item.value} 
                  />
                )}
                {isTeacherRole && isCancelledOrRescheduled && !isAdminDoneBy && (
                  <div
                    style={{
                      color: "#e63517",
                      fontWeight: 700,
                      marginTop: "16px",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      padding: "10px 14px",
                      backgroundColor: "#fff4f4",
                      border: "1px solid #e63517",
                      borderRadius: "6px"
                    }}
                  >
                    Your request is waiting for approval from admin
                  </div>
                )}
            </div>
          </section>
          <section className="details-card">
            <div className="card-title purple-title">
              <span className="title-icon"><HomeIcon size={20} /></span>
              <span>Organisation Details</span>
            </div>
            <div className="card-body">
              {organisationInfo.map((item) => 
                <InfoRow 
                  key={item.label} 
                  label={item.label} 
                  value={item.value} 
                />
              )}
            </div>
          </section>
        </div>
      <section className="details-card payment-card">
        <div className="card-title grey-title">
          <span className="title-icon"> <IdCardIcon size={20} /> </span>
          <span>Payment Details</span>
        </div>
        <div className="payment-body">
          {paymentLoading && <div className="payment-row"><span>Payment</span><strong>Loading...</strong></div>}
          {paymentError && <div className="payment-row"><span>Payment</span><strong>{paymentError}</strong></div>}
          {!paymentLoading && !paymentError && paymentDetails && <>
            <div className="payment-row">
              <span>Customer</span><strong>{valueOrFallback(paymentDetails.user?.name)}</strong>
            </div>
            <div className="payment-row">
              <span>Email</span><strong>{valueOrFallback(paymentDetails.user?.email)}</strong>
            </div>
            <div className="payment-row">
              <span>Amount</span><strong>{valueOrFallback(paymentDetails.currency)} {valueOrFallback(paymentDetails.amount)}</strong>
            </div>
            <div className="payment-row">
              <span>Payment Status</span><span className="paid-badge">{valueOrFallback(paymentDetails.status)}</span>
            </div>
            <div className="payment-row">
              <span>Payment Provider</span><strong>{valueOrFallback(paymentDetails.provider)}</strong>
            </div>
            <div className="payment-row">
              <span>Payment Method</span><strong>{valueOrFallback(paymentMethod)}</strong>
            </div>
            <div className="payment-row">
              <span>Order ID</span><strong>{valueOrFallback(paymentDetails.orderId)}</strong>
            </div>
            <div className="payment-row">
              <span>Receipt</span><strong>{valueOrFallback(paymentDetails.receipt)}</strong>
            </div>
            <div className="payment-row">
              <span>Transaction ID</span><strong>{valueOrFallback(paymentDetails.razorpayPaymentId)}</strong>
            </div>
            <div className="payment-row">
              <span>Payment Date</span><strong>{valueOrFallback(paymentDate)}</strong>
            </div>
          </>}
          {!paymentLoading && !paymentError && !paymentDetails && (
            <>
              <div className="payment-row">
                <span>Payment Status</span>
                <span className="paid-badge">{valueOrFallback(appointment.paymentStatus)}</span>
              </div>
              <div className="payment-row">
                <span>Done By</span>
                <strong>{valueOrFallback(appointment.doneBy)}</strong>
              </div>
            </>
          )}
        </div>
      </section>

      {activeModal && 
      <div className="appointment-modal-backdrop" role="presentation" onClick={closeModal}>
         <section className="details-card action-card appointment-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={`card-title ${activeModal === "reschedule" ? "green-title" : "red-title"}`}>
              <span className="title-icon">{activeModal === "reschedule" ? <CalendarDaysIcon size={20} /> : <XIcon size={21} />}</span>
              <span>{activeModal === "reschedule" ? "Reschedule Appointment" : "Cancel Appointment"}</span>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeModal}><XIcon size={19} /></button>
            </div>

            {actionError && <div className="error-message">{actionError}</div>}
               <div className="form-body">{activeModal === "reschedule" ? <>
                 <div className="form-row">
                     <div className="form-group">
                         <label>New Date</label>
                         <div className="select-wrapper">
                            <select value={selectedDate} onChange={(event) => handleDateChange(event.target.value)} disabled={slotsLoading} required>
                                <option value="">{slotsLoading ? "Loading dates..." : "Select date"}</option>
                                {availableDates.map((date) => <option key={date} value={date}>{date}</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="form-group">
                        <label>New Time Slot</label>
                        <div className="select-wrapper">
                          <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} disabled={slotsLoading || !selectedDate} required>
                            <option value="">Select time</option>
                            {availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Reason for Reschedule</label>
                      <textarea value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} />
                    </div>
                    {/* <button className="action-button reschedule-button" type="button" onClick={handleRescheduleAppointment} disabled={actionLoading || slotsLoading}>
                       <CalendarDaysIcon size={17} />{actionLoading ? "Rescheduling..." : "Reschedule Appointment"}
                    </button> */}
                    <Button
                      text={actionLoading ? "Rescheduling..." : "Reschedule Appointment"}
                      icon={<CalendarDaysIcon size={22} />}
                      width="full"
                      textsize="md"
                      onClick={handleRescheduleAppointment}
                      disabled={actionLoading || slotsLoading}
                    />
                  </> : <>
                    <div className="form-group">
                      <label>Cancellation Reason</label>
                      <input type="text" value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Additional Comments (Optional)</label>
                        <textarea />
                    </div>
                    {/* <button className="action-button cancel-button" type="button" onClick={handleCancelAppointment} disabled={actionLoading}><XIcon size={18} />{actionLoading ? "Cancelling..." : "Cancel Appointment"}
                    </button> */}
                    <Button
                      text={actionLoading ? "Cancelling..." : "Cancel Appointment"}
                      icon={<CalendarDaysIcon size={22} />}
                      width="full"
                      textsize="md"
                      variant="red"
                      onClick={handleCancelAppointment}
                      disabled={actionLoading || slotsLoading}
                    />
                  </>}
                </div>
           </section>
        </div>}
    </>
  );
};

export default AppointmentDetails;
