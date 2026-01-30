const MetricCard = ({ label, value, subvalue, highlight }) => {
  return (
    <div className={`metric-card${highlight ? " metric-card--highlight" : ""}`}>
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {subvalue ? <div className="metric-card__subvalue">{subvalue}</div> : null}
    </div>
  );
};

export default MetricCard;
