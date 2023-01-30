import {
  SelfProof,
  Field,
  Experimental,
  isReady,
  Struct,
  UInt32,
  MerkleWitness,
  MerkleTree,
  Poseidon,
  verify,
  shutdown,
} from 'snarkyjs';

await isReady;

class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  hash(): Field {
    return Poseidon.hash(this.x.toFields().concat(this.y.toFields()));
  }
}

class ArenaPublicState extends Struct({
  unitsRootHash: Field,
  numUnits: UInt32,
}) {}

class UnitPositionsWitness extends MerkleWitness(3) {}

const initialState2v2Arena = new MerkleTree(3);
initialState2v2Arena.setLeaf(
  0n,
  new Position({ x: UInt32.from(0), y: UInt32.from(0) }).hash()
);
initialState2v2Arena.setLeaf(
  1n,
  new Position({ x: UInt32.from(0), y: UInt32.from(10) }).hash()
);
initialState2v2Arena.setLeaf(
  2n,
  new Position({ x: UInt32.from(10), y: UInt32.from(0) }).hash()
);
initialState2v2Arena.setLeaf(
  3n,
  new Position({ x: UInt32.from(10), y: UInt32.from(10) }).hash()
);

const distance = (a: Position, b: Position) => {
  console.log(a, b);
  return UInt32.from(2);
};

export let Arena2v2 = Experimental.ZkProgram({
  publicInput: ArenaPublicState,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: ArenaPublicState) {
        publicInput.numUnits.assertEquals(UInt32.from(4));
        publicInput.unitsRootHash.assertEquals(initialState2v2Arena.getRoot());
      },
    },

    applyTurn: {
      privateInputs: [SelfProof, Position],

      method(
        newState: ArenaPublicState,
        oldState: SelfProof<ArenaPublicState>,
        move1: Position
      ) {
        oldState.verify();
        let newPos = move1;
        const oldPos = new Position({ x: UInt32.from(0), y: UInt32.from(0) });
        const w = initialState2v2Arena.getWitness(0n);
        const unitsWitness = new UnitPositionsWitness(w);
        unitsWitness
          .calculateRoot(oldPos.hash())
          .assertEquals(oldState.publicInput.unitsRootHash);
        distance(oldPos, newPos).assertLte(UInt32.from(2));
        newState.numUnits.assertEquals(UInt32.from(4));
        newState.unitsRootHash.assertEquals(
          unitsWitness.calculateRoot(newPos.hash())
        );
      },
    },
  },
});

async function main() {
  await isReady;

  console.log('SnarkyJS loaded');

  console.log('compiling...');

  console.time();
  const { verificationKey } = await Arena2v2.compile();
  console.timeEnd();

  console.log('making proof 0');

  console.time();
  const proof0 = await Arena2v2.init(
    new ArenaPublicState({
      unitsRootHash: initialState2v2Arena.getRoot(),
      numUnits: UInt32.from(4),
    })
  );
  console.timeEnd();

  console.log(
    'proof 0 public input',
    proof0.publicInput.numUnits.toString(),
    proof0.publicInput.unitsRootHash.toString()
  );
  console.log('making proof 1');
  const oldPos = new Position({ x: UInt32.from(0), y: UInt32.from(0) });
  const newPos1 = new Position({ x: UInt32.from(1), y: UInt32.from(3) });
  const w = initialState2v2Arena.getWitness(0n);
  const unitsWitness = new UnitPositionsWitness(w);
  console.log(
    'proof 0 public input',
    proof0.publicInput.numUnits.toString(),
    proof0.publicInput.unitsRootHash.toString()
  );
  console.log(
    'expected hash',
    unitsWitness.calculateRoot(oldPos.hash()).toString()
  );
  console.time();
  const proof1 = await Arena2v2.applyTurn(
    new ArenaPublicState({
      unitsRootHash: unitsWitness.calculateRoot(newPos1.hash()),
      numUnits: UInt32.from(4),
    }),
    proof0,
    newPos1
  );
  console.timeEnd();
  initialState2v2Arena.setLeaf(0n, newPos1.hash());

  console.log(
    'proof 1 public input',
    proof1.publicInput.numUnits.toString(),
    proof1.publicInput.unitsRootHash.toString()
  );
  console.log(
    'expected hash',
    unitsWitness.calculateRoot(newPos1.hash()).toString()
  );
  console.time();
  const ok = await verify(proof1.toJSON(), verificationKey);
  console.timeEnd();
  console.log('ok', ok);

  console.log('Shutting down');

  await shutdown();
}

await main();
