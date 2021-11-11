import express from "express";
import rateLimit from "express-rate-limit";
import bunyan from "bunyan";
import { Low, JSONFile } from "lowdb";

const port = process.env.PORT || 3344;
const app = express();

const log = bunyan.createLogger({
  name: "ips",
  streams: [{ path: process.env.LOG_PATH }],
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
  log.info(ip, req.headers);
  posts.push({ ip, headers: req.headers, date: new Date() });
  try {
    await db.write();
  } catch (error) {
    log.error(error);
  }
  res.redirect(process.env.URL_TO_REDIRECT);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
