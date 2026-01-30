import PerformanceChart from "./PerformanceChart";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatWatts,
} from "../utils/formatters";

const Logbook = ({ entries, selectedEntry, onSelect, onDelete }) => {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Logbook</h2>
        <p>Review previous rows, split charts, and performance trends.</p>
      </div>

      <div className="logbook-grid">
        <div className="logbook-list">
          {entries.length === 0 ? (
            <div className="empty-state">No rows logged yet.</div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`logbook-entry${
                  selectedEntry?.id === entry.id ? " is-active" : ""
                }`}
                onClick={() => onSelect(entry)}
              >
                <div>
                  <strong>{entry.workout?.name || "Open Row"}</strong>
                  <div className="logbook-entry__meta">
                    {new Date(entry.date).toLocaleString()}
                  </div>
                </div>
                <div className="logbook-entry__summary">
                  <span>{formatDistance(entry.summary.distance)}</span>
                  <span>{formatDuration(entry.summary.elapsedTime)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="logbook-detail">
          {selectedEntry ? (
            <>
              <div className="logbook-detail__header">
                <div>
                  <h3>{selectedEntry.workout?.name || "Open Row"}</h3>
                  <p>{new Date(selectedEntry.date).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  className="button button--text"
                  onClick={() => onDelete(selectedEntry.id)}
                >
                  Delete
                </button>
              </div>

              <div className="summary-grid">
                <div className="summary-card">
                  <span>Distance</span>
                  <strong>{formatDistance(selectedEntry.summary.distance)}</strong>
                </div>
                <div className="summary-card">
                  <span>Elapsed</span>
                  <strong>{formatDuration(selectedEntry.summary.elapsedTime)}</strong>
                </div>
                <div className="summary-card">
                  <span>Avg Pace</span>
                  <strong>{formatPace(selectedEntry.summary.averagePace)}</strong>
                </div>
                <div className="summary-card">
                  <span>Avg Power</span>
                  <strong>{formatWatts(selectedEntry.summary.averagePower)}</strong>
                </div>
                <div className="summary-card">
                  <span>Stroke Rate</span>
                  <strong>
                    {selectedEntry.summary.averageStrokeRate
                      ? `${Math.round(selectedEntry.summary.averageStrokeRate)} spm`
                      : "--"}
                  </strong>
                </div>
                <div className="summary-card">
                  <span>Drag Factor</span>
                  <strong>
                    {selectedEntry.summary.dragFactor
                      ? `${selectedEntry.summary.dragFactor}`
                      : "--"}
                  </strong>
                </div>
              </div>

              <PerformanceChart
                title="Row Analysis"
                samples={selectedEntry.samples}
              />
            </>
          ) : (
            <div className="empty-state">
              Select a row to view its analysis.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Logbook;
