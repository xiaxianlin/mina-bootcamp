import { AccountUpdate, Bool, Mina, PrivateKey, PublicKey, UInt32, UInt64 } from 'o1js';
import { Crowedfund, MINA } from './Crowedfund';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type LocalBlockchain = UnwrapPromise<ReturnType<typeof Mina.LocalBlockchain>>;

describe('Crowdfunding Local Net', () => {
  let Local: LocalBlockchain,
    deployer: Mina.TestPublicKey,
    pledgee: Mina.TestPublicKey,
    receiver: PrivateKey,
    receiverPubKey: PublicKey,
    zkAppAccount: PrivateKey,
    zkApp: Crowedfund;

  const withdraw = async (amount: UInt64) => {
    const anotherGuyAddr = PrivateKey.random().toPublicKey();
    const tx = await Mina.transaction(receiverPubKey, async () => {
      const acctUpdate = AccountUpdate.createSigned(receiverPubKey);
      acctUpdate.send({ to: anotherGuyAddr, amount });
    });
    await tx.sign([receiver]).send();
  };

  it('Crowdfunding', async () => {
    Local = await Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);
    [deployer, pledgee] = Local.testAccounts;
    receiver = PrivateKey.random();
    receiverPubKey = receiver.toPublicKey();

    zkAppAccount = PrivateKey.random();
    zkApp = new Crowedfund(zkAppAccount.toPublicKey());

    // 部署
    const deployTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(deployer);
      await zkApp.deploy({ goal: UInt64.from(10 * MINA), endAt: UInt32.from(200) });
    });
    await deployTx.prove();
    await deployTx.sign([deployer.key, zkAppAccount]).send();

    // 投资
    const pledgeTx = await Mina.transaction(pledgee, async () => {
      await zkApp.pledge(UInt64.from(10));
    });
    await pledgeTx.prove();
    await pledgeTx.sign([pledgee.key]).send();

    Local.setBlockchainLength(UInt32.from(300));
    // 提取
    console.log('reciver: %s', receiverPubKey.toBase58());
    const claimTx = await Mina.transaction(deployer, async () => {
      AccountUpdate.fundNewAccount(receiverPubKey);
      await zkApp.claim(receiverPubKey);
    });
    await claimTx.prove();
    await claimTx.sign([deployer.key, receiver]).send();

    console.log(`final balance of zkapp: ${zkApp.account.balance.get().div(1e9)} MINA`); // 100MINA

    let privilegedAcctBalance = Mina.getBalance(receiverPubKey);
    console.log('\n------------------------------');
    console.log(`privilegedAcct Balance: ${privilegedAcctBalance.div(1e9).toString()}`);
    console.log('vesting schedule:');
    console.log('  after 50 slots: 释放 20 MINA');
    console.log('  after 150 slots: 释放 10 MINA');
    console.log('  after 250 slots: 释放 10 MINA');
    console.log('    ...        ');
    console.log('------------------------------\n');
  });
});
