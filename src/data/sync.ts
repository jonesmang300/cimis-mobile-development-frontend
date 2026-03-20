import { App } from "@capacitor/app";
import {
  countOfflineGroups,
  countPendingOps,
  deletePendingOp,
  enqueueOp,
  listFailedOfflineGroups,
  listOfflineGroupMembers,
  listOfflineGroups,
  listPendingOps,
  markOfflineGroupCreating,
  markOfflineGroupFailed,
  markOfflineGroupSynced,
  OfflineGroupRecord,
  PendingOp,
  replaceOfflineGroupMembers,
  updateOfflineGroupStatus,
} from "./db";
import { isOnline, onNetworkChange } from "../plugins/network";

type QueueListener = (count: number) => void;
const queueListeners = new Set<QueueListener>();

export type SyncUpdateEvent = {
  at: number;
  queueCount: number;
};

type SyncUpdateListener = (event: SyncUpdateEvent) => void;
const syncUpdateListeners = new Set<SyncUpdateListener>();

export type SyncQueueItem = {
  id: string;
  kind: "pending-op" | "offline-group";
  title: string;
  detail: string;
  status: "queued" | "failed" | "creating";
  createdAt: number;
  groupId?: string;
  errorMessage?: string;
};

const BASE_URL = "https://comsip.cloud/api";
let flushing = false;

const getQueueCount = async () => {
  const [pendingOps, offlineGroups] = await Promise.all([
    countPendingOps(),
    countOfflineGroups(),
  ]);
  return pendingOps + offlineGroups;
};

const notifyQueue = async () => {
  const count = await getQueueCount();
  queueListeners.forEach((listener) => listener(count));
};

const emitSyncUpdate = async () => {
  const count = await getQueueCount();
  const event = {
    at: Date.now(),
    queueCount: count,
  };
  syncUpdateListeners.forEach((listener) => listener(event));
};

export const subscribeQueueCount = (listener: QueueListener): (() => void) => {
  queueListeners.add(listener);
  notifyQueue();
  return () => queueListeners.delete(listener);
};

export const subscribeSyncUpdates = (
  listener: SyncUpdateListener,
): (() => void) => {
  syncUpdateListeners.add(listener);
  return () => syncUpdateListeners.delete(listener);
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Sync failed";
};

const safeJsonParse = <T,>(value: string | null | undefined): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeQueuedBody = (body: string | null): string | undefined => {
  if (body == null) return undefined;

  let current = body;

  for (let i = 0; i < 2; i += 1) {
    try {
      const parsed = JSON.parse(current);

      if (typeof parsed === "string") {
        current = parsed;
        continue;
      }

      return JSON.stringify(parsed);
    } catch {
      return current;
    }
  }

  return current;
};

const toDateOnly = (value: string | null | undefined) => {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const buildRequestUrl = (endpoint: string) =>
  endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

const buildAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const replayOp = async (op: PendingOp) => {
  const options: RequestInit = {
    method: op.method,
    headers: {
      ...buildAuthHeaders(),
      ...(op.headers ? JSON.parse(op.headers) : {}),
    },
    body: normalizeQueuedBody(op.body),
  };

  const res = await fetch(buildRequestUrl(op.endpoint), options);
  if (!res.ok) {
    throw new Error(`Replay failed with status ${res.status}`);
  }
};

// Controlled concurrency helper
const runWithLimit = async <T>(
  items: T[],
  limit: number,
  handler: (item: T) => Promise<void>,
) => {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) return;
      await handler(next);
    }
  });
  await Promise.all(workers);
};

