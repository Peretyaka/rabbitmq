import {sendRequest, addResponseListener} from './rabbitmq';
import {v4 as uuid} from 'uuid';

interface TasksArray {
  [key: string]: Function;
}
const tasks: TasksArray = {};
async function addTaskListener(taskId: string, callback: Function) {
  await initResponseListener();
  tasks[taskId] = callback;
}

let isResponseListenerInitialised = false;
interface ReceivedData {
  taskId: string;
  result: any;
}
async function initResponseListener() {
  if (isResponseListenerInitialised) {
    return;
  }

  await addResponseListener((data: ReceivedData) => {
    console.log('Receive:');
    console.log(data);
    const taskId = data.taskId;
    tasks[taskId](data.result);
    delete tasks[taskId];
  });

  isResponseListenerInitialised = true;
}

function execute(command: string, payload: any): Promise<any> {
  const taskId: string = uuid();
  return new Promise(resolve => {
    addTaskListener(taskId, (result: any) => {
      resolve(result);
    }).then(() => {
      console.log('Send:');
      console.log({
        command,
        taskId,
        payload,
      });
      sendRequest({
        command,
        taskId,
        payload,
      });
    });
  });
}

export async function checkApproved(code: string): Promise<boolean> {
  return !!(await execute('checkApproved', code));
}

export async function approve(code: string): Promise<boolean> {
  return !!(await execute('approve', code));
}

export async function getBalance(address: string): Promise<number> {
  return parseInt(await execute('getBalance', address));
}

export async function feed(address: string, balance: number): Promise<boolean> {
  return !!(await execute('feed', balance));
}

export async function sign(): Promise<string> {
  return await execute('sign', '');
}

export async function send(
  code: string,
  address: string,
  signature: string
): Promise<boolean> {
  return !!(await execute('send', {address, signature}));
}
