import { useEffect, useMemo, useState } from "react";
import Logbook from "./components/Logbook";
import MetricCard from "./components/MetricCard";
import PerformanceChart from "./components/PerformanceChart";
import SetupScreen from "./components/SetupScreen";
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

  const [view, setView] = useState("setup");
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
    const instantaneousPace = metrics.instantaneousPace ?? null;
    const averagePace =
      metrics.averagePace ??
      (elapsedTime && sessionDistance && sessionDistance > 0
        ? elapsedTime / (sessionDistance / 500)
        : null);
    const watts =
      metrics.instantaneousPower ??
      (instantaneousPace ? paceToWatts(instantaneousPace) : null);
    const averagePower =
      metrics.averagePower ??
      (averagePace ? paceToWatts(averagePace) : null);
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
        damper: metrics.resistanceLevel,
        driveLength,
      },
      summary: {
        distance: derived.sessionDistance,
        elapsedTime: derived.elapsedTime,
        averagePace: derived.averagePace,
        averagePower: derived.averagePower,
        averageStrokeRate: derived.averageStrokeRate,
        strokeCount: derived.sessionStrokeCount,
        damper: metrics.resistanceLevel,
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
      label: "Pace /500m (current)",
      value: formatPace(metrics.instantaneousPace ?? derived.instantaneousPace),
      subvalue: "From PM5",
    },
    {
      label: "Pace /500m (avg)",
      value: formatPace(metrics.averagePace ?? derived.averagePace),
      subvalue: "From PM5",
    },
    {
      label: "Strokes / Min",
      value:
        metrics.strokeRate != null
          ? `${formatNumber(metrics.strokeRate, 0)} spm`
          : "--",
      subvalue:
        derived.averageStrokeRate != null
          ? `Avg ${formatNumber(derived.averageStrokeRate, 0)} spm`
          : null,
    },
    {
      label: "Distance Remaining",
      value: formatDistance(derived.distanceToGo),
      subvalue: targetDistance
        ? `Target ${formatDistance(targetDistance)}`
        : targetTime
          ? `Target ${formatDuration(targetTime)}`
          : activeWorkout
            ? null
            : "No workout — just row",
    },
    {
      label: "Time Remaining",
      value:
        metrics.remainingTime != null
          ? formatDuration(metrics.remainingTime)
          : "--",
      subvalue: "From PM5 (when workout on monitor)",
    },
    {
      label: "Distance Rowed",
      value: formatDistance(derived.sessionDistance),
      subvalue:
        derived.sessionStrokeCount != null
          ? `${formatNumber(derived.sessionStrokeCount, 0)} strokes`
          : null,
    },
    {
      label: "Watts",
      value: formatWatts(derived.watts),
      subvalue:
        derived.averagePower != null
          ? `Avg ${formatWatts(derived.averagePower)}`
          : null,
      highlight: true,
    },
    {
      label: "Damper",
      value:
        metrics.resistanceLevel != null
          ? `${formatNumber(metrics.resistanceLevel, 0)}`
          : "--",
      subvalue: "From PM5 (drag factor on monitor)",
    },
    {
      label: "Drive Length",
      value: "—",
      subvalue: "Set on PM5",
    },
    {
      label: "Predicted Finish Time",
      value: formatDuration(derived.predictedFinishTime),
      subvalue: targetDistance ? "Based on avg pace" : null,
    },
    {
      label: "Elapsed Time",
      value: formatDuration(derived.elapsedTime),
      subvalue: "From PM5",
    },
    {
      label: "Heart Rate",
      value:
        metrics.heartRate != null ? `${metrics.heartRate} bpm` : "--",
      subvalue:
        metrics.metabolicEquivalent != null
          ? `${metrics.metabolicEquivalent} METs`
          : null,
    },
  ];

  const handleJustRow = () => {
    setActiveWorkout(null);
    setView("rowing");
    connect();
  };

  const handleConnectAndRow = () => {
    setView("rowing");
    connect();
  };

  if (view === "setup") {
    return (
      <div className="app">
        <header className="app__header">
          <h1>Rowing Live</h1>
          <p>Set up your row, then connect to your PM5.</p>
        </header>
        {error ? <div className="alert">{error}</div> : null}
        <SetupScreen
          activeWorkout={activeWorkout}
          onSelectJustRow={handleJustRow}
          onConnectAndRow={handleConnectAndRow}
        >
          <WorkoutBuilder
            standardWorkouts={standardWorkouts}
            customWorkouts={customWorkouts}
            activeWorkout={activeWorkout}
            onActivate={setActiveWorkout}
            onSaveCustom={handleSaveCustomWorkout}
            onRemoveCustom={handleRemoveCustomWorkout}
          />
        </SetupScreen>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Rowing Live</h1>
          <p>
            {activeWorkout
              ? `Workout: ${activeWorkout.name} — data from PM5.`
              : "Just row — data from PM5."}
          </p>
        </div>
        <div className="header-actions">
          <StatusPill status={status} />
          <div className="button-row">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setView("setup")}
            >
              Back to setup
            </button>
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
          <h2>Live output from PM5</h2>
          <p>
            Pace /500m, distance remaining, watts, and power curve from the
            monitor.
          </p>
        </div>
        <div className="metrics-grid">
          {metricsView.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
        <div className="chart-grid">
          <PerformanceChart
            title="Power curve (from PM5)"
            samples={sessionSamples}
            powerOnly
          />
          <div className="info-card">
            <h3>Session</h3>
            <div className="form-grid">
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

      {status === "disconnected" ? (
        <section className="panel">
          <div className="panel__header">
            <h2>Workout</h2>
            <p>Change workout from setup, or reconnect.</p>
          </div>
          {activeWorkout ? (
            <div className="active-workout">
              <strong>{activeWorkout.name}</strong> —{" "}
              {getWorkoutTargetDistance(activeWorkout)
                ? formatDistance(getWorkoutTargetDistance(activeWorkout))
                : getWorkoutTargetTime(activeWorkout)
                  ? formatDuration(getWorkoutTargetTime(activeWorkout))
                  : ""}
            </div>
          ) : (
            <p>Just row (no workout).</p>
          )}
        </section>
      ) : null}

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
