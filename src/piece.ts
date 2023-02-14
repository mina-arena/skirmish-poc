import { Field, Struct, Poseidon } from 'snarkyjs';

import { Unit } from './unit.js';
import { Position } from './position.js';
import { UnitCondition } from './unitCondition.js';

export class Piece extends Struct({
  position: Position,
  baseUnit: Unit,
  condition: UnitCondition,
}) {
  constructor(position: Position, baseUnit: Unit) {
    super({
      position,
      baseUnit,
      condition: new UnitCondition(baseUnit.stats),
    });
  }

  hash(): Field {
    return Poseidon.hash([
      this.position.hash(),
      this.baseUnit.hash(),
      this.condition.hash(),
    ]);
  }

  clone(): Piece {
    return new Piece(this.position, this.baseUnit);
  }
}
