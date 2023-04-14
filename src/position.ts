import { Field, Struct, UInt32, Poseidon, Circuit } from 'snarkyjs';

export class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  static fromXY(x: number, y: number): Position {
    return new Position({
      x: UInt32.from(x),
      y: UInt32.from(y),
    });
  }

  hash(): Field {
    return Poseidon.hash(this.x.toFields().concat(this.y.toFields()));
  }

  merkleKey(): Field {
    return Poseidon.hash(this.x.toFields().concat(this.y.toFields()));
  }

  // simple distance calc, just x + y, not using sqrt
  // 5^2 + 7^2 = 74 | sqrt(74) = 8.6....
  // ( 5 + 7 ) * 0.7 = 8.4....
  distance(other: Position): UInt32 {
    const x = Circuit.if(
      this.x.gte(other.x),
      (() => this.x.sub(other.x))(),
      (() => other.x.sub(this.x))()
    );
    const y = Circuit.if(
      this.y.gte(other.y),
      (() => this.y.sub(other.y))(),
      (() => other.y.sub(this.y))()
    );

    return x.add(y).mul(7).div(10);
  }
}
