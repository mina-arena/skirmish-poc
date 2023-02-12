import { Field, Struct, Poseidon } from 'snarkyjs';

import { UnitStats } from './unitStats.js';

// For now, a unit is just its stats
// In the future, it can also have other metadata
export class Unit extends Struct({
  stats: UnitStats,
}) {
  static default(): Unit {
    return new Unit({
      stats: new UnitStats({
        atk: Field(2),
        def: Field(1),
        health: Field(3),
        range: Field(1),
        movement: Field(3),
      }),
    });
  }

  hash(): Field {
    return Poseidon.hash([this.stats.hash()]);
  }
}
