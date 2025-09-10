// index.js
import mqtt from "mqtt";
import chalk from "chalk";

const BROKER_URL = "mqtt://localhost:1883";
const TOPIC = "weather";

// Reconnect-Optionen: robust bei Abbrüchen
const client = mqtt.connect(BROKER_URL, {
  reconnectPeriod: 2000,      // alle 2s versuchen
  connectTimeout: 10_000,     // 10s Timeout
  clean: true,                // neue Session ok
  clientId: "weather-client-" + Math.random().toString(16).slice(2),
});

client.on("connect", () => {
  console.log(chalk.green(`✓ Connected to ${BROKER_URL}`));
  client.subscribe(TOPIC, (err) => {
    if (err) console.error(chalk.red("Subscribe error:"), err.message);
    else console.log(chalk.cyan(`… subscribed to '${TOPIC}'`));
  });
});

client.on("reconnect", () => console.log(chalk.yellow("Reconnecting…")));
client.on("close", () => console.log(chalk.gray("Connection closed")));
client.on("error", (e) => console.error(chalk.red("MQTT error:"), e.message));

client.on("message", (topic, payload) => {
  console.log(chalk.gray(`[${topic}]`), payload.toString());
});
