import { Kafka } from 'kafkajs';
import { config } from 'dotenv';

config();

const clientId = process.env.CLIENT_ID;
const brokers = process.env.BROKERS.split(',').map((broker) => broker.trim());
const topic = process.env.IP_TOPIC;

const kafka = new Kafka({
  clientId,
  brokers,
});
const producer = kafka.producer();

export const sendIp = async (ip, service = 'Empty') => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify({ ip, service }) }],
  });
  await producer.disconnect();
};
