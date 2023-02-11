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

import { GameState } from './gameState';
import { Piece } from './piece';
import { Position } from './position';
import { TurnAction } from './turnAction';

export class Turn extends Struct({
  actionsNonce: Field, // nonce of actions processed so far
  startingGameState: Field, // game state before this turn
  currentGameState: Field, // game state after the actions applied in this turn
  player: PublicKey, // the player this turn is for
}) {
  constructor(startingGameState: Field, player: PublicKey) {
    super({
      actionsNonce: Field(0),
      startingGameState,
      currentGameState: startingGameState,
      player,
    });
  }

  applyMoveAction(
    action: TurnAction,
    actionSignature: Signature,
    piece: Piece,
    gameState: GameState,
    pieceWitness: MerkleMapWitness,
    newPosition: Position
  ): void {
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

    piece.position = newPosition;
    [root, key] = pieceWitness.computeRootAndKey(piece.hash());

    // Update the turn so that future actions can be applied
    this.currentGameState = root;
    this.actionsNonce = action.nonce;
  }

  applyAttackAction(
    action: TurnAction,
    actionSignature: Signature,
    piece: Piece,
    gameState: GameState,
    pieceWitness: MerkleMapWitness,
    otherPieceWitness: MerkleMapWitness,
    otherPiece: Piece
  ): void {
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

    // Update the turn so that future actions can be applied
    this.currentGameState = root;
    this.actionsNonce = action.nonce;
  }
}
