
import { SelfProof, Field, Experimental, isReady } from 'snarkyjs';

await isReady;

export let Arena = Experimental.ZkProgram({
  publicInput: Field,

  methods: {
    baseCase: {
      privateInputs: [],

      method(publicInput: Field) {
        publicInput.assertEquals(Field(0));
      },
    },

    inductiveCase: {
      privateInputs: [SelfProof],

      method(publicInput: Field, earlierProof: SelfProof<Field>) {
        earlierProof.verify();
        earlierProof.publicInput.add(1).assertEquals(publicInput);
      },
    },
  },
});