import { config } from 'dotenv';
import { sendIp } from './kafka.utils.js';
import { logger } from './logger.utils.js';

config();

const urlToRedirect = process.env.URL_TO_REDIRECT;

export async function redirect(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { service } = req.params;
  try {
    logger.info(ip, req.headers);
  } catch (error) {
    logger.error(error);
  }
  res.redirect(urlToRedirect);
  sendIp(ip, service);
}
