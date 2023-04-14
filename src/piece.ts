import { Field, Struct, Poseidon } from 'snarkyjs';

import { Unit } from './unit.js';
import { Position } from './position.js';
import { UnitCondition } from './unitCondition.js';

export class Piece extends Struct({
  id: Field,
  position: Position,
  baseUnit: Unit,
  condition: UnitCondition,
}) {
  constructor(id: Field, position: Position, baseUnit: Unit) {
    super({
      id,
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
    return new Piece(this.id, this.position, this.baseUnit);
  }
}
