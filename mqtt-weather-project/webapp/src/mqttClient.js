import mqtt from "mqtt";
export const client = mqtt.connect("ws://localhost:9001", {
  clientId: "webapp-" + Math.random().toString(16).slice(2),
  clean: true,
  reconnectPeriod: 2000,
});

client.on("connect", () => console.log("✓ MQTT connected"));
client.on("reconnect", () => console.log("… reconnecting"));
client.on("error", (e) => console.error("MQTT error:", e));

