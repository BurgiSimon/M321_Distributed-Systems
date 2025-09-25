// Node 20+
// npm i express cors morgan mqtt better-sqlite3
import express from "express";
import cors from "cors";
import morgan from "morgan";
import Database from "better-sqlite3";
import { connect } from "mqtt";

const {
  MQTT_URL = "mqtt://mosquitto:1883",
  MQTT_TOPIC = "weather",
  DB_PATH = "/data/weather.db",
  PORT = 3000,
} = process.env;

// --- DB setup ---
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS readings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  stationId   TEXT NOT NULL,
  ts          INTEGER NOT NULL,          -- unix ms
  temperature REAL,
  humidity    REAL,
  raw         TEXT                       -- original JSON
);
CREATE INDEX IF NOT EXISTS idx_readings_station_ts ON readings(stationId, ts);
`);
const insertReading = db.prepare(`
  INSERT INTO readings (stationId, ts, temperature, humidity, raw)
  VALUES (@stationId, @ts, @temperature, @humidity, @raw)
`);

// --- MQTT ingest ---
const client = connect(MQTT_URL, { reconnectPeriod: 2000 });
client.on("connect", () => {
  console.log("✓ MQTT connected:", MQTT_URL);
  client.subscribe(MQTT_TOPIC);
});
client.on("message", (_topic, payload) => {
  try {
    const obj = JSON.parse(payload.toString());
    const ts = obj.timestamp
      ? new Date(obj.timestamp).getTime()
      : Date.now();

    insertReading.run({
      stationId: String(obj.stationId ?? "WS-UNK"),
      ts,
      temperature: typeof obj.temperature === "number" ? obj.temperature : null,
      humidity: typeof obj.humidity === "number" ? obj.humidity : null,
      raw: JSON.stringify(obj),
    });
  } catch (e) {
    console.error("Ingest error:", e.message);
  }
});

// --- HTTP API ---
const app = express();
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

// GET /api/history?stationId=WS-01&from=iso|ms&to=iso|ms&limit=1000&bad=keep|drop
app.get("/api/history", (req, res) => {
  const stationId = String(req.query.stationId || "");
  if (!stationId) return res.status(400).json({ error: "stationId required" });

  const toMs = (v) => (isNaN(v) ? new Date(String(v)).getTime() : Number(v));
  const from = req.query.from ? toMs(req.query.from) : 0;
  const to = req.query.to ? toMs(req.query.to) : Date.now();
  const limit = Math.min(Number(req.query.limit || 1000), 10000);
  const bad = String(req.query.bad || "keep"); // "drop" to filter outliers

  let where = "stationId = ? AND ts BETWEEN ? AND ?";
  if (bad === "drop") {
    where += " AND (temperature IS NULL OR (temperature >= -50 AND temperature <= 60) OR temperature = -999) ";
    where += " AND (humidity IS NULL OR (humidity >= 0 AND humidity <= 100)) ";
  }

  const rows = db
    .prepare(
      `SELECT ts, stationId, temperature, humidity FROM readings
       WHERE ${where}
       ORDER BY ts ASC
       LIMIT ?`
    )
    .all(stationId, from, to, limit);

  res.json(rows);
});

// list known stations
app.get("/api/stations", (_req, res) => {
  const rows = db.prepare(`SELECT stationId, MIN(ts) AS firstTs, MAX(ts) AS lastTs, COUNT(*) AS count
                           FROM readings GROUP BY stationId ORDER BY stationId`).all();
  res.json(rows);
});

app.listen(PORT, () =>
  console.log(`✓ History API listening on http://0.0.0.0:${PORT}`)
);
