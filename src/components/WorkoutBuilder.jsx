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
    timeIntervalWork: 2 * 60,
    timeIntervalRest: 60,
    timeIntervalRepeat: 5,
    customSegments: [{ distance: 500, rest: 60 }, { distance: 500, rest: 60 }],
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
    if (form.type === "time_interval") {
      base.intervals = [
        {
          time: Number(form.timeIntervalWork),
          rest: Number(form.timeIntervalRest),
          repeat: Number(form.timeIntervalRepeat),
        },
      ];
    }
    if (form.type === "custom") {
      base.intervals = form.customSegments.map((seg) => ({
        distance: seg.distance ?? 0,
        time: seg.time ?? 0,
        rest: seg.rest ?? 0,
        repeat: 1,
      }));
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
              <option value="distance">Fixed distance</option>
              <option value="time">Fixed time</option>
              <option value="interval">Distance intervals (distance + rest)</option>
              <option value="time_interval">Time intervals (work + rest)</option>
              <option value="custom">Custom intervals</option>
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

          {form.type === "time_interval" ? (
            <>
              <label>
                Work (sec)
                <input
                  type="number"
                  min="30"
                  step="10"
                  value={form.timeIntervalWork}
                  onChange={handleChange("timeIntervalWork")}
                />
              </label>
              <label>
                Rest (min)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.timeIntervalRest / 60}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      timeIntervalRest: Math.max(0, Number(e.target.value) * 60),
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
                  value={form.timeIntervalRepeat}
                  onChange={handleChange("timeIntervalRepeat")}
                />
              </label>
            </>
          ) : null}

          {form.type === "custom" ? (
            <div className="custom-segments">
              <label className="form-grid__full">
                Segments (distance in m, time in sec, rest in sec; repeat = 1 per row)
              </label>
              {form.customSegments.map((seg, i) => (
                <div key={i} className="segment-row form-grid__full">
                  <input
                    type="number"
                    min="0"
                    placeholder="Dist (m)"
                    value={seg.distance || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customSegments: prev.customSegments.map((s, j) =>
                          j === i ? { ...s, distance: Number(e.target.value) || 0 } : s
                        ),
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Time (sec)"
                    value={seg.time || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customSegments: prev.customSegments.map((s, j) =>
                          j === i ? { ...s, time: Number(e.target.value) || 0 } : s
                        ),
                      }))
                    }
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Rest (sec)"
                    value={seg.rest || ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customSegments: prev.customSegments.map((s, j) =>
                          j === i ? { ...s, rest: Number(e.target.value) || 0 } : s
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="button button--text"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        customSegments: prev.customSegments.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button button--ghost form-grid__full"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    customSegments: [...prev.customSegments, { distance: 500, rest: 60 }],
                  }))
                }
              >
                Add segment
              </button>
            </div>
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
