import {connect as ampqConnect, Connection, Channel} from 'amqplib';

let connection: Connection;
async function connect(): Promise<Connection> {
  if (!connection) {
    connection = await ampqConnect(
      `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`
    );
  }

  return connection;
}

let requestChannel: Channel;
async function getRequestChnnel(): Promise<Channel> {
  if (!requestChannel) {
    requestChannel = await (await connect()).createChannel();
  }
  return requestChannel;
}

let responseChannel: Channel;
async function getResponseChnnel(): Promise<Channel> {
  if (!responseChannel) {
    responseChannel = await (await connect()).createChannel();
    await responseChannel.assertQueue(
      process.env.RABBITMQ_RESPONSE_QUEUE || 'rtest'
    );
  }
  return responseChannel;
}

export async function sendRequest(message: Object): Promise<void> {
  (await getRequestChnnel()).sendToQueue(
    process.env.RABBITMQ_REQUEST_QUEUE || '',
    Buffer.from(JSON.stringify(message))
  );
}

export async function addResponseListener(callback: Function): Promise<void> {
  (await getResponseChnnel()).consume(
    process.env.RABBITMQ_RESPONSE_QUEUE || 'rtest',
    message => {
      const data: string = message?.content?.toString() || '';
      try {
        callback(JSON.parse(data));
      } catch {
        return callback(data);
      }
    },
    {noAck: true}
  );
}
