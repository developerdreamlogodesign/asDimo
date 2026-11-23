
import React from "react";
import "./UIstyles.css";
import { MiniHeading5, Paragraph2, Paragraph3,  Heading5 } from "../ui/HeadingPara.tsx";

interface EarningDetail {
  title ?: string;
  label: string;
  amount: string;
  icon: string;
  color ?: string;
}


interface EarningDetailsProps { earningDetails: EarningDetail[]; }


export const EarningCards: React.FC<EarningDetailsProps> = ({
  earningDetails,
}) => {
  return (
      <div className="earning-grid">
        {earningDetails.map((item, index) => (
          <div className="earning-card" key={index}>
            <div className="earning-icon"> <img src={item.icon} alt={item.title}/></div>

            <div className="earning-info">
              {item.title && <Paragraph3 text={item.title} />}
              <MiniHeading5 text={item.label}/>
              <Paragraph2 text={item.amount}/>
            </div>
          </div>
        ))}
    </div>
  );
};


interface PaymentDetailsProps 
{ paymentDetails: EarningDetail[]; }

export const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  paymentDetails,
}) => {
  return (
      <div className="Payment-grid">
        {paymentDetails.map((item, index) => (
          <div className="Payment-card" key={index} style={{ background: item.color }}>
            <div className="Payment-icon"> 
              <img src={item.icon} alt={item.title}/>
              <Heading5 text={item.label}/>
              <Paragraph2 text={item.amount}/>
          </div>    
          </div>
        ))}
    </div>
  );
};

