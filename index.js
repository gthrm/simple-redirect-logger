import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { redirect, testKafka } from './utils/redirect.utils.js';
import { logger } from './utils/logger.utils.js';

config();

const port = process.env.PORT || 3344;
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 429,
      message: 'Too many requests from your IP. Please wait 15 Minutes',
    },
  },
});

app.use(limiter);
app.use(express.json());

app.get('/test_kafka/:ip/:service', async (req, res) => testKafka(req, res));

app.get('*/:service', async (req, res) => redirect(req, res));

app.get('*', async (req, res) => redirect(req, res));

app.listen(port, async () => {
  logger.info(`App listening at http://localhost:${port}`);
});
