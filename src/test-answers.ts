import {connect as ampqConnect, Connection, Channel} from 'amqplib';
import {v4 as uuid} from 'uuid';
import * as dotenv from 'dotenv';
dotenv.config();

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
      process.env.RABBITMQ_REQUEST_QUEUE || 'rtest'
    );
  }
  return responseChannel;
}

async function sendRequest(message: Object): Promise<void> {
  console.log('Send:');
  console.log(message);
  (await getRequestChnnel()).sendToQueue(
    process.env.RABBITMQ_RESPONSE_QUEUE || '',
    Buffer.from(JSON.stringify(message))
  );
}

async function addResponseListener(callback: Function): Promise<void> {
  (await getResponseChnnel()).consume(
    process.env.RABBITMQ_REQUEST_QUEUE || 'rtest',
    message => {
      const data: string = message?.content?.toString() || '';
      try {
        callback(JSON.parse(data));
      } catch {
        return callback(data);
      }
    }
  ),
    {noAck: true};
}

addResponseListener((data: any) => {
  console.log('Receive:');
  console.log(data);
  let result: any;
  switch (data.command) {
    case 'checkApproved':
      result = !!Math.floor(Math.random() * 2);
      break;
    case 'approve':
      result = true;
      break;
    case 'getBalance':
      result = Math.floor(Math.random() * 10);
      break;
    case 'feed':
      result = true;
      break;
    case 'sign':
      result = uuid();
      break;
    case 'send':
      result = true;
      break;
  }

  sendRequest({taskId: data.taskId, result});
});
