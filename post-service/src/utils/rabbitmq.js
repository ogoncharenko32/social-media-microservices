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

export async function publishMessage(queue, message) {
  if (!channel) {
    await connectRabbitMQ();
  }

  try {
    await channel.publish(
      EXCHANGE_NAME,
      queue,
      Buffer.from(JSON.stringify(message))
    );
    logger.info("Message published to RabbitMQ", { queue });
  } catch (error) {
    logger.error("Error publishing message to RabbitMQ", error);
  }
}

export default connectRabbitMQ;
