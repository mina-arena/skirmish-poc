import {
  Field,
  Struct,
  Poseidon,
} from 'snarkyjs';

export class UnitStats extends Struct({
  atk: Field,
  def: Field,
  health: Field,
  range: Field,
  movement: Field,
}) {
  hash(): Field {
    return Poseidon.hash([
      this.atk,
      this.def,
      this.health,
      this.range,
      this.movement,
    ]);
  }
}
