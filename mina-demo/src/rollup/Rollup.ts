import {
  Field,
  MerkleMapWitness,
  SmartContract,
  State,
  state,
  Struct,
  Permissions,
  method,
  ZkProgram,
  SelfProof,
  UInt64,
} from 'o1js';

export class RollupState extends Struct({ initialRoot: Field, latestRoot: Field }) {
  static createOneStep(
    initialRoot: Field,
    latestRoot: Field,
    key: Field,
    currentValue: Field,
    incrementAmount: Field,
    merkleMapWitness: MerkleMapWitness
  ) {
    const [witnessRootBefore, witnessKey] = merkleMapWitness.computeRootAndKey(currentValue);
    initialRoot.assertEquals(witnessRootBefore);
    witnessKey.assertEquals(key);

    const [witnessRootAfter] = merkleMapWitness.computeRootAndKey(currentValue.add(incrementAmount));
    latestRoot.assertEquals(witnessRootAfter);

    return new RollupState({
      initialRoot,
      latestRoot,
    });
  }

  static createMerged(state1: RollupState, state2: RollupState) {
    return new RollupState({
      initialRoot: state1.initialRoot,
      latestRoot: state2.latestRoot,
    });
  }

  static assertEquals(state1: RollupState, state2: RollupState) {
    state1.initialRoot.assertEquals(state2.initialRoot);
    state1.latestRoot.assertEquals(state2.latestRoot);
  }
}
const beforeGenesis = UInt64.from(Date.now());
export const Rollup = ZkProgram({
  name: 'rollup-demo',
  publicInput: RollupState,

  methods: {
    oneStep: {
      privateInputs: [Field, Field, Field, Field, Field, MerkleMapWitness],

      async method(
        state: RollupState,
        initialRoot: Field,
        latestRoot: Field,
        key: Field,
        currentValue: Field,
        incrementAmount: Field,
        merkleMapWitness: MerkleMapWitness
      ) {
        const computedState = RollupState.createOneStep(
          initialRoot,
          latestRoot,
          key,
          currentValue,
          incrementAmount,
          merkleMapWitness
        );
        RollupState.assertEquals(computedState, state);
      },
    },
    merge: {
      privateInputs: [SelfProof, SelfProof],

      async method(
        newState: RollupState,
        rollup1proof: SelfProof<RollupState, void>,
        rollup2proof: SelfProof<RollupState, void>
      ) {
        rollup1proof.verify();
        rollup2proof.verify();

        rollup2proof.publicInput.initialRoot.assertEquals(rollup1proof.publicInput.latestRoot);
        rollup1proof.publicInput.initialRoot.assertEquals(newState.initialRoot);
        rollup2proof.publicInput.latestRoot.assertEquals(newState.latestRoot);
      },
    },
  },
});

export class RollupProof extends ZkProgram.Proof(Rollup) {}

export class RollupContract extends SmartContract {
  @state(Field)
  state = State<Field>();

  init() {
    super.init();
    this.account.permissions.set({ ...Permissions.default(), editState: Permissions.proofOrSignature() });
  }

  @method
  async initStateRoot(stateRoot: Field) {
    this.state.set(stateRoot);
  }

  @method
  async update(rollupStateProof: RollupProof) {
    const currentState = this.state.get();
    this.state.requireEquals(currentState);

    rollupStateProof.publicInput.initialRoot.assertEquals(currentState);

    rollupStateProof.verify();

    this.state.set(rollupStateProof.publicInput.latestRoot);

    this.network.timestamp.requireBetween(beforeGenesis, UInt64.MAXINT());
  }
}
