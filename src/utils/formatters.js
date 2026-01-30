export const formatNumber = (value, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || Number.isNaN(meters)) {
    return "--";
  }
  if (meters >= 1000) {
    return `${formatNumber(meters / 1000, 2)} km`;
  }
  return `${formatNumber(meters, 0)} m`;
};

export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "--";
  }
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const formatPace = (secondsPer500) => {
  if (
    secondsPer500 === null ||
    secondsPer500 === undefined ||
    Number.isNaN(secondsPer500)
  ) {
    return "--";
  }
  return `${formatDuration(secondsPer500)} / 500m`;
};

export const formatWatts = (watts) => {
  if (watts === null || watts === undefined || Number.isNaN(watts)) {
    return "--";
  }
  return `${formatNumber(watts, 0)} W`;
};

export const paceToWatts = (secondsPer500) => {
  if (
    secondsPer500 === null ||
    secondsPer500 === undefined ||
    Number.isNaN(secondsPer500) ||
    secondsPer500 <= 0
  ) {
    return null;
  }
  const paceSeconds = secondsPer500;
  const watts = 2.8 / Math.pow(paceSeconds / 500, 3);
  if (!Number.isFinite(watts)) {
    return null;
  }
  return watts;
};

export const clampNumber = (value, min, max) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};
