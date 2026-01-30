import { useEffect, useMemo, useState } from "react";
import Logbook from "./components/Logbook";
import MetricCard from "./components/MetricCard";
import PerformanceChart from "./components/PerformanceChart";
import StatusPill from "./components/StatusPill";
import WorkoutBuilder from "./components/WorkoutBuilder";
import { useConcept2 } from "./hooks/useConcept2";
import {
  clampNumber,
  formatDistance,
  formatDuration,
  formatNumber,
  formatPace,
  formatWatts,
  paceToWatts,
} from "./utils/formatters";
import {
  getWorkoutTargetDistance,
  getWorkoutTargetTime,
  standardWorkouts,
} from "./utils/workouts";

const LOGBOOK_KEY = "rowing_logbook_v1";
const CUSTOM_WORKOUTS_KEY = "rowing_custom_workouts_v1";

const loadFromStorage = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (err) {
    return fallback;
  }
};

const downsample = (items, maxPoints = 240) => {
  if (items.length <= maxPoints) return items;
  const step = Math.ceil(items.length / maxPoints);
  return items.filter((_, index) => index % step === 0);
};

const averageOf = (values) => {
  const filtered = values.filter(
    (value) => value !== null && value !== undefined && Number.isFinite(value),
  );
  if (!filtered.length) return null;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

const App = () => {
  const {
    status,
    error,
    metrics,
    samples,
    isSessionActive,
    connect,
    disconnect,
    startSession,
    stopSession,
    startDemo,
    stopDemo,
  } = useConcept2();

  const [customWorkouts, setCustomWorkouts] = useState(() =>
    loadFromStorage(CUSTOM_WORKOUTS_KEY, []),
  );
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [logbookEntries, setLogbookEntries] = useState(() =>
    loadFromStorage(LOGBOOK_KEY, []),
  );
  const [selectedEntry, setSelectedEntry] = useState(
    logbookEntries.length ? logbookEntries[0] : null,
  );
  const [dragFactor, setDragFactor] = useState(120);
  const [driveLength, setDriveLength] = useState(1.35);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionOffsets, setSessionOffsets] = useState({
    distance: 0,
    strokeCount: 0,
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_WORKOUTS_KEY, JSON.stringify(customWorkouts));
  }, [customWorkouts]);

  useEffect(() => {
    localStorage.setItem(LOGBOOK_KEY, JSON.stringify(logbookEntries));
  }, [logbookEntries]);

  useEffect(() => {
    if (selectedEntry) return;
    if (logbookEntries.length) {
      setSelectedEntry(logbookEntries[0]);
    }
  }, [logbookEntries, selectedEntry]);

  const sessionSamples = useMemo(() => {
    if (!samples.length) return [];
    return samples.map((sample) => ({
      ...sample,
      distance:
        sample.distance !== null && sample.distance !== undefined
          ? Math.max(sample.distance - sessionOffsets.distance, 0)
          : null,
    }));
  }, [samples, sessionOffsets.distance]);

  const targetDistance = getWorkoutTargetDistance(activeWorkout);
  const targetTime = getWorkoutTargetTime(activeWorkout);

  const derived = useMemo(() => {
    const sessionDistance =
      metrics.totalDistance !== null && metrics.totalDistance !== undefined
        ? Math.max(metrics.totalDistance - sessionOffsets.distance, 0)
        : null;
    const sessionStrokeCount =
      metrics.strokeCount !== null && metrics.strokeCount !== undefined
        ? Math.max(metrics.strokeCount - sessionOffsets.strokeCount, 0)
        : null;
    const elapsedTime =
      metrics.elapsedTime ??
      (sessionSamples.length
        ? sessionSamples[sessionSamples.length - 1].time
        : null);
    const averagePace =
      metrics.averagePace ??
      (elapsedTime && sessionDistance
        ? elapsedTime / (sessionDistance / 500)
        : null);
    const instantaneousPace = metrics.instantaneousPace ?? null;
    const watts =
      metrics.instantaneousPower ??
      (instantaneousPace ? paceToWatts(instantaneousPace) : null);
    const averagePower =
      metrics.averagePower ?? (averagePace ? paceToWatts(averagePace) : null);
    const averageStrokeRate =
      metrics.averageStrokeRate ??
      averageOf(sessionSamples.map((sample) => sample.strokeRate ?? null));

    let distanceToGo = null;
    if (targetDistance && sessionDistance !== null) {
      distanceToGo = Math.max(targetDistance - sessionDistance, 0);
    } else if (targetTime && averagePace && elapsedTime !== null) {
      const remainingTime = Math.max(targetTime - elapsedTime, 0);
      distanceToGo = (remainingTime / averagePace) * 500;
    }

    let predictedFinishTime = null;
    if (targetDistance && averagePace) {
      predictedFinishTime = (targetDistance / 500) * averagePace;
    }

    return {
      sessionDistance,
      sessionStrokeCount,
      elapsedTime,
      averagePace,
      averagePower,
      averageStrokeRate,
      instantaneousPace,
      watts,
      distanceToGo,
      predictedFinishTime,
    };
  }, [
    metrics,
    sessionOffsets.distance,
    sessionOffsets.strokeCount,
    sessionSamples,
    targetDistance,
    targetTime,
  ]);

  const handleStartSession = () => {
    setSessionOffsets({
      distance: metrics.totalDistance ?? 0,
      strokeCount: metrics.strokeCount ?? 0,
    });
    startSession();
  };

  const handleStopSession = () => {
    stopSession();
  };

  const handleSaveSession = () => {
    if (!sessionSamples.length) return;
    const entry = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `entry-${Date.now()}`,
      date: new Date().toISOString(),
      workout: activeWorkout,
      notes: sessionNotes,
      settings: {
        dragFactor,
        driveLength,
      },
      summary: {
        distance: derived.sessionDistance,
        elapsedTime: derived.elapsedTime,
        averagePace: derived.averagePace,
        averagePower: derived.averagePower,
        averageStrokeRate: derived.averageStrokeRate,
        strokeCount: derived.sessionStrokeCount,
        dragFactor,
        driveLength,
      },
      samples: downsample(sessionSamples),
    };
    setLogbookEntries((prev) => [entry, ...prev]);
    setSelectedEntry(entry);
    setSessionNotes("");
  };

  const handleDeleteEntry = (entryId) => {
    setLogbookEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    if (selectedEntry?.id === entryId) {
      setSelectedEntry(null);
    }
  };

  const handleSaveCustomWorkout = (workout) => {
    setCustomWorkouts((prev) => [workout, ...prev]);
  };

  const handleRemoveCustomWorkout = (workoutId) => {
    setCustomWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId));
    if (activeWorkout?.id === workoutId) {
      setActiveWorkout(null);
    }
  };

  const metricsView = [
    {
      label: "Strokes / Min",
      value:
        metrics.strokeRate !== null && metrics.strokeRate !== undefined
          ? `${formatNumber(metrics.strokeRate, 0)} spm`
          : "--",
      subvalue:
        derived.averageStrokeRate !== null &&
        derived.averageStrokeRate !== undefined
          ? `Avg ${formatNumber(derived.averageStrokeRate, 0)} spm`
          : null,
    },
    {
      label: "Distance Rowed",
      value: formatDistance(derived.sessionDistance),
      subvalue:
        derived.sessionStrokeCount !== null &&
        derived.sessionStrokeCount !== undefined
          ? `${formatNumber(derived.sessionStrokeCount, 0)} strokes`
          : null,
    },
    {
      label: "Distance to Go",
      value: formatDistance(derived.distanceToGo),
      subvalue: targetDistance
        ? `Target ${formatDistance(targetDistance)}`
        : targetTime
          ? `Target ${formatDuration(targetTime)}`
          : null,
    },
    {
      label: "Drag Factor",
      value: `${formatNumber(dragFactor, 0)}`,
      subvalue: "Manual setting",
    },
    {
      label: "Drive Length",
      value: `${formatNumber(driveLength, 2)} m`,
      subvalue: "Manual setting",
    },
    {
      label: "Watts",
      value: formatWatts(derived.watts),
      subvalue:
        derived.averagePower !== null && derived.averagePower !== undefined
          ? `Avg ${formatWatts(derived.averagePower)}`
          : null,
      highlight: true,
    },
    {
      label: "Average Pace",
      value: formatPace(derived.averagePace),
      subvalue:
        derived.instantaneousPace !== null &&
        derived.instantaneousPace !== undefined
          ? `Now ${formatPace(derived.instantaneousPace)}`
          : null,
    },
    {
      label: "Predicted Finish Time",
      value: formatDuration(derived.predictedFinishTime),
      subvalue: targetDistance ? "Based on avg pace" : null,
    },
    {
      label: "Elapsed Time",
      value: formatDuration(derived.elapsedTime),
      subvalue:
        metrics.remainingTime !== null && metrics.remainingTime !== undefined
          ? `Remaining ${formatDuration(metrics.remainingTime)}`
          : null,
    },
    {
      label: "Heart Rate",
      value:
        metrics.heartRate !== null && metrics.heartRate !== undefined
          ? `${metrics.heartRate} bpm`
          : "--",
      subvalue:
        metrics.metabolicEquivalent !== null &&
        metrics.metabolicEquivalent !== undefined
          ? `${metrics.metabolicEquivalent} METs`
          : null,
    },
  ];

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Rowing Live Dashboard</h1>
          <p>
            Connect your Concept2 rower over Bluetooth to view live metrics, set
            workouts, and log every row.
          </p>
        </div>
        <div className="header-actions">
          <StatusPill status={status} />
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={connect}
              disabled={status === "connecting" || status === "connected"}
            >
              Connect
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={disconnect}
              disabled={status === "disconnected"}
            >
              Disconnect
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={status === "demo" ? stopDemo : startDemo}
            >
              {status === "demo" ? "Stop Demo" : "Demo Mode"}
            </button>
          </div>
        </div>
      </header>

      {error ? <div className="alert">{error}</div> : null}

      <section className="panel">
        <div className="panel__header">
          <h2>Live Standard Views</h2>
          <p>
            Mirrors the Concept2 PM5 screens with strokes, pace, watts, and
            projections.
          </p>
        </div>
        <div className="metrics-grid">
          {metricsView.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
        <div className="chart-grid">
          <PerformanceChart title="Power Output Chart" samples={sessionSamples} />
          <div className="info-card">
            <h3>Session Controls</h3>
            <div className="form-grid">
              <label>
                Drag Factor
                <input
                  type="number"
                  min="80"
                  max="200"
                  value={dragFactor}
                  onChange={(event) =>
                    setDragFactor(
                      clampNumber(Number(event.target.value), 80, 200),
                    )
                  }
                />
              </label>
              <label>
                Drive Length (m)
                <input
                  type="number"
                  min="0.8"
                  max="2.0"
                  step="0.01"
                  value={driveLength}
                  onChange={(event) =>
                    setDriveLength(
                      clampNumber(Number(event.target.value), 0.8, 2.0),
                    )
                  }
                />
              </label>
              <label className="form-grid__full">
                Session Notes
                <textarea
                  rows="3"
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  placeholder="Focus on steady drive, relaxed recovery..."
                />
              </label>
              <div className="form-actions form-grid__full">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleStartSession}
                  disabled={isSessionActive}
                >
                  Start Session
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={handleStopSession}
                  disabled={!isSessionActive}
                >
                  Stop Session
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={handleSaveSession}
                  disabled={!sessionSamples.length}
                >
                  Save to Logbook
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WorkoutBuilder
        standardWorkouts={standardWorkouts}
        customWorkouts={customWorkouts}
        activeWorkout={activeWorkout}
        onActivate={setActiveWorkout}
        onSaveCustom={handleSaveCustomWorkout}
        onRemoveCustom={handleRemoveCustomWorkout}
      />

      <Logbook
        entries={logbookEntries}
        selectedEntry={selectedEntry}
        onSelect={setSelectedEntry}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
};

export default App;
