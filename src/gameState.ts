import { Field, Struct, MerkleMap, PublicKey, UInt32 } from 'snarkyjs';

import { Piece } from './piece.js';
import { Position } from './position.js';
import { Unit } from './unit.js';

export class GameState extends Struct({
  piecesRoot: Field, // root hash of pieces in the arena keyed by their position
  playerTurn: Field,
  player1: PublicKey,
  player2: PublicKey,
  arenaLength: UInt32,
  arenaWidth: UInt32,
  turnsCompleted: UInt32,
}) {
  static empty(player1: PublicKey, player2: PublicKey): GameState {
    const pieces = new MerkleMap();

    const pos1 = Position.fromXY(0, 0);
    const pos2 = Position.fromXY(0, 15);
    const pos3 = Position.fromXY(15, 0);
    const pos4 = Position.fromXY(15, 15);
    pieces.set(pos1.merkleKey(), new Piece(pos1, Unit.default()).hash());
    pieces.set(pos2.merkleKey(), new Piece(pos2, Unit.default()).hash());
    pieces.set(pos3.merkleKey(), new Piece(pos3, Unit.default()).hash());
    pieces.set(pos4.merkleKey(), new Piece(pos4, Unit.default()).hash());

    return new GameState({
      piecesRoot: pieces.getRoot(),
      playerTurn: Field(0),
      player1,
      player2,
      arenaLength: UInt32.from(16),
      arenaWidth: UInt32.from(16),
      turnsCompleted: UInt32.from(0),
    });
  }
}
