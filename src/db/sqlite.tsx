import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";

/* =========================
   SINGLETON
========================= */
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

const API = "https://api-development-j6pl.onrender.com/api";

/* =========================
   INIT SQLITE
========================= */
export const initSQLite = async () => {
  console.log("📦 Initializing SQLite...");

  if (Capacitor.getPlatform() === "web") {
    await sqlite.initWebStore();
  }

  console.log("✅ SQLite ready");
};

/* =========================
   INTERNAL HELPER
========================= */
const ensureDB = (): SQLiteDBConnection => {
  if (!db) {
    throw new Error("❌ Database not initialized. Call initDB() first.");
  }
  return db;
};

/* =========================
   INIT DATABASE + TABLES
========================= */
export const initDB = async (): Promise<SQLiteDBConnection> => {
  if (db) return db;

  if (Capacitor.getPlatform() === "web") {
    throw new Error("SQLite DB is disabled on web");
  }

  await initSQLite();

  db = await sqlite.createConnection(
    "offline_db",
    false,
    "no-encryption",
    1,
    false,
  );

  await db.open();

  await db.execute(`
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

    CREATE TABLE IF NOT EXISTS beneficiaries (
      sppCode TEXT PRIMARY KEY,
      hh_head_name TEXT,
      sex TEXT,
      dob TEXT,
      nat_id TEXT,
      hh_code TEXT,
      regionID TEXT,
      districtID TEXT,
      taID TEXT,
      villageClusterID TEXT,
      groupname TEXT,
      selected TEXT,
      created_at TEXT,
      updated_at TEXT,
      dirty INTEGER DEFAULT 0
    );
  `);

  console.log("✅ SQLite tables ensured");
  return db;
};

/* =========================
   INIT + SEED
========================= */
export const initAndSeed = async () => {
  await initDB();
  await loadRegionsFromJson();
  await loadDistrictsFromJson();
  await loadTAsFromJson();
  await loadVillageClustersFromJson();
};

/* =========================
   LOAD MASTER DATA
========================= */
export const loadRegionsFromJson = async () => {
  const database = ensureDB();
  const data = await (await fetch("/regions.json")).json();

  for (const r of data) {
    await database.run(
      `INSERT OR REPLACE INTO regions (regionID, name) VALUES (?, ?)`,
      [String(r.regionID), r.name],
    );
  }
};

export const loadDistrictsFromJson = async () => {
  const database = ensureDB();
  const data = await (await fetch("/districts.json")).json();

  for (const d of data) {
    await database.run(
      `INSERT OR REPLACE INTO districts (DistrictID, DistrictName, regionID)
       VALUES (?, ?, ?)`,
      [String(d.DistrictID), d.DistrictName, String(d.regionID)],
    );
  }
};

export const loadTAsFromJson = async () => {
  const database = ensureDB();
  const data = await (await fetch("/tas.json")).json();

  for (const t of data) {
    await database.run(
      `INSERT OR REPLACE INTO tas (TAID, TAName, DistrictID)
       VALUES (?, ?, ?)`,
      [String(t.TAID), t.TAName, String(t.DistrictID)],
    );
  }
};

export const loadVillageClustersFromJson = async () => {
  const database = ensureDB();
  const data = await (await fetch("/village_clusters.json")).json();

  for (const v of data) {
    await database.run(
      `INSERT OR REPLACE INTO village_clusters
       (villageClusterID, villageClusterName, taID, districtID)
       VALUES (?, ?, ?, ?)`,
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
   BENEFICIARIES SYNC
========================= */
export const preloadBeneficiaries = async (villageClusterID: string) => {
  const database = ensureDB();

  const url = `${API}/beneficiaries/filter?villageClusterID=${villageClusterID}`;
  const data = await (await fetch(url)).json();

  const sql = `
    INSERT OR REPLACE INTO beneficiaries (
      sppCode, hh_head_name, sex, dob, nat_id, hh_code,
      regionID, districtID, taID, villageClusterID,
      groupname, selected, created_at, updated_at, dirty
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)
  `;

  for (const b of data) {
    await database.run(sql, [
      b.sppCode,
      b.hh_head_name,
      b.sex,
      b.dob,
      b.nat_id,
      b.hh_code,
      String(b.regionID),
      String(b.districtID),
      String(b.taID),
      String(b.villageClusterID),
      b.groupname,
      b.selected,
      b.created_at,
      b.updated_at,
    ]);
  }

  localStorage.setItem("lastSync", new Date().toISOString());
};

/* =========================
   READ QUERIES
========================= */
export const getRegions = async () =>
  ensureDB().query(`SELECT * FROM regions ORDER BY name`);

export const getDistricts = async (regionID: string) =>
  ensureDB().query(
    `SELECT * FROM districts WHERE regionID=? ORDER BY DistrictName`,
    [regionID],
  );

export const getTAs = async (districtID: string) =>
  ensureDB().query(`SELECT * FROM tas WHERE DistrictID=? ORDER BY TAName`, [
    districtID,
  ]);

export const getVillageClusters = async (taID: string) =>
  ensureDB().query(
    `SELECT * FROM village_clusters WHERE taID=? ORDER BY villageClusterName`,
    [taID],
  );

export const getBeneficiaries = async (villageClusterID: string) =>
  ensureDB().query(
    `SELECT * FROM beneficiaries WHERE villageClusterID=? ORDER BY hh_head_name`,
    [villageClusterID],
  );

/* =========================
   DEBUG
========================= */
export const listSQLiteTables = async () => {
  const database = await initDB();

  const res = await database.query(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
  );

  console.log("📦 SQLite tables:", res.values);
};
