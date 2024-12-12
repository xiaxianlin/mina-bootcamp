import { Field, MerkleMap, MerkleTree, MerkleWitness, Poseidon, PrivateKey } from 'o1js';

class MerkleWitness20 extends MerkleWitness(20) {}

async function main() {
  const votersTree = new MerkleTree(20);
  const nullifierMap = new MerkleMap();

  const voters = new Array(10).fill(null).map(PrivateKey.random);
  voters.forEach((v, i) => votersTree.setLeaf(BigInt(i), Poseidon.hash(v.toPublicKey().toFields())));

  const vote0 = votersTree.getRoot();

  const voterIndex1 = 3;
  const nullifierKey1 = Poseidon.hash(voters[voterIndex1].toFields());
  const privateKey1 = voters[voterIndex1];
  const nullifierWitness1 = nullifierMap.getWitness(nullifierKey1);
  const voterTreeWitness1 = new MerkleWitness20(votersTree.getWitness(BigInt(voterIndex1)));

  const outVoter = PrivateKey.random();

  const voterRoot = voterTreeWitness1.calculateRoot(Poseidon.hash(outVoter.toPublicKey().toFields()));
  voterRoot.assertEquals(vote0);
}

main();
