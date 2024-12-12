import { AccountUpdate, Mina } from 'o1js';
import { Crowedfund, MINA } from './Crowedfund';

let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

await Crowedfund.compile();

let [sender, payout] = Local.testAccounts;

let zkappAccount = Mina.TestPublicKey.random();
let zkapp = new Crowedfund(zkappAccount);

console.log('deploy...');
let tx = await Mina.transaction(sender, async () => {
  AccountUpdate.fundNewAccount(sender);
});
// await tx.prove();
await tx.sign([sender.key, zkappAccount.key]).send();

console.log(`initial balance: ${zkapp.account.balance.get().div(1e9)} MINA`);
