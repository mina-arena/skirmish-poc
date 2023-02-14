import { Field, MerkleMap, PrivateKey } from 'snarkyjs';
import { Piece } from '../piece.js';
import { Position } from '../position.js';
import { Unit } from '../unit.js';
import { TurnAction } from '../turnAction.js';
import { Turn } from '../turn.js';
import { GameState } from '../gameState.js';
import { TurnProgram, TurnProof } from '../zk_program/turnProof.js';
import { GameProof, GameProgram } from '../zk_program/gameProof.js';

export const getStartingPiecesMap = () => {
  const pieces = new MerkleMap();

  const pos1 = Position.fromXY(0, 0);
  const pos2 = Position.fromXY(0, 15);
  const pos3 = Position.fromXY(15, 0);
  const pos4 = Position.fromXY(15, 15);
  pieces.set(pos1.merkleKey(), new Piece(pos1, Unit.default()).hash());
  pieces.set(pos2.merkleKey(), new Piece(pos2, Unit.default()).hash());
  pieces.set(pos3.merkleKey(), new Piece(pos3, Unit.default()).hash());
  pieces.set(pos4.merkleKey(), new Piece(pos4, Unit.default()).hash());

  return pieces;
};

export const getPiece = (x: number, y: number) => {
  const pos = Position.fromXY(x, y);
  return new Piece(pos, Unit.default());
};

export const createTurnMove = (
  nonce: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) => {
  const currentPos = Position.fromXY(fromX, fromY);
  const newPos = Position.fromXY(toX, toY);
  const piece = new Piece(currentPos, Unit.default());

  return new TurnAction(Field(nonce), Field(0), newPos.hash(), piece.hash());
};

export const applyTurnMove = async (
  p0: TurnProof,
  turn: Turn,
  action: TurnAction,
  game: GameState,
  piecesMap: MerkleMap,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  playerKey: PrivateKey
): Promise<TurnProof> => {
  const startingPiece = getPiece(fromX, fromY);
  const pos = Position.fromXY(fromX, fromY);
  const newPos = Position.fromXY(toX, toY);
  const turn_ = turn.applyMoveAction(
    action,
    action.sign(playerKey),
    startingPiece,
    game,
    piecesMap.getWitness(pos.merkleKey()),
    newPos
  );
  console.log('Turn', turn.toJSON());
  console.log('Turn_', turn_.toJSON());
  const p1 = await TurnProgram.applyMove(
    turn_,
    p0,
    action,
    action.sign(playerKey),
    startingPiece,
    game,
    piecesMap.getWitness(pos.merkleKey()),
    newPos
  );
  turn = turn.applyMoveAction(
    action,
    action.sign(playerKey),
    startingPiece,
    game,
    piecesMap.getWitness(pos.merkleKey()),
    newPos
  );
  // todo: this is breaking since the `key` of the map is position, position is not allowed to change
  // need to use something else for unit id
  game.piecesRoot = turn.currentGameState;
  return p1;
};

export const applyTurnToGame = async (
  g0: GameProof,
  t0: TurnProof,
  game: GameState
): Promise<GameProof> => {
  const newPlayerTurn = game.playerTurn.equals(Field(0)).toBoolean()
    ? Field(1)
    : Field(0);
  const game_ = new GameState({
    piecesRoot: t0.publicInput.currentGameState,
    playerTurn: newPlayerTurn,
    player1: game.player1,
    player2: game.player2,
    arenaLength: game.arenaLength,
    arenaWidth: game.arenaWidth,
    turnsCompleted: game.turnsCompleted.add(1),
  });
  let p1: GameProof;
  if (newPlayerTurn.equals(Field(0)).toBoolean()) {
    p1 = await GameProgram.p2Turn(game_, g0, t0);
  } else {
    p1 = await GameProgram.p1Turn(game_, g0, t0);
  }
  game.piecesRoot = game_.piecesRoot;
  game.playerTurn = game_.playerTurn;
  game.turnsCompleted = game_.turnsCompleted;
  return p1;
};
