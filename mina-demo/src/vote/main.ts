import { Bool, MerkleTree, Poseidon, PrivateKey, Proof } from 'o1js';
import { MerkleWitness20, Vote, VoteState } from './Vote.js';



// 构建成员数
const memberTree = new MerkleTree(20);
const members = [PrivateKey.random(), PrivateKey.random(), PrivateKey.random()];
members.forEach((m, i) => memberTree.setLeaf(BigInt(i), Poseidon.hash(m.toPublicKey().toFields())));

const vote = async (index: number, result: boolean, lastState: VoteState, lastProof: Proof<VoteState, void>) => {
  const member = members[index];
  const memberWitness = new MerkleWitness20(memberTree.getWitness(BigInt(index)));
  const nextState = VoteState.create(lastState, Bool(result), member.toPublicKey(), memberWitness);
  const { proof } = await Vote.vote(nextState, lastProof, Bool(result), member.toPublicKey(), memberWitness);
  return { state: nextState, proof };
};

console.log('compiling...');
await Vote.compile();

// 初始化投票状态
let state = VoteState.init(memberTree.getRoot());
let { proof } = await Vote.init(state);

console.log('>>>>> vote start <<<<<');
for (let i = 0; i < members.length; i++) {
  console.log(`Vote times: ${i}`);
  const res = await vote(i, i % 2 === 0, state, proof);
  state = res.state;
  proof = res.proof;
}
console.log('>>>>> vote over <<<<<');

console.log(proof.publicInput.agree.toString(), proof.publicInput.reject.toString());
const ok = await Vote.verify(proof);
console.log('ok', ok);
