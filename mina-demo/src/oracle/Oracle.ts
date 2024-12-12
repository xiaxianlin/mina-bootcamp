import { Field, method, PublicKey, Signature, SmartContract, state, State } from 'o1js';

const ORACLE_PUBLIC_KEY = 'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

export class Oracle extends SmartContract {
  @state(PublicKey)
  oraclePublicKey = State<PublicKey>();

  events = { verified: Field };

  init(): void {
    super.init();
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    this.requireSignature();
  }

  @method
  async verify(id: Field, creditScore: Field, signature: Signature) {
    const oraclePublicKey = this.oraclePublicKey.getAndRequireEquals();
    const validSignature = signature.verify(oraclePublicKey, [id, creditScore]);
    validSignature.assertTrue();
    creditScore.assertGreaterThanOrEqual(Field(700));
    this.emitEvent('verified', id);
  }
}
