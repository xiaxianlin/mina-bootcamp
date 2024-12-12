import { AccountUpdate, Field, Mina, PrivateKey } from 'o1js';
import { IncrementSecret } from './IncrementSecret.js';

const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);
const [deployer, sender] = Local.testAccounts;

const app = PrivateKey.random();
const instance = new IncrementSecret(app.toPublicKey());
const salt = Field.random();

console.log('start deploy');
console.time('>>> [Deploy] <<<');
const deployTx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await instance.deploy();
  await instance.initState(salt, Field(750));
});
await deployTx.prove();
await deployTx.sign([deployer.key, app]).send();

const num0 = instance.x.get();
console.log('state after init:', num0.toString());
console.timeEnd('>>> [Deploy] <<<');

console.log('start tx1');
console.time('>>> [tx1] <<<');
const tx1 = await Mina.transaction(sender, async () => {
  await instance.incrementSecret(salt, Field(750));
});
await tx1.prove();
await tx1.sign([sender.key]).send();

const num1 = instance.x.get();
console.log('state after tx1:', num1.toString());
console.timeEnd('>>> [tx1] <<<');
