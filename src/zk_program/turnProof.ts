import {
  SelfProof,
  Experimental,
  PublicKey,
  Signature,
  MerkleMapWitness,
} from 'snarkyjs';

import { GameState } from '../gameState.js';
import { Piece } from '../piece.js';
import { Position } from '../position.js';
import { Turn } from '../turn.js';
import { TurnAction } from '../turnAction.js';

export const TurnProgram = Experimental.ZkProgram({
  publicInput: Turn,

  methods: {
    init: {
      privateInputs: [GameState, PublicKey],

      method(
        publicInput: Turn,
        initialGameState: GameState,
        player: PublicKey
      ) {
        const turn = Turn.init(initialGameState.piecesRoot, player);
        publicInput.actionsNonce.assertEquals(turn.actionsNonce);
        publicInput.startingGameState.assertEquals(turn.startingGameState);
        publicInput.currentGameState.assertEquals(turn.currentGameState);
        publicInput.player.assertEquals(turn.player);
      },
    },

    applyMove: {
      privateInputs: [
        SelfProof,
        TurnAction,
        Signature,
        Piece,
        GameState,
        MerkleMapWitness,
        Position,
      ],

      method(
        newState: Turn,
        oldState: SelfProof<Turn>,
        action: TurnAction,
        actionSignature: Signature,
        piece: Piece,
        gameState: GameState,
        pieceWitness: MerkleMapWitness,
        newPosition: Position
      ) {
        oldState.verify();
        const turn = oldState.publicInput;
        newState.actionsNonce.assertGt(turn.actionsNonce);
        newState.startingGameState.assertEquals(turn.startingGameState);
        newState.player.assertEquals(turn.player);
        const turn_ = turn.applyMoveAction(
          action,
          actionSignature,
          piece,
          gameState,
          pieceWitness,
          newPosition
        );
        newState.currentGameState.assertEquals(turn_.currentGameState);
      },
    },
  },
});

export let TurnProof_ = Experimental.ZkProgram.Proof(TurnProgram);
export class TurnProof extends TurnProof_ {}
