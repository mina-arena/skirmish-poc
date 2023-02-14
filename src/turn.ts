/**
 * has one game state
 * has many turnActions
 */

import {
  Field,
  Struct,
  Signature,
  PublicKey,
  MerkleMapWitness,
} from 'snarkyjs';

import { GameState } from './gameState.js';
import { Piece } from './piece.js';
import { Position } from './position.js';
import { TurnAction } from './turnAction.js';

export class Turn extends Struct({
  actionsNonce: Field, // nonce of actions processed so far
  startingGameState: Field, // game state before this turn
  currentGameState: Field, // game state after the actions applied in this turn
  player: PublicKey, // the player this turn is for
}) {
  constructor(
    actionsNonce: Field,
    startingGameState: Field,
    currentGameState: Field,
    player: PublicKey
  ) {
    super({
      actionsNonce,
      startingGameState,
      currentGameState,
      player,
    });
  }

  static init(startingGameState: Field, player: PublicKey): Turn {
    return new Turn(Field(0), startingGameState, startingGameState, player);
  }

  applyMoveAction(
    action: TurnAction,
    actionSignature: Signature,
    piece: Piece,
    gameState: GameState,
    pieceWitness: MerkleMapWitness,
    newPosition: Position
  ): Turn {
    const v = actionSignature.verify(this.player, action.signatureArguments());
    v.assertTrue();
    action.nonce.assertGt(this.actionsNonce);
    action.actionType.assertEquals(Field(0)); // action is a "move" action
    action.actionParams.assertEquals(newPosition.hash());

    let [root, key] = pieceWitness.computeRootAndKey(piece.hash());
    root.assertEquals(gameState.piecesRoot);
    root.assertEquals(this.currentGameState);
    key.assertEquals(piece.position.merkleKey());

    // TODO: verify move is valid

    const endingPiece = piece.clone();
    endingPiece.position = newPosition;
    [root, key] = pieceWitness.computeRootAndKey(endingPiece.hash());

    return new Turn(action.nonce, this.startingGameState, root, this.player);
  }

  applyAttackAction(
    action: TurnAction,
    actionSignature: Signature,
    piece: Piece,
    gameState: GameState,
    pieceWitness: MerkleMapWitness,
    otherPieceWitness: MerkleMapWitness,
    otherPiece: Piece
  ): Turn {
    const v = actionSignature.verify(this.player, action.signatureArguments());
    v.assertTrue();
    action.nonce.assertGt(this.actionsNonce);
    action.actionType.assertEquals(Field(1)); // action is an "attack" action
    action.actionParams.assertEquals(otherPiece.hash());

    let [root, key] = pieceWitness.computeRootAndKey(piece.hash());
    root.assertEquals(gameState.piecesRoot);
    root.assertEquals(this.currentGameState);
    key.assertEquals(piece.position.merkleKey());

    [root, key] = otherPieceWitness.computeRootAndKey(otherPiece.hash());
    root.assertEquals(this.currentGameState);
    key.assertEquals(otherPiece.position.merkleKey());

    // TODO: verify attack is valid
    // - Unit is within range
    // - Other checks?

    otherPiece.condition.health = otherPiece.condition.health.sub(1);

    [root, key] = otherPieceWitness.computeRootAndKey(otherPiece.hash());

    return new Turn(action.nonce, this.startingGameState, root, this.player);
  }

  toJSON() {
    return {
      actionsNonce: this.actionsNonce.toString(),
      startingGameState: this.startingGameState.toString(),
      currentGameState: this.currentGameState.toString(),
      player: this.player.toBase58(),
    };
  }
}
