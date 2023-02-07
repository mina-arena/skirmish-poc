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

import { GameState } from '../gameState';

export let Game = Experimental.ZkProgram({
  publicInput: GameState,

  methods: {
    init: {
      privateInputs: [],

      method(publicInput: GameState) {
        const empty = GameState.empty();
        publicInput.piecesRoot.assertEquals(empty.piecesRoot);
        publicInput.playerTurn.assertEquals(empty.playerTurn);
      },
    },

    // p1Move: {
    //   privateInputs: [],

    //   method(
    //     newState: ArenaPublicState,
    //     oldState: SelfProof<ArenaPublicState>,
    //     moveset: PlayerMoveset,
    //     otherPlayerMerkleRoot: Field
    //   ) {
    //     oldState.verify();
    //   },
    // },

    // p2Move: {
    //   privateInputs: [],

    //   method(
    //     newState: ArenaPublicState,
    //     oldState: SelfProof<ArenaPublicState>,
    //     moveset: PlayerMoveset,
    //     otherPlayerMerkleRoot: Field
    //   ) {
    //     oldState.verify();
    //   },
    // },
  },
});