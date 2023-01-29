import {
  SelfProof,
  Field,
  Experimental,
  isReady,
  Struct,
  UInt32,
  MerkleTree,
  Poseidon,
  shutdown,
  Circuit,
} from 'snarkyjs';

await isReady;

class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  hash(): Field {
    return Poseidon.hash(this.x.toFields().concat(this.y.toFields()));
  }

  merkleIndex(): BigInt {
    return this.x.mul(8).add(this.y).toBigint();
  }

  // simple distance calc, just x + y, not using sqrt
  distance(other: Position): UInt32 {
    const x = Circuit.if(
      this.x.gte(other.x),
      (() => this.x.sub(other.x))(),
      (() => other.x.sub(this.x))()
    );
    const y = Circuit.if(
      this.y.gte(other.y),
      (() => this.y.sub(other.y))(),
      (() => other.y.sub(this.y))()
    );

    return x.add(y);
  }
}

class Stats extends Struct({
  atk: Field,
  def: Field,
  health: Field,
  range: Field,
  movement: Field,
}) {
  hash(): Field {
    return Poseidon.hash([
      this.atk,
      this.def,
      this.health,
      this.range,
      this.movement,
    ]);
  }
}

class Unit extends Struct({
  position: Position,
  stats: Stats,
}) {
  static default(x: number, y: number): Unit {
    return new Unit({
      position: new Position({
        x: UInt32.from(x),
        y: UInt32.from(y),
      }),
      stats: new Stats({
        atk: Field(2),
        def: Field(1),
        health: Field(3),
        range: Field(1),
        movement: Field(3),
      }),
    });
  }

  hash(): Field {
    return Poseidon.hash([this.position.hash(), this.stats.hash()]);
  }
}

// 4 units, 16x16 arena
class ArenaPublicState extends Struct({
  unitsRootHash: Field, // each unit in the arena
  mapRootHash: Field, // each position in the arena
  playerTurn: Field,
}) {
  static empty(): ArenaPublicState {
    const units = new MerkleTree(3);
    const map = new MerkleTree(9);

    units.setLeaf(0n, Unit.default(0, 0).hash());
    units.setLeaf(1n, Unit.default(0, 4).hash());
    units.setLeaf(2n, Unit.default(15, 11).hash());
    units.setLeaf(3n, Unit.default(15, 15).hash());

    return new ArenaPublicState({
      unitsRootHash: units.getRoot(),
      mapRootHash: map.getRoot(),
      playerTurn: Field(0),
    });
  }
}

class PlayerMoveset extends Struct({
  moves: Circuit.array(Unit, 2),
}) {}

export let Arena2v2 = Experimental.ZkProgram({
  publicInput: ArenaPublicState,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: ArenaPublicState) {
        const empty = ArenaPublicState.empty();
        publicInput.unitsRootHash.assertEquals(empty.unitsRootHash);
        publicInput.mapRootHash.assertEquals(empty.mapRootHash);
      },
    },

    p1Move: {
      privateInputs: [SelfProof, PlayerMoveset, Field],

      method(
        newState: ArenaPublicState,
        oldState: SelfProof<ArenaPublicState>,
        moveset: PlayerMoveset,
        otherPlayerMerkleRoot: Field
      ) {
        oldState.verify();
        oldState.publicInput.playerTurn.assertEquals(Field(0));
        newState.playerTurn.assertEquals(Field(1));
        // merkle tree of height one less than the game state
        // the other half the tree is the other player's state
        const playerState = new MerkleTree(2);
        for (let i = 0; i < moveset.moves.length; i++) {
          const move = moveset.moves[i];
          playerState.setLeaf(BigInt(i), move.hash());
          // TODO: prove that the new position is valid (unoccupied, within the bounds of the game, within the movement of the unit, etc...)
        }
        newState.unitsRootHash.assertEquals(
          Poseidon.hash([playerState.getRoot(), otherPlayerMerkleRoot])
        );
      },
    },

    p2Move: {
      privateInputs: [SelfProof, PlayerMoveset, Field],

      method(
        newState: ArenaPublicState,
        oldState: SelfProof<ArenaPublicState>,
        moveset: PlayerMoveset,
        otherPlayerMerkleRoot: Field
      ) {
        oldState.verify();
        oldState.publicInput.playerTurn.assertEquals(Field(1));
        newState.playerTurn.assertEquals(Field(0));
        // merkle tree of height one less than the game state
        // the other half the tree is the other player's state
        const playerState = new MerkleTree(2);
        for (let i = 0; i < moveset.moves.length; i++) {
          const move = moveset.moves[i];
          playerState.setLeaf(BigInt(i), move.hash());
          // TODO: prove that the new position is valid (unoccupied, within the bounds of the game, within the movement of the unit, etc...)
        }
        newState.unitsRootHash.assertEquals(
          Poseidon.hash([otherPlayerMerkleRoot, playerState.getRoot()])
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
  await Arena2v2.compile();
  console.timeEnd();

  console.log('making proof 0');
  console.time();
  const proof0 = await Arena2v2.init(ArenaPublicState.empty());
  console.timeEnd();

  console.log('making proof 1');
  console.time();
  const units = new MerkleTree(3);
  units.setLeaf(0n, Unit.default(2, 2).hash());
  units.setLeaf(1n, Unit.default(2, 6).hash());
  units.setLeaf(2n, Unit.default(15, 11).hash());
  units.setLeaf(3n, Unit.default(15, 15).hash());

  const state1 = ArenaPublicState.empty();
  state1.unitsRootHash = units.getRoot();
  state1.playerTurn = Field(1);

  let moveset = new PlayerMoveset({
    moves: [Unit.default(2, 2), Unit.default(2, 6)],
  });

  const proof1 = await Arena2v2.p1Move(
    state1,
    proof0,
    moveset,
    units.getNode(1, 1n)
  );
  console.timeEnd();

  console.log('making proof 2');
  console.time();
  units.setLeaf(2n, Unit.default(13, 10).hash());
  units.setLeaf(3n, Unit.default(12, 15).hash());
  const state2 = new ArenaPublicState({
    unitsRootHash: units.getRoot(),
    mapRootHash: state1.mapRootHash,
    playerTurn: Field(0),
  });

  moveset = new PlayerMoveset({
    moves: [Unit.default(13, 10), Unit.default(12, 15)],
  });

  const proof2 = await Arena2v2.p2Move(
    state2,
    proof1,
    moveset,
    units.getNode(1, 0n)
  );
  console.timeEnd();

  const ok = await Arena2v2.verify(proof2);
  console.log('ok', ok);

  console.log('Shutting down');

  await shutdown();
}

await main();
