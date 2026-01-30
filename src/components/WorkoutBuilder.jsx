import { useMemo, useState } from "react";
import { formatDistance, formatDuration } from "../utils/formatters";
import {
  getWorkoutTargetDistance,
  getWorkoutTargetTime,
} from "../utils/workouts";

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `custom-${Date.now()}`;

const WorkoutBuilder = ({
  standardWorkouts,
  customWorkouts,
  activeWorkout,
  onActivate,
  onSaveCustom,
  onRemoveCustom,
}) => {
  const [form, setForm] = useState({
    name: "",
    type: "distance",
    targetDistance: 2000,
    targetTime: 20,
    intervalDistance: 500,
    intervalTime: 120,
    intervalRest: 180,
    intervalRepeat: 5,
  });

  const preview = useMemo(() => {
    const base = {
      name: form.name || "Custom Workout",
      type: form.type,
    };
    if (form.type === "distance") {
      base.targetDistance = Number(form.targetDistance);
    }
    if (form.type === "time") {
      base.targetTime = Number(form.targetTime) * 60;
    }
    if (form.type === "interval") {
      base.intervals = [
        {
          distance: Number(form.intervalDistance),
          time: Number(form.intervalTime),
          rest: Number(form.intervalRest),
          repeat: Number(form.intervalRepeat),
        },
      ];
    }
    return base;
  }, [form]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    const workout = {
      id: createId(),
      ...preview,
    };
    onSaveCustom(workout);
    setForm((prev) => ({
      ...prev,
      name: "",
    }));
  };

  const renderWorkoutMeta = (workout) => {
    const distance = getWorkoutTargetDistance(workout);
    const time = getWorkoutTargetTime(workout);
    return (
      <div className="workout-meta">
        {distance ? <span>{formatDistance(distance)}</span> : null}
        {time ? <span>{formatDuration(time)}</span> : null}
      </div>
    );
  };

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Workout Builder</h2>
        <p>Pick a standard workout or build your own.</p>
      </div>

      <div className="workout-grid">
        <div>
          <h3>Standard Workouts</h3>
          <div className="workout-list">
            {standardWorkouts.map((workout) => (
              <div key={workout.id} className="workout-card">
                <div>
                  <strong>{workout.name}</strong>
                  {renderWorkoutMeta(workout)}
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => onActivate(workout)}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3>Custom Workouts</h3>
          <div className="workout-list">
            {customWorkouts.length === 0 ? (
              <div className="empty-state">No custom workouts yet.</div>
            ) : (
              customWorkouts.map((workout) => (
                <div key={workout.id} className="workout-card">
                  <div>
                    <strong>{workout.name}</strong>
                    {renderWorkoutMeta(workout)}
                  </div>
                  <div className="workout-card__actions">
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => onActivate(workout)}
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      className="button button--text"
                      onClick={() => onRemoveCustom(workout.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="workout-form">
        <h3>Create a Custom Workout</h3>
        <form onSubmit={handleSave} className="form-grid">
          <label>
            Name
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Power Pyramid"
              required
            />
          </label>

          <label>
            Type
            <select value={form.type} onChange={handleChange("type")}>
              <option value="distance">Distance</option>
              <option value="time">Time</option>
              <option value="interval">Interval</option>
            </select>
          </label>

          {form.type === "distance" ? (
            <label>
              Target Distance (m)
              <input
                type="number"
                min="100"
                step="50"
                value={form.targetDistance}
                onChange={handleChange("targetDistance")}
              />
            </label>
          ) : null}

          {form.type === "time" ? (
            <label>
              Target Time (min)
              <input
                type="number"
                min="1"
                step="1"
                value={form.targetTime}
                onChange={handleChange("targetTime")}
              />
            </label>
          ) : null}

          {form.type === "interval" ? (
            <>
              <label>
                Interval Distance (m)
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={form.intervalDistance}
                  onChange={handleChange("intervalDistance")}
                />
              </label>
              <label>
                Interval Time (sec)
                <input
                  type="number"
                  min="30"
                  step="10"
                  value={form.intervalTime}
                  onChange={handleChange("intervalTime")}
                />
              </label>
              <label>
                Rest (min)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.intervalRest / 60}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      intervalRest: Math.max(0, Number(e.target.value) * 60),
                    }))
                  }
                />
              </label>
              <label>
                Repeats
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.intervalRepeat}
                  onChange={handleChange("intervalRepeat")}
                />
              </label>
            </>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="button button--primary">
              Save Custom Workout
            </button>
          </div>
        </form>

        <div className="workout-preview">
          <strong>Preview:</strong> {preview.name} -{" "}
          {getWorkoutTargetDistance(preview)
            ? formatDistance(getWorkoutTargetDistance(preview))
            : "--"}{" "}
          -{" "}
          {getWorkoutTargetTime(preview)
            ? formatDuration(getWorkoutTargetTime(preview))
            : "--"}
        </div>
      </div>

      {activeWorkout ? (
        <div className="active-workout">
          <h3>Active Workout</h3>
          <div className="active-workout__card">
            <div>
              <strong>{activeWorkout.name}</strong>
              {renderWorkoutMeta(activeWorkout)}
            </div>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => onActivate(null)}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default WorkoutBuilder;
