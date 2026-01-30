export const standardWorkouts = [
  {
    id: "workout-2k",
    name: "2,000m Time Trial",
    type: "distance",
    targetDistance: 2000,
  },
  {
    id: "workout-5k",
    name: "5,000m Endurance",
    type: "distance",
    targetDistance: 5000,
  },
  {
    id: "workout-10k",
    name: "10,000m Endurance",
    type: "distance",
    targetDistance: 10000,
  },
  {
    id: "workout-30min",
    name: "30 Minute Steady Row",
    type: "time",
    targetTime: 30 * 60,
  },
  {
    id: "workout-5x500",
    name: "5 x 500m Intervals",
    type: "interval",
    intervals: [
      {
        distance: 500,
        rest: 60,
        repeat: 5,
      },
    ],
  },
  {
    id: "workout-4x1k",
    name: "4 x 1,000m Intervals",
    type: "interval",
    intervals: [
      {
        distance: 1000,
        rest: 120,
        repeat: 4,
      },
    ],
  },
];

export const getWorkoutTargetDistance = (workout) => {
  if (!workout) return null;
  if (workout.type === "distance") return workout.targetDistance ?? null;
  if (workout.type === "interval" && Array.isArray(workout.intervals)) {
    return workout.intervals.reduce((total, interval) => {
      const repeat = interval.repeat ?? 1;
      const distance = interval.distance ?? 0;
      return total + repeat * distance;
    }, 0);
  }
  return null;
};

export const getWorkoutTargetTime = (workout) => {
  if (!workout) return null;
  if (workout.type === "time") return workout.targetTime ?? null;
  if (workout.type === "interval" && Array.isArray(workout.intervals)) {
    return workout.intervals.reduce((total, interval) => {
      const repeat = interval.repeat ?? 1;
      const time = interval.time ?? 0;
      const rest = interval.rest ?? 0;
      return total + repeat * (time + rest);
    }, 0);
  }
  return null;
};
