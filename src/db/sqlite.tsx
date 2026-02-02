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
  if (Capacitor.getPlatform() === "web") {
    await sqlite.initWebStore();
  }
};

/* =========================
   INTERNAL HELPER
========================= */
const ensureDB = (): SQLiteDBConnection => {
  if (!db) throw new Error("Database not initialized");
  return db;
};

/* =========================
   INIT DATABASE + TABLES
========================= */
export const initDB = async (): Promise<SQLiteDBConnection> => {
  if (db) return db;

  if (Capacitor.getPlatform() === "web") {
    throw new Error("SQLite disabled on web");
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

  return db;
};

/* =========================
   SEED CONTROL
========================= */
const isDbSeeded = async (): Promise<boolean> => {
  const res = await ensureDB().query(
    `SELECT value FROM app_meta WHERE key='seeded'`,
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
  if (Capacitor.getPlatform() === "web") {
    console.log("🌐 Web detected — skipping SQLite");
    return;
  }

  await initDB();

  if (await isDbSeeded()) {
    console.log("📦 SQLite already seeded");
    return;
  }

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
   BENEFICIARIES (SAFE LOAD)
========================= */
export const preloadBeneficiaries = async (villageClusterID: string) => {
  const db = ensureDB();

  const existing = await db.query(
    `SELECT 1 FROM beneficiaries WHERE villageClusterID=? LIMIT 1`,
    [villageClusterID],
  );

  if (existing.values?.length) return;

  const data = await (
    await fetch(
      `${API}/beneficiaries/filter?villageClusterID=${villageClusterID}`,
    )
  ).json();

  const sql = `
    INSERT OR IGNORE INTO beneficiaries (
      sppCode,hh_head_name,sex,dob,nat_id,hh_code,
      regionID,districtID,taID,villageClusterID,
      groupname,selected,created_at,updated_at,dirty
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)
  `;

  for (const b of data) {
    await db.run(sql, [
      b.sppCode,
      b.hh_head_name,
      b.sex,
      b.dob,
      b.nat_id,
      b.hh_code,
      b.regionID,
      b.districtID,
      b.taID,
      b.villageClusterID,
      b.groupname,
      b.selected,
      b.created_at,
      b.updated_at,
    ]);
  }
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