const syncOfflineGroupRecord = async (group: OfflineGroupRecord) => {
  const online = await isOnline().catch(() => false);
  if (!online) {
    throw new Error("Device is offline");
  }

  const headers = buildAuthHeaders();
  let serverGroupId: string | null = group.server_group_id || null;

  // If creation was in-flight and never finished, allow retry after a grace period.
  const staleCreating =
    group.status === "creating" &&
    !serverGroupId &&
    group.updated_at &&
    Date.now() - Number(group.updated_at) > 120000;

  if (group.status === "creating" && !serverGroupId && !staleCreating) {
    throw new Error("Group sync is already in progress");
  }

  if (staleCreating) {
    await updateOfflineGroupStatus(group.client_id, "pending");
  }

  await markOfflineGroupCreating(group.client_id);

  const groupPayload =
    typeof group.payload === "string" ? JSON.parse(group.payload) : group.payload;
  const members = await listOfflineGroupMembers(group.client_id);
  const fallbackDeviceId = groupPayload?.deviceId || null;
  const memberPayload = members
    .filter(
      (member: any) =>
        member &&
        typeof member.sppCode === "string" &&
        member.sppCode.trim() !== "",
    )
    .map((member: any) => ({
      ...member,
      dob: toDateOnly(member.dob),
      selected: member.selected ?? 1,
      deviceId: member.deviceId || fallbackDeviceId,
    }));

  if (memberPayload.length === 0) {
    throw new Error("No valid members found for sync");
  }

  const formationRes = await fetch(`${BASE_URL}/groups/sync-with-beneficiaries`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      group: groupPayload,
      beneficiaries: memberPayload,
      existingGroupId: serverGroupId || undefined,
    }),
  });

  let formationData: any = null;
  try {
    formationData = await formationRes.json();
  } catch {
    formationData = null;
  }

  if (!formationRes.ok) {
    const message =
      (formationData && (formationData.message || formationData.error)) ||
      `Status ${formationRes.status}`;
    throw new Error(message);
  }

  serverGroupId = String(formationData?.groupID || formationData?.id || serverGroupId || "").trim();
  if (!serverGroupId) {
    throw new Error("Missing groupID from formation sync response");
  }

  await replaceOfflineGroupMembers(
    group.client_id,
    memberPayload.map((member: any) => ({
      ...member,
      groupCode: serverGroupId,
      groupID: serverGroupId,
    })),
  );

  await markOfflineGroupSynced(group.client_id, serverGroupId);

  if (typeof window !== "undefined") {
    const selectedId = localStorage.getItem("selectedGroupID");
    if (selectedId === group.temp_group_id) {
      localStorage.setItem("selectedGroupID", serverGroupId);
    }
  }
};

const syncOfflineGroups = async (groupsArg?: OfflineGroupRecord[]) => {
  const online = await isOnline().catch(() => false);
  if (!online) return false;

  const groups = groupsArg ?? ((await listOfflineGroups()) as OfflineGroupRecord[]);
  let changed = false;

  const syncOneGroup = async (group: OfflineGroupRecord) => {
    try {
      await syncOfflineGroupRecord(group);
      changed = true;
    } catch (error) {
      console.warn("Failed to sync offline group", group.client_id, error);
      await markOfflineGroupFailed(
        group.client_id,
        group.server_group_id || undefined,
        getErrorMessage(error),
      );
      changed = true;
    }
  };

  await runWithLimit(groups, 3, syncOneGroup);
  return changed;
};

const getPendingOpDetail = (op: PendingOp) => {
  const endpoint = op.endpoint.replace(BASE_URL, "");
  return `${op.method} ${endpoint}`;
};

const getOfflineGroupTitle = (group: OfflineGroupRecord) => {
  const payload = safeJsonParse<{ groupname?: string }>(group.payload);
  const groupName = String(payload?.groupname || "").trim();
  const groupId = String(group.server_group_id || group.temp_group_id || "").trim();
  return groupName ? `${groupName} (${groupId})` : groupId || "Offline Group";
};

export const listSyncQueueItems = async (): Promise<SyncQueueItem[]> => {
  const [pendingOps, offlineGroups] = await Promise.all([
    listPendingOps(),
    listOfflineGroups(),
  ]);

  const pendingItems: SyncQueueItem[] = pendingOps.map((op) => ({
    id: `op:${op.id}`,
    kind: "pending-op",
    title: "Pending request",
    detail: getPendingOpDetail(op),
    status: "queued",
    createdAt: Number(op.created_at || 0),
  }));

  const groupItems: SyncQueueItem[] = (offlineGroups as OfflineGroupRecord[]).map(
    (group) => ({
      id: `group:${group.client_id}`,
      kind: "offline-group",
      title: getOfflineGroupTitle(group),
      detail:
        group.status === "failed"
          ? String(group.last_error || "Sync failed")
          : "Waiting to sync group and beneficiaries",
      status:
        group.status === "failed"
          ? "failed"
          : group.status === "creating"
          ? "creating"
          : "queued",
      createdAt: Number(group.created_at || group.updated_at || 0),
      groupId: String(group.server_group_id || group.temp_group_id || ""),
      errorMessage: group.last_error ? String(group.last_error) : undefined,
    }),
  );

  return [...groupItems, ...pendingItems].sort((a, b) => b.createdAt - a.createdAt);
};

