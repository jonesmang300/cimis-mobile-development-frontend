import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const DEVICE_ID_KEY = "deviceId";
const isNative = Capacitor.getPlatform() !== "web";

const createDeviceId = () =>
  "dev_" +
  Math.random().toString(36).slice(2) +
  "_" +
  Date.now().toString(36);

export const getStableDeviceId = async (): Promise<string> => {
  if (!isNative) {
    const webDeviceId =
      localStorage.getItem(DEVICE_ID_KEY) || createDeviceId();

    localStorage.setItem(DEVICE_ID_KEY, webDeviceId);
    return webDeviceId;
  }

  const { value } = await Preferences.get({ key: DEVICE_ID_KEY });
  if (value) return value;

  const newId = createDeviceId();
  await Preferences.set({ key: DEVICE_ID_KEY, value: newId });

  return newId;
};
