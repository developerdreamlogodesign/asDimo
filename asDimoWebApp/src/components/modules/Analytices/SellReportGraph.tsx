import AnalyticsGraph from "../../ui/AnalyticsGraph";
const SellReportGraph: React.FC = () => {
    const months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", ];
    const linePath = `
    M40 320
    C100 290 150 250 220 260
    S330 170 400 180
    S500 130 580 160
    S700 90 760 100
    S870 140 930 120
    S1010 70 1060 90
    `;

    const areaPath = `
    M40 320
    C100 290 150 250 220 260
    S330 170 400 180
    S500 130 580 160
    S700 90 760 100
    S870 140 930 120
    S1010 70 1060 90
    L1060 390
    L40 390 Z
    `;

    const points = [
    { x: 40, y: 320, month: "Jan", value: 120},
    { x: 130, y: 275, month: "Feb", value: 220 },
    { x: 220, y: 260, month: "Mar", value: 420 },
    { x: 310, y: 220, month: "Apr", value: 760 },
    { x: 400, y: 180, month: "May", value: 760 },
    { x: 490, y: 160, month: "Jun", value: 760 },
    { x: 580, y: 160, month: "Jul", value: 760 },
    { x: 670, y: 140, month: "Aug", value: 760 },
    { x: 760, y: 100, month: "Sep", value: 760 },
    { x: 850, y: 122, month: "Oct", value: 760 },
    { x: 930, y: 120, month: "Nov", value: 760 },
    { x: 1060, y: 90, month: "Dec", value: 760 },
    
    ];
  return (
    <>
       <AnalyticsGraph
          title="Sell Report"
          subtitle="A quick snapshot of your total sales performance"
          months={months}
          linePath={linePath}
          areaPath={areaPath}
          points={points}
          graphColor="#8BC727"
          PointColor="#618823"
          gradientId="revenueGradient"
          rWidth="6"
      /> 
    </>
      );
};

export default SellReportGraph;