export const getFailedOfflineGroupError = async () => {
  const failedGroups = await listFailedOfflineGroups();
  const latest = failedGroups[0];

  return {
    count: failedGroups.length,
    message: latest?.last_error ? String(latest.last_error) : "",
    groupId: latest
      ? String(latest.server_group_id || latest.temp_group_id || "")
      : "",
  };
};

export const syncSelectedQueueItems = async (itemIds: string[]) => {
  const online = await isOnline().catch(() => false);
  if (!online) {
    throw new Error("Device is offline");
  }

  const uniqueIds = Array.from(new Set(itemIds));
  const [pendingOps, offlineGroups] = await Promise.all([
    listPendingOps(),
    listOfflineGroups(),
  ]);

  let syncedCount = 0;
  const failed: string[] = [];

  for (const itemId of uniqueIds) {
    try {
      if (itemId.startsWith("op:")) {
        const opId = Number(itemId.replace("op:", ""));
        const op = pendingOps.find((entry) => entry.id === opId);
        if (!op) continue;
        await replayOp(op);
        await deletePendingOp(op.id);
        syncedCount += 1;
        continue;
      }

      if (itemId.startsWith("group:")) {
        const clientId = itemId.replace("group:", "");
        const group = (offlineGroups as OfflineGroupRecord[]).find(
          (entry) => entry.client_id === clientId,
        );
        if (!group) continue;
        await syncOfflineGroupRecord(group);
        syncedCount += 1;
      }
    } catch (error) {
      if (itemId.startsWith("group:")) {
        const clientId = itemId.replace("group:", "");
        const group = (offlineGroups as OfflineGroupRecord[]).find(
          (entry) => entry.client_id === clientId,
        );
        if (group) {
          await markOfflineGroupFailed(
            group.client_id,
            group.server_group_id || undefined,
            getErrorMessage(error),
          );
        }
      }

      const label =
        itemId.startsWith("group:")
          ? `Group ${itemId.replace("group:", "")}: ${getErrorMessage(error)}`
          : `Request ${itemId.replace("op:", "")}: ${getErrorMessage(error)}`;
      failed.push(label);
    }
  }

  await notifyQueue();
  if (syncedCount > 0 || failed.length > 0) {
    await emitSyncUpdate();
  }

  return {
    syncedCount,
    failed,
  };
};

export const flushQueue = async (): Promise<void> => {
  if (flushing) return;
  flushing = true;
  let changed = false;
  try {
    const online = await isOnline().catch(() => false);
    if (!online) return;

    const pending = await listPendingOps();
    for (const op of pending) {
      try {
        await replayOp(op);
        await deletePendingOp(op.id);
        changed = true;
      } catch (error) {
        console.warn("Failed to replay op", op.id, error);
      }
    }

    changed = (await syncOfflineGroups()) || changed;
  } finally {
    flushing = false;
    await notifyQueue();
    if (changed) {
      await emitSyncUpdate();
    }
  }
};

let started = false;
let intervalId: any = null;

export const startSyncService = () => {
  if (started) return;
  started = true;

  onNetworkChange((connected) => {
    if (connected) {
      flushQueue();
    }
  });

  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) {
      flushQueue();
    }
  }).catch(() => null);

  if (typeof window !== "undefined") {
    window.addEventListener("online", () => flushQueue());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        flushQueue();
      }
    });
  }

  intervalId = setInterval(() => {
    if (!flushing) {
      flushQueue();
    }
  }, 15000);

  flushQueue();
};

export const queueOfflineOp = async (
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
) => {
  await enqueueOp(method, endpoint, body, headers);
  await notifyQueue();
};
