import { useCallback, useEffect, useRef, useState } from "react";
import {
  FITNESS_MACHINE_SERVICE_UUID,
  INDOOR_ROWING_DATA_UUID,
  parseIndoorRowingData,
} from "../utils/ble";

const DEFAULT_METRICS = {
  strokeRate: null,
  strokeCount: null,
  averageStrokeRate: null,
  totalDistance: null,
  instantaneousPace: null,
  averagePace: null,
  instantaneousPower: null,
  averagePower: null,
  resistanceLevel: null,
  totalEnergy: null,
  energyPerHour: null,
  energyPerMinute: null,
  heartRate: null,
  metabolicEquivalent: null,
  elapsedTime: null,
  remainingTime: null,
  lastUpdated: null,
};

const MAX_SAMPLES = 300;

const buildSample = (data, fallbackElapsed) => ({
  time: data.elapsedTime ?? fallbackElapsed ?? null,
  power: data.instantaneousPower ?? null,
  pace: data.instantaneousPace ?? null,
  distance: data.totalDistance ?? null,
  strokeRate: data.strokeRate ?? null,
});

export const useConcept2 = () => {
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [samples, setSamples] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const sessionStartRef = useRef(null);
  const demoIntervalRef = useRef(null);
  const demoStateRef = useRef({
    elapsedTime: 0,
    distance: 0,
    strokeCount: 0,
  });

  useEffect(() => {
    sessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

  const appendSample = useCallback((data) => {
    if (!sessionActiveRef.current) return;
    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }
    const fallbackElapsed = Math.round(
      (Date.now() - sessionStartRef.current) / 1000,
    );
    const nextSample = buildSample(data, fallbackElapsed);
    if (nextSample.time === null) return;
    setSamples((prev) => {
      const next = [...prev, nextSample];
      if (next.length > MAX_SAMPLES) {
        next.shift();
      }
      return next;
    });
  }, []);

  const handleRowingData = useCallback(
    (event) => {
      const parsed = parseIndoorRowingData(event.target.value);
      setMetrics((prev) => ({
        ...prev,
        ...parsed,
        lastUpdated: new Date().toISOString(),
      }));
      appendSample(parsed);
    },
    [appendSample],
  );

  const resetSession = useCallback(() => {
    setSamples([]);
    sessionStartRef.current = null;
  }, []);

  const startSession = useCallback(() => {
    resetSession();
    setIsSessionActive(true);
    sessionStartRef.current = Date.now();
  }, [resetSession]);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
  }, []);

  const cleanupBluetooth = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        characteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleRowingData,
        );
        await characteristicRef.current.stopNotifications();
      } catch (err) {
        // Ignore shutdown errors.
      }
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    characteristicRef.current = null;
    deviceRef.current = null;
  }, [handleRowingData]);

  const stopDemo = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const disconnect = useCallback(async () => {
    stopDemo();
    await cleanupBluetooth();
    setStatus("disconnected");
  }, [cleanupBluetooth, stopDemo]);

  const handleDisconnected = useCallback(() => {
    cleanupBluetooth();
    setStatus("disconnected");
  }, [cleanupBluetooth]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError("Web Bluetooth is not available in this browser.");
      return;
    }
    stopDemo();
    setError("");
    setStatus("connecting");
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [FITNESS_MACHINE_SERVICE_UUID] }],
        optionalServices: [FITNESS_MACHINE_SERVICE_UUID],
      });
      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", handleDisconnected);
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(
        FITNESS_MACHINE_SERVICE_UUID,
      );
      const rowerData = await service.getCharacteristic(
        INDOOR_ROWING_DATA_UUID,
      );
      characteristicRef.current = rowerData;
      rowerData.addEventListener(
        "characteristicvaluechanged",
        handleRowingData,
      );
      await rowerData.startNotifications();
      setStatus("connected");
    } catch (err) {
      setError(err?.message || "Unable to connect to the rowing machine.");
      setStatus("disconnected");
    }
  }, [handleDisconnected, handleRowingData, stopDemo]);

  const startDemo = useCallback(() => {
    if (demoIntervalRef.current) return;
    cleanupBluetooth();
    setError("");
    setStatus("demo");
    demoStateRef.current = {
      elapsedTime: 0,
      distance: 0,
      strokeCount: 0,
    };
    demoIntervalRef.current = setInterval(() => {
      const pace = 125 + Math.sin(Date.now() / 6000) * 8;
      const strokeRate = 24 + Math.sin(Date.now() / 4000) * 2;
      const distanceDelta = 500 / pace;
      demoStateRef.current.elapsedTime += 1;
      demoStateRef.current.distance += distanceDelta;
      demoStateRef.current.strokeCount += strokeRate / 60;
      const simulated = {
        strokeRate,
        strokeCount: Math.round(demoStateRef.current.strokeCount),
        totalDistance: demoStateRef.current.distance,
        instantaneousPace: pace,
        averagePace: pace + Math.sin(Date.now() / 8000) * 2,
        instantaneousPower: 2.8 / Math.pow(pace / 500, 3),
        averagePower: 2.8 / Math.pow(pace / 500, 3),
        elapsedTime: demoStateRef.current.elapsedTime,
        remainingTime: null,
      };
      setMetrics((prev) => ({
        ...prev,
        ...simulated,
        lastUpdated: new Date().toISOString(),
      }));
      appendSample(simulated);
    }, 1000);
  }, [appendSample, cleanupBluetooth]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    metrics,
    samples,
    isSessionActive,
    connect,
    disconnect,
    startSession,
    stopSession,
    resetSession,
    startDemo,
    stopDemo,
  };
};
