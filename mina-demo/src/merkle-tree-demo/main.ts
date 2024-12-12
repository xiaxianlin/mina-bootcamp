import { AccountUpdate, Field, MerkleTree, MerkleWitness, Mina, PrivateKey } from 'o1js';
import { MerkleTreeDemo, MerkleWitness20 } from './MerkleTreeDemo.js';

const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);
const [deployer, sender] = Local.testAccounts;

const app = PrivateKey.random();
const demo = new MerkleTreeDemo(app.toPublicKey());
await MerkleTreeDemo.compile();

const tree = new MerkleTree(20);

const deployTx = await Mina.transaction(deployer, async () => {
  AccountUpdate.fundNewAccount(deployer);
  await demo.deploy();
  await demo.initState(tree.getRoot());
});
await deployTx.prove();
deployTx.sign([deployer.key, app]);

const pendingDeployTx = await deployTx.send();

await pendingDeployTx.wait();

const incrementIndex = 522n;
const incrementAmount = Field(9);

const witness = new MerkleWitness20(tree.getWitness(incrementIndex));
tree.setLeaf(incrementIndex, incrementAmount);

const tx1 = await Mina.transaction(sender, async () => {
  await demo.update(witness, Field(0), incrementAmount);
});
await tx1.prove();
const pendingTx = await tx1.sign([sender.key, app]).send();
await pendingTx.wait();

console.log(`MerkleTreeDemo: local tree root hash after send1: ${tree.getRoot()}`);
console.log(`MerkleTreeDemo: smart contract root hash after send1: ${demo.treeRoot.get()}`);
