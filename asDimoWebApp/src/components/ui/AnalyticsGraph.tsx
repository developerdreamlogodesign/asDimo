import React, { useState } from "react";
import {DownloadIcon} from 'lucide-animated';
import DashboardButtons from "./Buttons";

interface Point {
  x: number;
  y: number;
  month: string;
  value: number;
}

interface AnalyticsGraphProps {
  title: string;
  subtitle: string;
  // total: string;
  // growth: string;
  months: string[];
  linePath: string;
  areaPath: string;
  points: Point[];
  yAxisLabels?: number[];
  graphColor?: string;
  gradientId: string;
  PointColor: string;
  rWidth: string;
  onSaveReport?: () => void;
}

const AnalyticsGraph: React.FC<AnalyticsGraphProps> = ({
  title,
  subtitle,
  // total,
  // growth,
  months,
  linePath,
  areaPath,
  points,
  yAxisLabels = [0, 100, 300, 700, 1000],
  graphColor,
  gradientId,
  PointColor,
  rWidth,
  onSaveReport,
}) => {

const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  return (
    <div className="analytics-graph boxShadow">
      <div className="graph-top">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="graph-stat">
          {/* <h1>{total}</h1> */}
          {/* <span>{growth}</span> */}
          <DashboardButtons
            text="Save Report"
            textsize="sm"
            icon={<DownloadIcon size={18} className="icon" />}
            variant="blueborder"
            onClick={onSaveReport}
            disabled={!onSaveReport}
          />
        </div>
      </div>

<div className="graph-body">
  {/* Y Axis */}
  <div className="graph-y-axis">
    {yAxisLabels
      .slice()
      .reverse()
      .map((label) => (
        <span key={label}>{label}</span>
      ))}
  </div>

  <div className="graph-content">
    <svg
      className="graph-svg"
      viewBox="0 0 1100 420"
      preserveAspectRatio="none"
    >
      {/* Horizontal Grid */}
      {yAxisLabels.map((_, index) => {
        const y = 40 + index * 80;
        return (
          <line
            key={`h-${index}`}
            x1="0"
            y1={y}
            x2="1100"
            y2={y}
            className="grid"
          />
        );
      })}

      {/* Vertical Grid */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = i * 100;
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="0"
            x2={x}
            y2="390"
            className="grid"
          />
        );
      })}

  <defs>
    <linearGradient
      id={gradientId}
      x1="0%"
      y1="0%"
      x2="0%"
      y2="100%"
    >
      {/* <stop offset="0%" stopColor="#2D9CDB" stopOpacity="0.45" />
      <stop offset="30%" stopColor="#3FA9F5" stopOpacity="0.25" />
      <stop offset="70%" stopColor="#66C3FF" stopOpacity="0.10" />
      <stop offset="100%" stopColor="" stopOpacity="0" /> */}
      <stop offset="0%" stopColor={graphColor} stopOpacity="0.45" />
      <stop offset="30%" stopColor={graphColor} stopOpacity="0.25" />
      <stop offset="70%" stopColor={graphColor} stopOpacity="0.10" />
      <stop offset="100%" stopColor={graphColor} stopOpacity="0" />
    </linearGradient>
  </defs>

      <path d={areaPath} className="area" fill={`url(#${gradientId})`} />
      <path d={linePath} className="line" style={{ stroke: graphColor }} />

      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          // r="6"
          r={rWidth}
          className="point"
          style={{
            animationDelay: `${index * 0.15}s`,
            fill: PointColor,
            cursor: "pointer",
          }}
          onMouseEnter={() => setHoveredPoint(point)}
          onMouseLeave={() => setHoveredPoint(null)}
        />
      ))}
      {hoveredPoint && (
  <g
    transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 50})`}
    className="graph-tooltip"
  >
    <rect
      x="-45"
      y="-30"
      width="90"
      height="36"
      rx="8"
      fill="#1F2937"
    />

    <text
      x="0"
      y="-15"
      textAnchor="middle"
      fill="#fff"
      fontSize="12"
      fontWeight="600"
    >
      {hoveredPoint.month}
    </text>

    <text
      x="0"
      y="2"
      textAnchor="middle"
      fill="#fff"
      fontSize="14"
    >
      {hoveredPoint.value}
    </text>
  </g>
)}
    </svg>

    <div className="months">
      {months.map((month) => (
        <span key={month}>{month}</span>
      ))}
    </div>
  </div>
</div>
    </div>
  );
};

export default AnalyticsGraph;