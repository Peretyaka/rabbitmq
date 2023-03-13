import * as dotenv from 'dotenv';
dotenv.config();
import * as service from './service';

async function businessCase1(address: string) {
  const isApproved: boolean = await service.checkApproved('123');
  if (!isApproved) {
    await service.approve('123');
  }

  const balance: number = await service.getBalance(address);
  if (balance < 5) {
    await service.feed(address, 5 - balance);
  }

  const signature: string = await service.sign();

  return await service.send('123', address, signature);
}

businessCase1('test');
