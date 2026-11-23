
import {EarningCards , PaymentDetails } from "../ui/PaymentCards";
import TotalEarning from  "../../assets/Images/TotalEarning.png";
import TotalWeekEarning from  "../../assets/Images/TotalWeekEarning.png";
import TotalMonthEarning from  "../../assets/Images/TotalMonthEarning.png";
import TotalYearEarning from  "../../assets/Images/TotalYearEarning.png";
import PE from  "../../assets/Images/PE.png";
import APPOINTMENT from  "../../assets/Images/APPOINTMENT.png";
import Subscription from  "../../assets/Images/Subscription.png";
import Cart from  "../../assets/Images/Cart.png";
import Total from  "../../assets/Images/Total.png";


const earningDetails = [
  {
    title: "Total Earning",
    label: "TOTAL EARNING",
    amount: "₹ 20000",
    icon: TotalEarning,
  },
  {
    title: "Total Week Earning",
    label: "Week",
    amount: "₹ 3000",
    icon: TotalWeekEarning,
  },
  {
    title: "Total Month Earning",
    label: "Month",
    amount: "₹ 210000",
    icon: TotalMonthEarning,
  },
  {
    title: "Total Year Earning",
    label: "Year",
    amount: "₹ 2,00,000",
    icon: TotalYearEarning,
  },
];

const paymentDetails = [
  {
    label: "TOTAL EARNING",
    amount: "₹ 20000",
    icon: PE,
    color: "#BBE2DB",
  },
  {
    label: "Week",
    amount: "₹ 3000",
    icon: APPOINTMENT,
    color: "#6BD9E7",
  },
  {
    label: "Month",
    amount: "₹ 210000",
    icon: Subscription,
    color: "#FFE177",
  },
  {
    label: "Year",
    amount: "₹ 2,00,000",
    icon: Cart,
    color: "#C2E6FF",
  },
  {
    label: "Total",
    amount: "₹ 2,00,000",
    icon: Total,
    color: "#CDF8C8",
  },
];


const Dashboard = () => {
  return (
    <>
      <EarningCards earningDetails={earningDetails} />
      <PaymentDetails paymentDetails={paymentDetails} />
    </>
  );
};

export default Dashboard;