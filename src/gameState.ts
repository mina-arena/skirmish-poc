import {
  Field,
  Struct,
  MerkleTree,
} from 'snarkyjs';

import { Piece } from './piece';
import { Position } from './position';
import { Unit } from './unit';

export class GameState extends Struct({
  piecesRoot: Field, // root hash of pieces in the arena
  playerTurn: Field,
}) {
  static empty(): GameState {
    const pieces = new MerkleTree(3);

    pieces.setLeaf(0n, new Piece(Position.fromXY(0, 0), Unit.default()).hash());
    pieces.setLeaf(1n, new Piece(Position.fromXY(0, 15), Unit.default()).hash());
    pieces.setLeaf(2n, new Piece(Position.fromXY(15, 0), Unit.default()).hash());
    pieces.setLeaf(3n, new Piece(Position.fromXY(15, 15), Unit.default()).hash());

    return new GameState({
      piecesRoot: pieces.getRoot(),
      playerTurn: Field(0),
    });
  }
}