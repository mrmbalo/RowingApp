import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatDuration, paceToWatts } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

const PerformanceChart = ({ title, samples, powerOnly = false }) => {
  if (!samples.length) {
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <div className="chart-card__empty">
          Connect and row to see the power curve from the PM5.
        </div>
      </div>
    );
  }

  const labels = samples.map((sample, index) =>
    sample.time !== null && sample.time !== undefined
      ? formatDuration(sample.time)
      : `${index + 1}s`,
  );

  const powerData = samples.map((sample) =>
    sample.power ??
    (sample.pace != null ? paceToWatts(sample.pace) : null),
  );

  const datasets = [
    {
      label: "Power (W)",
      data: powerData,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.2)",
      tension: 0.3,
      yAxisID: "y",
      spanGaps: true,
    },
  ];

  if (!powerOnly) {
    datasets.push({
      label: "Pace (sec/500m)",
      data: samples.map((sample) => sample.pace ?? null),
      borderColor: "#f97316",
      backgroundColor: "rgba(249, 115, 22, 0.2)",
      tension: 0.3,
      yAxisID: "y1",
      spanGaps: true,
    });
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Watts",
        },
      },
      ...(!powerOnly && {
        y1: {
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "Sec / 500m",
          },
          ticks: {
            callback: (value) => formatDuration(Number(value)),
          },
        },
      }),
    },
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-card__canvas">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PerformanceChart;
