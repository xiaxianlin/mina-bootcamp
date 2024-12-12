import { Field, MerkleMap, Proof, verify } from 'o1js';
import { Rollup, RollupState } from './Rollup.js';

console.log('compiling...');

const { verificationKey } = await Rollup.compile();

console.log('generating transition information');

const transitions = [
  { key: Field(8), increment: Field(3) },
  { key: Field(43), increment: Field(2) },
  { key: Field(6), increment: Field(3999) },
  { key: Field(8), increment: Field(400) },
];

let map = new MerkleMap();

const rollupStepInfo: any[] = [];

transitions.forEach(({ key, increment }) => {
  const witness = map.getWitness(key);
  const initialRoot = map.getRoot();

  const currentValue = map.get(key);
  const updatedValue = currentValue.add(increment);

  map.set(key, updatedValue);
  const latestRoot = map.getRoot();

  rollupStepInfo.push({
    initialRoot,
    latestRoot,
    key,
    currentValue,
    increment,
    witness,
  });
});

console.log('making first set of proofs');

const rollupProofs: Proof<RollupState, void>[] = [];
for (let { initialRoot, latestRoot, key, currentValue, increment, witness } of rollupStepInfo) {
  const rollup = RollupState.createOneStep(initialRoot, latestRoot, key, currentValue, increment, witness);
  const { proof } = await Rollup.oneStep(rollup, initialRoot, latestRoot, key, currentValue, increment, witness);
  rollupProofs.push(proof);
}

console.log('merging proofs');

var proof: Proof<RollupState, void> = rollupProofs[0];
for (let i = 1; i < rollupProofs.length; i++) {
  const rollup = RollupState.createMerged(proof.publicInput, rollupProofs[i].publicInput);
  let { proof: mergedProof } = await Rollup.merge(rollup, proof, rollupProofs[i]);
  proof = mergedProof;
}

console.log('verifying rollup');
console.log(proof.publicInput.latestRoot.toString());

const ok = await verify(proof.toJSON(), verificationKey);
console.log('ok', ok);
