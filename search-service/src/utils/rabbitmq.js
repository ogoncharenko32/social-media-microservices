import amqp from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "post-exchange";

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ", error);
  }
}

export async function consumeEvent(queue, callback) {
  if (!channel) {
    await connectRabbitMQ();
  }

  const q = await channel.assertQueue(queue, { durable: true });

  await channel.bindQueue(q.queue, EXCHANGE_NAME, queue);

  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      console.log(msg);
      const content = JSON.parse(msg.content.toString());
      console.log(content);
      callback(content);
      channel.ack(msg);
    }
  });
  logger.info("Consuming events from RabbitMQ", { queue });
}

export default connectRabbitMQ;
