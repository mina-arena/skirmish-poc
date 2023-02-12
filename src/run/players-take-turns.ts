import { isReady, shutdown, PublicKey, PrivateKey, Mina } from 'snarkyjs';
import { GameState } from '../gameState.js';
import { Turn } from '../turn.js';
import { GameProgram } from '../zk_program/gameProof.js';
import { TurnProgram } from '../zk_program/turnProof.js';
import {
  applyTurnMove,
  createTurnMove,
  getStartingPiecesMap,
  applyTurnToGame,
} from './utils.js';

await isReady;

let player1Account: PublicKey,
  player1PrivateKey: PrivateKey,
  player2Account: PublicKey;

const Local = Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);
({ privateKey: player1PrivateKey, publicKey: player1Account } =
  Local.testAccounts[1]);
({ publicKey: player2Account } = Local.testAccounts[2]);

// console.time('Compiling Circuits')
// console.time('Compiling Turn Circuit')
// await TurnProgram.compile();
// console.timeEnd('Compiling Turn Circuit')
// console.time('Compiling Game Circuit')
// await GameProgram.compile();
// console.timeEnd('Compiling Game Circuit')
// console.timeEnd('Compiling Circuits')

const piecesMap = getStartingPiecesMap();
const game = GameState.empty(player1Account, player2Account);
const g0 = await GameProgram.init(
  GameState.empty(player1Account, player2Account),
  player1Account,
  player2Account
);

// player 1's turn
// - move the unit at 0,0 to 2,2 first, then move the piece at 0,15 to 2,15
const p1t1Actions = [
  createTurnMove(1, 0, 0, 2, 2),
  createTurnMove(2, 0, 15, 2, 13),
];

let turn = Turn.init(game.piecesRoot, player1Account);
const p0 = await TurnProgram.init(
  Turn.init(game.piecesRoot, player1Account),
  game,
  player1Account
);

// applyTurnMove should mutate `turn` for us
const p1 = await applyTurnMove(
  p0,
  turn,
  p1t1Actions[0],
  game,
  piecesMap,
  0,
  0,
  2,
  2,
  player1PrivateKey
);
const p2 = await applyTurnMove(
  p1,
  turn,
  p1t1Actions[0],
  game,
  piecesMap,
  0,
  0,
  2,
  2,
  player1PrivateKey
);

// applyTurnToGame should mutate `game` for us
const g1 = await applyTurnToGame(g0, p2, game);

const valid = await GameProgram.verify(g1);
console.log('valid?', valid);

console.log('Shutting down');
await shutdown();
