export const FITNESS_MACHINE_SERVICE_UUID = 0x1826;
export const INDOOR_ROWING_DATA_UUID = 0x2ad1;
export const FITNESS_MACHINE_CONTROL_POINT_UUID = 0x2ad9;

const FLAG_MORE_DATA = 0x0001;
const FLAG_AVERAGE_STROKE_RATE = 0x0002;
const FLAG_TOTAL_DISTANCE = 0x0004;
const FLAG_INSTANTANEOUS_PACE = 0x0008;
const FLAG_AVERAGE_PACE = 0x0010;
const FLAG_TOTAL_ENERGY = 0x0020;
const FLAG_ENERGY_PER_HOUR = 0x0040;
const FLAG_ENERGY_PER_MINUTE = 0x0080;
const FLAG_HEART_RATE = 0x0100;
const FLAG_MET = 0x0200;
const FLAG_ELAPSED_TIME = 0x0400;
const FLAG_REMAINING_TIME = 0x0800;

const canRead = (view, offset, size) => offset + size <= view.byteLength;

const readUint24LE = (view, offset) => {
  return (
    view.getUint8(offset) |
    (view.getUint8(offset + 1) << 8) |
    (view.getUint8(offset + 2) << 16)
  );
};

export const parseIndoorRowingData = (dataView) => {
  const view = dataView instanceof DataView ? dataView : new DataView(dataView);
  let offset = 0;
  if (!canRead(view, offset, 2)) {
    return {};
  }
  const flags = view.getUint16(offset, true);
  offset += 2;
  const result = {};

  if (!canRead(view, offset, 3)) {
    return result;
  }

  const strokeRateRaw = view.getUint8(offset);
  offset += 1;
  result.strokeRate = strokeRateRaw / 2;

  result.strokeCount = view.getUint16(offset, true);
  offset += 2;

  if (flags & FLAG_AVERAGE_STROKE_RATE && canRead(view, offset, 1)) {
    result.averageStrokeRate = view.getUint8(offset) / 2;
    offset += 1;
  }

  if (flags & FLAG_TOTAL_DISTANCE && canRead(view, offset, 3)) {
    result.totalDistance = readUint24LE(view, offset);
    offset += 3;
  }

  if (flags & FLAG_INSTANTANEOUS_PACE && canRead(view, offset, 2)) {
    result.instantaneousPace = view.getUint16(offset, true) / 2;
    offset += 2;
  }

  if (flags & FLAG_AVERAGE_PACE && canRead(view, offset, 2)) {
    result.averagePace = view.getUint16(offset, true) / 2;
    offset += 2;
  }
  // Pace units per GATT: uint16, resolution 0.5 s per 500m → value/2 = sec/500m

  if (flags & FLAG_TOTAL_ENERGY && canRead(view, offset, 2)) {
    result.totalEnergy = view.getUint16(offset, true);
    offset += 2;
  }

  if (flags & FLAG_ENERGY_PER_HOUR && canRead(view, offset, 2)) {
    result.energyPerHour = view.getUint16(offset, true);
    offset += 2;
  }

  if (flags & FLAG_ENERGY_PER_MINUTE && canRead(view, offset, 1)) {
    result.energyPerMinute = view.getUint8(offset);
    offset += 1;
  }

  if (flags & FLAG_HEART_RATE && canRead(view, offset, 1)) {
    result.heartRate = view.getUint8(offset);
    offset += 1;
  }

  if (flags & FLAG_MET && canRead(view, offset, 1)) {
    result.metabolicEquivalent = view.getUint8(offset) / 10;
    offset += 1;
  }

  if (flags & FLAG_ELAPSED_TIME && canRead(view, offset, 2)) {
    result.elapsedTime = view.getUint16(offset, true);
    offset += 2;
  }

  if (flags & FLAG_REMAINING_TIME && canRead(view, offset, 2)) {
    result.remainingTime = view.getUint16(offset, true);
    offset += 2;
  }

  if (flags & FLAG_MORE_DATA) {
    if (canRead(view, offset, 2)) {
      result.instantaneousPower = view.getInt16(offset, true);
      offset += 2;
    }
    if (canRead(view, offset, 2)) {
      result.averagePower = view.getInt16(offset, true);
      offset += 2;
    }
    if (canRead(view, offset, 2)) {
      result.resistanceLevel = view.getUint16(offset, true);
      offset += 2;
    }
  }

  return result;
};
