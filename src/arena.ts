
import { SelfProof, Field, Experimental, isReady, Struct, UInt32, MerkleWitness, MerkleTree, Poseidon, verify, shutdown } from 'snarkyjs';

await isReady;

class Position extends Struct({
  x: UInt32,
  y: UInt32
}) {
  hash(): Field {
    return Poseidon.hash(this.x.toFields().concat(this.y.toFields()))
  }
}

class ArenaPublicState extends Struct({
  unitsRootHash: Field,
  numUnits: UInt32
}) { }

class UnitPositionsWitness extends MerkleWitness(3) { }

const initialState2v2Arena = new MerkleTree(3);
initialState2v2Arena.setLeaf(0n, (new Position({ x: UInt32.from(0), y: UInt32.from(0) })).hash())
initialState2v2Arena.setLeaf(1n, (new Position({ x: UInt32.from(0), y: UInt32.from(10) })).hash())
initialState2v2Arena.setLeaf(2n, (new Position({ x: UInt32.from(10), y: UInt32.from(0) })).hash())
initialState2v2Arena.setLeaf(3n, (new Position({ x: UInt32.from(10), y: UInt32.from(10) })).hash())

const distance = (a: Position, b: Position) => {
  return UInt32.from(2);
}

export let Arena2v2 = Experimental.ZkProgram({
  publicInput: ArenaPublicState,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: ArenaPublicState) {
        publicInput.numUnits.assertEquals(UInt32.from(4));
        publicInput.unitsRootHash.assertEquals(initialState2v2Arena.getRoot())
      },
    },

    applyTurn: {
      privateInputs: [SelfProof, Position],

      method(
        newState: ArenaPublicState,
        oldState: SelfProof<ArenaPublicState>,
        move1: Position,
      ) {
        let newPos = move1;
        const oldPos = new Position(new Position({ x: UInt32.from(0), y: UInt32.from(0) }))
        const w = initialState2v2Arena.getWitness(0n);
        const unitsWitness = new UnitPositionsWitness(w);
        unitsWitness.calculateRoot(oldPos.hash()).assertEquals(oldState.publicInput.unitsRootHash);
        distance(oldPos, newPos).assertLte(UInt32.from(2));
        newState.numUnits.assertEquals(UInt32.from(4));
        newState.unitsRootHash.assertEquals(initialState2v2Arena.getRoot())
      }
    }
  },
});

async function main() {
  await isReady;

  console.log('SnarkyJS loaded');

  console.log('compiling...');

  const { verificationKey } = await Arena2v2.compile();

  console.log('making proof 0')

  const initState = new ArenaPublicState({
    unitsRootHash: initialState2v2Arena.getRoot(),
    numUnits: UInt32.from(4)
  })
  const proof0 = await Arena2v2.init(initState);

  // console.log('making proof 1')

  // const proof1 = await Arena2v2.addNumber(Field(4), proof0, Field(4));

  // console.log('making proof 2')

  // const proof2 = await Arena2v2.add(Field(4), proof1, proof0);

  // console.log('verifying proof 2');
  // console.log('proof 2 data', proof2.publicInput.toString());

  const ok = await verify(proof0.toJSON(), verificationKey);
  console.log('ok', ok);

  console.log('Shutting down');

  await shutdown();
}

await main();