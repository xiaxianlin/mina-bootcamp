import { Field, MerkleWitness, method, SmartContract, State, state } from 'o1js';

export class MerkleWitness20 extends MerkleWitness(20) {}
export class MerkleTreeDemo extends SmartContract {
  @state(Field) treeRoot = State<Field>();

  @method async initState(initialRoot: Field) {
    this.treeRoot.set(initialRoot);
  }

  @method async update(leafWitness: MerkleWitness20, numberBefore: Field, incrementAmount: Field) {
    const initialRoot = this.treeRoot.getAndRequireEquals();

    incrementAmount.assertLessThan(Field(10));

    const rootBefore = leafWitness.calculateRoot(numberBefore);
    rootBefore.assertEquals(initialRoot);

    const rootAfter = leafWitness.calculateRoot(numberBefore.add(incrementAmount));
    this.treeRoot.set(rootAfter);
  }
}
