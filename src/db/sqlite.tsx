import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";

/* =========================
   CONFIG
========================= */
const DB_NAME = "offline_db";
const DB_VERSION = 1;

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

/* =========================
   HELPERS
========================= */
const isWeb = () => Capacitor.getPlatform() === "web";

const ensureDB = (): SQLiteDBConnection => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

/* =========================
   SQLITE INIT
========================= */
export const initSQLite = async () => {
  if (isWeb()) {
    await sqlite.initWebStore();
  }
};

/* =========================
   INIT DB (PRODUCTION SAFE)
========================= */
export const initDB = async (): Promise<SQLiteDBConnection> => {
  if (isWeb()) {
    throw new Error("SQLite disabled on web");
  }

  if (db) return db;

  await initSQLite();

  await sqlite.checkConnectionsConsistency();

  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      DB_NAME,
      false,
      "no-encryption",
      DB_VERSION,
      false,
    );
  }

  await db.open();

  // =========================
  // TABLES (NO BENEFICIARIES)
  // =========================
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS regions (
      regionID TEXT PRIMARY KEY,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS districts (
      DistrictID TEXT PRIMARY KEY,
      DistrictName TEXT,
      regionID TEXT
    );

    CREATE TABLE IF NOT EXISTS tas (
      TAID TEXT PRIMARY KEY,
      TAName TEXT,
      DistrictID TEXT
    );

    CREATE TABLE IF NOT EXISTS village_clusters (
      villageClusterID TEXT PRIMARY KEY,
      villageClusterName TEXT,
      taID TEXT,
      districtID TEXT
    );
  `);

  return db;
};

/* =========================
   APP META
========================= */
export const setAppMeta = async (key: string, value: string) => {
  if (isWeb()) return;

  await initDB();

  await ensureDB().run(
    `INSERT OR REPLACE INTO app_meta (key,value) VALUES (?,?)`,
    [key, value],
  );
};

export const getAppMeta = async (key: string): Promise<string | null> => {
  if (isWeb()) return null;

  await initDB();

  const res = await ensureDB().query(
    `SELECT value FROM app_meta WHERE key=? LIMIT 1`,
    [key],
  );

  return res.values?.[0]?.value ?? null;
};

/**
 * ✅ Stable device id stored once in SQLite app_meta
 */
export const getStableDeviceId = async (): Promise<string> => {
  if (isWeb()) return "web";

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

/* =========================
   SEED CONTROL
========================= */
const isDbSeeded = async (): Promise<boolean> => {
  const res = await ensureDB().query(
    `SELECT value FROM app_meta WHERE key='seeded' LIMIT 1`,
  );
  return (res.values?.length ?? 0) > 0;
};

const markDbSeeded = async () => {
  await ensureDB().run(
    `INSERT OR REPLACE INTO app_meta (key,value) VALUES ('seeded','1')`,
  );
};

/* =========================
   INIT + SEED (SAFE)
========================= */
export const initAndSeed = async () => {
  if (isWeb()) {
    console.log("🌐 Web detected — skipping SQLite");
    return;
  }

  await initDB();

  if (await isDbSeeded()) return;

  console.log("🌱 First install — seeding data");

  await loadRegionsFromJson();
  await loadDistrictsFromJson();
  await loadTAsFromJson();
  await loadVillageClustersFromJson();

  await markDbSeeded();
};

/* =========================
   LOAD MASTER DATA
========================= */
export const loadRegionsFromJson = async () => {
  if (isWeb()) return;
  await initDB();

  const data = await (await fetch("/regions.json")).json();
  const db = ensureDB();

  for (const r of data) {
    await db.run(`INSERT OR IGNORE INTO regions (regionID,name) VALUES (?,?)`, [
      String(r.regionID),
      r.name,
    ]);
  }
};

export const loadDistrictsFromJson = async () => {
  if (isWeb()) return;
  await initDB();

  const data = await (await fetch("/districts.json")).json();
  const db = ensureDB();

  for (const d of data) {
    await db.run(
      `INSERT OR IGNORE INTO districts (DistrictID,DistrictName,regionID)
       VALUES (?,?,?)`,
      [String(d.DistrictID), d.DistrictName, String(d.regionID)],
    );
  }
};

export const loadTAsFromJson = async () => {
  if (isWeb()) return;
  await initDB();

  const data = await (await fetch("/tas.json")).json();
  const db = ensureDB();

  for (const t of data) {
    await db.run(
      `INSERT OR IGNORE INTO tas (TAID,TAName,DistrictID)
       VALUES (?,?,?)`,
      [String(t.TAID), t.TAName, String(t.DistrictID)],
    );
  }
};

export const loadVillageClustersFromJson = async () => {
  if (isWeb()) return;
  await initDB();

  const data = await (await fetch("/village_clusters.json")).json();
  const db = ensureDB();

  for (const v of data) {
    await db.run(
      `INSERT OR IGNORE INTO village_clusters
       (villageClusterID,villageClusterName,taID,districtID)
       VALUES (?,?,?,?)`,
      [
        String(v.villageClusterID),
        v.villageClusterName,
        String(v.taID),
        String(v.districtID),
      ],
    );
  }
};

/* =========================
   READ QUERIES (MASTER DATA)
========================= */
export const getRegions = async () => {
  if (isWeb()) return { values: [] };
  await initAndSeed();
  return ensureDB().query(`SELECT * FROM regions ORDER BY name`);
};

export const getDistricts = async (regionID: string) => {
  if (isWeb()) return { values: [] };
  await initAndSeed();
  return ensureDB().query(
    `SELECT * FROM districts WHERE regionID=? ORDER BY DistrictName`,
    [regionID],
  );
};

export const getTAs = async (districtID: string) => {
  if (isWeb()) return { values: [] };
  await initAndSeed();
  return ensureDB().query(
    `SELECT * FROM tas WHERE DistrictID=? ORDER BY TAName`,
    [districtID],
  );
};

export const getVillageClusters = async (taID: string) => {
  if (isWeb()) return { values: [] };
  await initAndSeed();
  return ensureDB().query(
    `SELECT * FROM village_clusters WHERE taID=? ORDER BY villageClusterName`,
    [taID],
  );
};
