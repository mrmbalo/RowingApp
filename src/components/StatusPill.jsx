const STATUS_LABELS = {
  disconnected: "Disconnected",
  connecting: "Connecting",
  connected: "Connected",
  demo: "Demo Mode",
};

const StatusPill = ({ status }) => {
  const label = STATUS_LABELS[status] || "Unknown";
  return <span className={`status-pill status-pill--${status}`}>{label}</span>;
};

export default StatusPill;
