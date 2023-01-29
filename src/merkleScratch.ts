import { Field, MerkleWitness, MerkleTree, Poseidon, isReady, shutdown } from 'snarkyjs';

await isReady;

const tree = new MerkleTree(3);
tree.setLeaf(0n, Field(0));
tree.setLeaf(1n, Field(1));
tree.setLeaf(2n, Field(2));
tree.setLeaf(3n, Field(3));

console.log(tree.getNode(0, 0n).toString());
console.log(tree.getNode(0, 1n).toString());
console.log(tree.getNode(0, 2n).toString());
console.log(tree.getNode(0, 3n).toString());
console.log(tree.getNode(1, 0n).toString());
console.log(Poseidon.hash([Field(0), Field(1)]).toString());
console.log(tree.getNode(1, 1n).toString());
console.log(Poseidon.hash([Field(2), Field(3)]).toString());
console.log(tree.getNode(2, 0n).toString());
console.log(Poseidon.hash([
  Poseidon.hash([Field(0), Field(1)]),
  Poseidon.hash([Field(2), Field(3)])
]).toString()
);

await shutdown();
