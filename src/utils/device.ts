import { Capacitor } from "@capacitor/core";
import { initAndSeed, getAppMeta, setAppMeta } from "../db/sqlite";

const isNative = Capacitor.getPlatform() !== "web";

export const getStableDeviceId = async (): Promise<string> => {
  if (!isNative) return "web";

  await initAndSeed();

  const existing = await getAppMeta("deviceId");
  if (existing) return existing;

  const newId =
    "dev_" +
    Math.random().toString(36).slice(2) +
    "_" +
    Date.now().toString(36);

  await setAppMeta("deviceId", newId);
  return newId;
};
