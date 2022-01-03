import express from "express";
import rateLimit from "express-rate-limit";
import bunyan from "bunyan";
import { Low, JSONFile } from "lowdb";
import { Kafka } from "kafkajs";
import { config } from "dotenv";
import { resolve, join } from "path";

config();

const clientId = process.env.CLIENT_ID;
const brokers = process.env.BROKERS.split(",").map((broker) => broker.trim());
const topic = process.env.IP_TOPIC;
const urlToRedirect = process.env.URL_TO_REDIRECT;
const port = process.env.PORT || 3344;
const logPath = process.env.LOG_PATH;

const kafka = new Kafka({
  clientId,
  brokers,
});

const producer = kafka.producer();

const app = express();

const log = bunyan.createLogger({
  name: "ips",
  streams: [{ path: join(resolve(), logPath) }],
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 429,
      message: "Too many requests from your IP. Please wait 15 Minutes",
    },
  },
});

const sendIp = async (ip) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify({ ip, service: clientId }) }],
  });
  await producer.disconnect();
};

// Lowdb connect
const adapter = new JSONFile("db.json");
const db = new Low(adapter);
await db.read();
db.data ||= { posts: [] };

const { posts } = db.data;

app.use(limiter);
app.use(express.json());

app.get("*", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  posts.push({ ip, headers: req.headers, date: new Date() });
  try {
    log.info(ip, req.headers);
    await db.write();
  } catch (error) {
    log.error(error);
  }
  res.redirect(urlToRedirect);
  sendIp(ip);
});

app.listen(port, async () => {
  console.log(`App listening at http://localhost:${port}`);
});
