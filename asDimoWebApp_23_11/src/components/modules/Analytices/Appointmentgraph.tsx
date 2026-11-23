import React, { useEffect, useState } from "react";
import AnalyticsGraph from "../../ui/AnalyticsGraph";
import { authService } from "../../../services/authService";
import { tokenManager } from "../../../services/tokenManager";
import Loader from "../../ui/Loaders";

interface GraphPoint {
  x: number;
  y: number;
  month: string;
  value: number;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getAppointmentMonthIndex = (dateString: string) => {
  if (!dateString) return -1;
  const parts = dateString.split("-");
  if (parts.length !== 3) return -1;
  const month = parseInt(parts[1], 10);
  return Number.isFinite(month) && month >= 1 && month <= 12 ? month - 1 : -1;
};

const buildYAxisLabels = (counts: number[]) => {
  const maxValue = Math.max(...counts, 1);
  const step = Math.max(1, Math.ceil(maxValue / 4));
  // const maxTick = step * 4;

  return Array.from({ length: 5 }, (_, index) => index * step);
};

const buildGraphPoints = (counts: number[], yAxisMax: number): GraphPoint[] => {
  const minY = 90;
  const maxY = 380;
  const scale = yAxisMax || 1;

  return counts.map((value, index) => {
    const normalized = value / scale;
    const y = Math.round(maxY - normalized * (maxY - minY));
    return {
      x: 40 + index * 100,
      y,
      month: months[index],
      value,
    };
  });
};

const buildLinePath = (points: GraphPoint[]) => {
  if (!points.length) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
};

const buildAreaPath = (points: GraphPoint[]) => {
  if (!points.length) return "";
  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];
  return `${linePath} L${lastPoint.x} 390 L40 390 Z`;
};

const AppointmentAnalytics: React.FC = () => {
  const [points, setPoints] = useState<GraphPoint[]>(buildGraphPoints(Array(12).fill(0), 20));
  const [yAxisLabels, setYAxisLabels] = useState<number[]>(buildYAxisLabels(Array(12).fill(0)));
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await authService.getAppoinments(token);

        const appointmentData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setAppointments(appointmentData);

        const counts = Array(12).fill(0);

        appointmentData.forEach((item: any) => {
          const monthIndex = getAppointmentMonthIndex(item.date);
          if (monthIndex >= 0) counts[monthIndex]++;
        });

        const labels = buildYAxisLabels(counts);
        const maxAxisValue = labels[labels.length - 1] || 1;

        setYAxisLabels(labels);
        setPoints(buildGraphPoints(counts, maxAxisValue));
      } catch (error) {
        console.error("Failed to load appointment analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points);

  // const downloadCsvReport = () => {
  //   const headers = ["Month", "Appointments"];
  //   const rows = points.map((point) => [point.month, String(point.value)]);
  //   console.log("....rows.........",rows);
  //   const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.setAttribute('download', 'appointment-report.csv');
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   URL.revokeObjectURL(url);
  // };

  const downloadCsvReport = () => {
    const headers = [
      "Date",
      "Time",
      "Status",
      "Parent",
      "Teacher",
      "Organization",
      "Admin",
      "Zonal Admin",
      "Zoom Link",
    ];

    const rows = appointments.map((item) => [
      item.date,
      item.time,
      item.status,
      item.parentUser?.name ?? "",
      item.teacherUser?.name ?? "",
      item.organization?.name ?? "",
      item.admin?.name ?? "",
      item.zonalAdmin?.name ?? "",
      item.zoomLink ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "appointment-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };
  if (loading) {
    return <Loader />;
  }

  return (
    <AnalyticsGraph
      title="Appointment statistics"
      subtitle="A quick summary of all scheduled and completed visits"
      months={months}
      linePath={linePath}
      areaPath={areaPath}
      points={points}
      yAxisLabels={yAxisLabels}
      graphColor="#FFD064"
      PointColor="#FAA31B"
      gradientId="appointmentGradient"
      rWidth="6"
      onSaveReport={downloadCsvReport}
    />
  );
};

export default AppointmentAnalytics;
