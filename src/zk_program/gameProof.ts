import { SelfProof, Field, Experimental, PublicKey } from 'snarkyjs';

import { TurnProof } from './turnProof.js';
import { GameState } from '../gameState.js';

export const GameProgram = Experimental.ZkProgram({
  publicInput: GameState,

  methods: {
    init: {
      privateInputs: [PublicKey, PublicKey],

      method(publicInput: GameState, player1: PublicKey, player2: PublicKey) {
        const empty = GameState.empty(player1, player2);
        publicInput.piecesRoot.assertEquals(empty.piecesRoot);
        publicInput.playerTurn.assertEquals(empty.playerTurn);
        publicInput.player1.assertEquals(empty.player1);
        publicInput.player2.assertEquals(empty.player2);
        publicInput.arenaLength.assertEquals(empty.arenaLength);
        publicInput.arenaWidth.assertEquals(empty.arenaWidth);
        publicInput.turnsCompleted.assertEquals(empty.turnsCompleted);
      },
    },

    p1Turn: {
      privateInputs: [SelfProof, TurnProof],

      method(
        newState: GameState,
        oldState: SelfProof<GameState>,
        turnProof: TurnProof
      ) {
        /**
         * Assertions about old state and new state
         * - old state is p1 turn, new state is p2 turn
         * - arena is the same size, players are the same players
         */
        oldState.verify();
        const game = oldState.publicInput;

        game.playerTurn.assertEquals(Field(0)); // old state is player 1's turn
        newState.playerTurn.assertEquals(Field(1)); // new state is player 2's turn
        game.player1.assertEquals(newState.player1);
        game.player2.assertEquals(newState.player2);
        game.arenaLength.assertEquals(newState.arenaLength);
        game.arenaWidth.assertEquals(newState.arenaWidth);
        // End assertions about game state

        /**
         * Assertions about the turn
         * - turn starting state is the same as the old game state
         * - turn current state is the same as the new game state
         * - the turn is signed by player 1
         */
        turnProof.verify();
        const turn = turnProof.publicInput;
        turn.startingGameState.assertEquals(game.piecesRoot);
        turn.currentGameState.assertEquals(newState.piecesRoot);
        turn.player.assertEquals(game.player1);
        // End assertions about the turn
      },
    },

    p2Turn: {
      privateInputs: [SelfProof, TurnProof],

      method(
        newState: GameState,
        oldState: SelfProof<GameState>,
        turnProof: TurnProof
      ) {
        /**
         * Assertions about old state and new state
         * - old state is p1 turn, new state is p2 turn
         * - arena is the same size, players are the same players
         */
        oldState.verify();
        const game = oldState.publicInput;

        game.playerTurn.assertEquals(Field(1)); // old state is player 2's turn
        newState.playerTurn.assertEquals(Field(0)); // new state is player 1's turn
        game.player1.assertEquals(newState.player1);
        game.player2.assertEquals(newState.player2);
        game.arenaLength.assertEquals(newState.arenaLength);
        game.arenaWidth.assertEquals(newState.arenaWidth);
        // End assertions about game state

        /**
         * Assertions about the turn
         * - turn starting state is the same as the old game state
         * - turn current state is the same as the new game state
         * - the turn is signed by player 1
         */
        turnProof.verify();
        const turn = turnProof.publicInput;
        turn.startingGameState.assertEquals(game.piecesRoot);
        turn.currentGameState.assertEquals(newState.piecesRoot);
        turn.player.assertEquals(game.player2);
        // End assertions about the turn
      },
    },
  },
});

export let GameProof_ = Experimental.ZkProgram.Proof(GameProgram);
export class GameProof extends GameProof_ {}
