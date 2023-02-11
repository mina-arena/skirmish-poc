import { Field, Struct, MerkleMap } from 'snarkyjs';

import { Piece } from './piece';
import { Position } from './position';
import { Unit } from './unit';

export class GameState extends Struct({
  piecesRoot: Field, // root hash of pieces in the arena
  playerTurn: Field,
}) {
  static empty(): GameState {
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
    });
  }
}
