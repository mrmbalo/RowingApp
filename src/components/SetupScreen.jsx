import { formatDistance, formatDuration } from "../utils/formatters";
import { getWorkoutTargetDistance, getWorkoutTargetTime } from "../utils/workouts";

const SetupScreen = ({
  activeWorkout,
  onSelectJustRow,
  onConnectAndRow,
  children,
}) => {
  const hasWorkout = activeWorkout != null;
  const summary =
    hasWorkout && getWorkoutTargetDistance(activeWorkout)
      ? formatDistance(getWorkoutTargetDistance(activeWorkout))
      : hasWorkout && getWorkoutTargetTime(activeWorkout)
        ? formatDuration(getWorkoutTargetTime(activeWorkout))
        : null;

  return (
    <section className="setup">
      <div className="setup__hero">
        <h1>Set up your row</h1>
        <p>
          Connect to your Concept2 PM5 over Bluetooth. Choose Just Row to see
          live output from the monitor, or configure a workout and send it to the
          PM5.
        </p>
      </div>

      <div className="setup__choices">
        <div className="setup-card setup-card--primary">
          <h2>Just Row</h2>
          <p>Live output displayed directly from the PM5. No target or intervals.</p>
          <button
            type="button"
            className="button button--primary button--large"
            onClick={onSelectJustRow}
          >
            Just Row
          </button>
        </div>

        <div className="setup-card">
          <h2>Configure workout</h2>
          <p>
            Set a fixed distance, time, or intervals (distance or time + rest).
            Workout can be sent to the PM5; then row with data from the monitor.
          </p>
          {children}
          {hasWorkout ? (
            <div className="setup-workout-summary">
              <strong>Selected:</strong> {activeWorkout.name}
              {summary ? ` — ${summary}` : ""}
              <button
                type="button"
                className="button button--primary button--large"
                onClick={onConnectAndRow}
              >
                Connect & row
              </button>
            </div>
          ) : (
            <p className="setup__hint">
              Pick or create a workout below, click &quot;Use&quot;, then &quot;Connect & row&quot;.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default SetupScreen;
