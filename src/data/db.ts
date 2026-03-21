import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";

const DB_NAME = "offline-cache";

let sqliteConnection: SQLiteConnection | null = null;
let cacheDb: SQLiteDBConnection | null = null;

/* ===============================
   SAFE JSON PARSER
================================ */

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/* ===============================
   WEB SQLITE INITIALIZATION
================================ */

const ensureWebStore = async () => {
  if (Capacitor.getPlatform() !== "web") return;

  if (!customElements.get("jeep-sqlite")) {
    await jeepSqlite(window);
    const el = document.createElement("jeep-sqlite");
    document.body.appendChild(el);
    await customElements.whenDefined("jeep-sqlite");
  }

  await CapacitorSQLite.initWebStore();
};

/* ===============================
   ENSURE DB CONNECTION
================================ */

const ensureConnection = async (): Promise<SQLiteDBConnection> => {
  if (cacheDb && (await cacheDb.isDBOpen())) {
    return cacheDb;
  }

  if (!sqliteConnection) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  if (Capacitor.getPlatform() === "web") {
    await ensureWebStore();
  }

  const db = await sqliteConnection.createConnection(
    DB_NAME,
    false,
    "no-encryption",
    1,
    false,
  );

  await db.open();

  await db.execute("PRAGMA foreign_keys = ON;");

  /* ===============================
     TABLES
  ================================ */

  await db.execute(`
    CREATE TABLE IF NOT EXISTS http_cache(
      endpoint TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pending_ops(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      body TEXT,
      headers TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS offline_groups(
      client_id TEXT PRIMARY KEY,
      temp_group_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      server_group_id TEXT,
      last_error TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  try {
    await db.execute("ALTER TABLE offline_groups ADD COLUMN last_error TEXT");
  } catch {
    // Column already exists on upgraded installs.
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS offline_group_members(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      member_payload TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_group_members_client
    ON offline_group_members(client_id)
  `);

  cacheDb = db;

  return db;
};

/* ===============================
   HTTP CACHE
================================ */

export const getCachedResponse = async <T>(endpoint: string): Promise<T | null> => {
  const db = await ensureConnection();
  const res = await db.query("SELECT payload FROM http_cache WHERE endpoint = ?", [endpoint]);
  const value = res.values?.[0]?.payload;
  if (!value) return null;
  return safeParse<T>(value);
};

export const saveCachedResponse = async <T>(endpoint: string, payload: T) => {
  const db = await ensureConnection();
  await db.run(
    "INSERT OR REPLACE INTO http_cache(endpoint,payload,updated_at) VALUES (?,?,?)",
    [endpoint, JSON.stringify(payload), Date.now()],
  );
};

/* ===============================
   PENDING OPERATIONS
================================ */

export type PendingOp = {
  id: number;
  method: string;
  endpoint: string;
  body: string | null;
  headers: string | null;
  created_at: number;
};

export const enqueueOp = async (
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
) => {
  const db = await ensureConnection();
  const serializedBody =
    body == null ? null : typeof body === "string" ? body : JSON.stringify(body);

  await db.run(
    "INSERT INTO pending_ops(method,endpoint,body,headers,created_at) VALUES (?,?,?,?,?)",
    [
      method.toUpperCase(),
      endpoint,
      serializedBody,
      headers ? JSON.stringify(headers) : null,
      Date.now(),
    ],
  );
};

export const listPendingOps = async (): Promise<PendingOp[]> => {
  const db = await ensureConnection();
  const res = await db.query("SELECT * FROM pending_ops ORDER BY id ASC");
  return (res.values as PendingOp[]) ?? [];
};

export const deletePendingOp = async (id: number) => {
  const db = await ensureConnection();
  await db.run("DELETE FROM pending_ops WHERE id = ?", [id]);
};

export const countPendingOps = async (): Promise<number> => {
  const db = await ensureConnection();
  const res = await db.query("SELECT COUNT(*) as count FROM pending_ops");
  return res.values?.[0]?.count ?? 0;
};

