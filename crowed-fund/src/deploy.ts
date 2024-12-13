import { AccountUpdate, Mina, PrivateKey, UInt32, UInt64 } from 'o1js';
import { Crowedfund, MINA } from './Crowedfund.js';

const network = Mina.Network({
  mina: 'https://api.minascan.io/node/devnet/v1/graphql/',
  archive: 'https://api.minascan.io/archive/devnet/v1/graphql/',
});
Mina.setActiveInstance(network);

const senderKey = PrivateKey.fromBase58('EKEzQHnG8nLFA3mkvtqB8pzqhELFFyG66N8KTFuuvihd6Ttaq8WS');
const sender = senderKey.toPublicKey();

// 编译合约
console.log('compile');
await Crowedfund.compile();

let zkappKey = PrivateKey.random();
let zkappAccount = zkappKey.toPublicKey();
let zkapp = new Crowedfund(zkappAccount);

console.log('deploy...');
let tx = await Mina.transaction(
  {
    sender,
    fee: 0.2 * 10e9,
    memo: 'task4',
  },
  async () => {
    AccountUpdate.fundNewAccount(sender);
    await zkapp.deploy({ goal: UInt64.from(100 * MINA), endAt: UInt32.from(200) });
  }
);
await tx.prove();
const signedTx = await tx.sign([senderKey, zkappKey]).send().wait();

console.log('tx hash:', signedTx.hash);
