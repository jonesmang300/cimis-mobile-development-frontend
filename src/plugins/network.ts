import { Network } from "@capacitor/network";

let latestStatus: boolean | null = null;

/**
 * Returns current online status. Falls back to cached status to avoid a null
 * during early app boot.
 */
export const isOnline = async (): Promise<boolean> => {
  const status = await Network.getStatus();
  latestStatus = status.connected;
  return status.connected;
};

/**
 * Subscribe to network status changes. Returns an unsubscribe callback.
 */
export const onNetworkChange = (
  cb: (connected: boolean) => void,
): (() => void) => {
  const listener = Network.addListener("networkStatusChange", (status) => {
    latestStatus = status.connected;
    cb(status.connected);
  });

  return () => {
    listener.then((handle) => handle.remove()).catch(() => null);
  };
};

/**
 * Last known status without hitting the plugin. Useful for synchronous checks.
 */
export const getCachedStatus = () => latestStatus;