/* ===============================
   SAVE GROUP
================================ */

export const saveOfflineGroup = async (
  clientId: string,
  tempGroupId: string,
  payload: any,
  status = "pending",
  serverGroupId?: string | null,
) => {
  const db = await ensureConnection();

  const now = Date.now();

  await db.run(
    `INSERT OR REPLACE INTO offline_groups
     (client_id,temp_group_id,payload,status,server_group_id,last_error,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      clientId,
      tempGroupId,
      JSON.stringify(payload),
      status,
      serverGroupId ?? null,
      null,
      now,
      now,
    ],
  );
};

/* ===============================
   SAVE GROUP MEMBERS
================================ */

export const saveOfflineGroupMembers = async (
  clientId: string,
  members: any[],
  groupCode?: string,
) => {
  const db = await ensureConnection();

  if (!members.length) return;

  const now = Date.now();

  try {
    const statements = members
      .map((m) => {
        if (!m || typeof m.sppCode !== "string" || m.sppCode.trim() === "") {
          console.warn("Skipping offline member without sppCode", m);
          return null;
        }
        return {
          statement:
            "INSERT INTO offline_group_members(client_id,member_payload,created_at) VALUES (?,?,?)",
          values: [
            clientId,
            JSON.stringify({
              sppCode: m.sppCode.trim(),
              ...m,
              groupCode: m.groupCode ?? m.groupID ?? groupCode ?? clientId,
              groupID: m.groupID ?? m.groupCode ?? groupCode ?? clientId,
              selected: m.selected ?? 1,
            }),
            now,
          ],
        };
      })
      .filter(Boolean) as {
        statement:
          "INSERT INTO offline_group_members(client_id,member_payload,created_at) VALUES (?,?,?)",
        values: any[];
      }[];

    await db.executeSet(statements);
  } catch (e) {
    console.error("saveOfflineGroupMembers failed", e);
  }
};

/* ===============================
   LIST MEMBERS BY GROUP
================================ */

export const listOfflineMembersByGroupId = async (groupId: string) => {
  const db = await ensureConnection();

  const result = await db.query(
    `
    SELECT m.member_payload,g.temp_group_id,g.server_group_id
    FROM offline_group_members m
    JOIN offline_groups g ON g.client_id=m.client_id
    WHERE g.temp_group_id=? OR g.server_group_id=?`,
    [groupId, groupId],
  );

  const rows = result.values ?? [];

  return rows
    .map((r: any) => {
      const payload = safeParse<any>(r.member_payload);

      if (!payload) return null;

      const finalGroup = r.server_group_id || r.temp_group_id;

      return {
        ...payload,
        groupCode: payload.groupCode || finalGroup,
        groupID: payload.groupID || finalGroup,
      };
    })
    .filter(Boolean);
};

export const listOfflineGroupMembers = async (clientId: string) => {
  const db = await ensureConnection();
  const res = await db.query(
    "SELECT member_payload FROM offline_group_members WHERE client_id=? ORDER BY id ASC",
    [clientId],
  );
  const rows = res.values ?? [];
  return rows
    .map((r: any) => safeParse<any>(r.member_payload))
    .filter(Boolean);
};

/* ===============================
   LIST ALL OFFLINE ASSIGNMENTS
================================ */

export const listOfflineAssignments = async () => {
  const db = await ensureConnection();

  const result = await db.query(
    `
    SELECT m.member_payload,g.temp_group_id,g.server_group_id
    FROM offline_group_members m
    JOIN offline_groups g ON g.client_id=m.client_id
  `,
  );

  const rows = result.values ?? [];

  return rows
    .map((r: any) => {
      const payload = safeParse<any>(r.member_payload);

      if (!payload) return null;

      const finalGroup = r.server_group_id || r.temp_group_id;

      return {
        ...payload,
        groupCode: payload.groupCode || finalGroup,
        groupID: payload.groupID || finalGroup,
      };
    })
    .filter(Boolean);
};

/* ===============================
   OFFLINE GROUP LIST/COUNTS
================================ */

export const listOfflineGroups = async (
  statuses: string[] = ["pending", "failed", "creating"],
) => {
  const db = await ensureConnection();
  const placeholders = statuses.map(() => "?").join(",");
  const res = await db.query(
    `SELECT * FROM offline_groups WHERE status IN (${placeholders}) ORDER BY created_at ASC`,
    statuses,
  );
  return res.values ?? [];
};

export const countOfflineGroups = async (statuses: string[] = ["pending", "failed"]) => {
  const db = await ensureConnection();
  const placeholders = statuses.map(() => "?").join(",");
  const res = await db.query(
    `SELECT COUNT(*) as count FROM offline_groups WHERE status IN (${placeholders})`,
    statuses,
  );
  return res.values?.[0]?.count ?? 0;
};

export const markOfflineGroupSynced = async (clientId: string, serverGroupId: string) => {
  const db = await ensureConnection();
  const now = Date.now();
  await db.run(
    `UPDATE offline_groups SET status='synced', server_group_id=?, last_error=NULL, updated_at=? WHERE client_id=?`,
    [serverGroupId, now, clientId],
  );
};

export const markOfflineGroupFailed = async (
  clientId: string,
  serverGroupId?: string,
  lastError?: string | null,
) => {
  const db = await ensureConnection();
  const now = Date.now();
  await db.run(
    `UPDATE offline_groups
     SET status='failed',
         server_group_id=COALESCE(?,server_group_id),
         last_error=?,
         updated_at=?
     WHERE client_id=?`,
    [serverGroupId ?? null, lastError ?? null, now, clientId],
  );
};

export const markOfflineGroupCreating = async (clientId: string) => {
  const db = await ensureConnection();
  const now = Date.now();
  await db.run(
    `UPDATE offline_groups SET status='creating', last_error=NULL, updated_at=? WHERE client_id=?`,
    [now, clientId],
  );
};

export const updateOfflineGroupStatus = async (
  clientId: string,
  status: string,
): Promise<void> => {
  const db = await ensureConnection();
  const now = Date.now();
  await db.run(
    `UPDATE offline_groups SET status=?, last_error=NULL, updated_at=? WHERE client_id=?`,
    [status, now, clientId],
  );
};

export const setOfflineGroupServerId = async (
  clientId: string,
  serverGroupId: string,
): Promise<void> => {
  const db = await ensureConnection();
  const now = Date.now();
  await db.run(
    `UPDATE offline_groups
     SET server_group_id=?,
         last_error=NULL,
         updated_at=?
     WHERE client_id=?`,
    [serverGroupId, now, clientId],
  );
};

export const replaceOfflineGroupMembers = async (clientId: string, members: any[]) => {
  const db = await ensureConnection();
  await db.run("DELETE FROM offline_group_members WHERE client_id=?", [clientId]);

  if (!members.length) return;

  const now = Date.now();
  const statements = members.map((m) => ({
    statement:
      "INSERT INTO offline_group_members(client_id,member_payload,created_at) VALUES (?,?,?)",
    values: [clientId, JSON.stringify(m), now],
  }));

  await db.executeSet(statements);
};

export type OfflineGroupRecord = {
  client_id: string;
  temp_group_id: string;
  payload: string;
  status: string;
  server_group_id?: string | null;
  last_error?: string | null;
  created_at?: number;
  updated_at?: number;
};

export const listFailedOfflineGroups = async (): Promise<OfflineGroupRecord[]> => {
  const db = await ensureConnection();
  const res = await db.query(
    `SELECT *
     FROM offline_groups
     WHERE status = 'failed'
     ORDER BY updated_at DESC, created_at DESC`,
  );
  return (res.values as OfflineGroupRecord[]) ?? [];
};
