import React from "react";
import "../ui/UIstyles.css";

type TimingData = {
  day: string;
  value: number;
};

type TimingReportProps = {
  data: TimingData[];
};

const TimingReport: React.FC<TimingReportProps> = ({ data }) => (
  <div className="timing-report">
    <button className="timing-title">Timing report</button>

    <div className="chart">
      {[100, 75, 50, 25].map((value) => (
        <div className={`grid-line line-${value}`} key={value}>
          <div>{value}%</div>
        </div>
      ))}

      <div className="bars">
        {data.map(({ day, value }) => (
          <div className="bar-column" key={day}>
            <div className="bar" style={{ height: `${value}%` }} />
            <span className="day">{day}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TimingReport;