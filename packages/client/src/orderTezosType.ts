import { MichelsonType } from '@taquito/michel-codec';

export const orderTezosType = {
  prim: 'pair',
  args: [
    {
      prim: 'key',
      annots: [
        '%maker',
      ],
    },
    {
      prim: 'or',
      args: [
        {
          prim: 'or',
          args: [
            {
              prim: 'address',
              annots: [
                '%fA12',
              ],
            },
            {
              prim: 'pair',
              args: [
                {
                  prim: 'address',
                },
                {
                  prim: 'nat',
                },
              ],
              annots: [
                '%fA2',
              ],
            },
          ],
          annots: [
            '%fA',
          ],
        },
        {
          prim: 'unit',
          annots: [
            '%tEZ',
          ],
        },
      ],
      annots: [
        '%token',
      ],
    },
    {
      prim: 'nat',
      annots: [
        '%amount',
      ],
    },
    {
      prim: 'bytes',
      annots: [
        '%order_hash',
      ],
    },
    {
      prim: 'bytes',
      annots: [
        '%hashlock',
      ],
    },
  ],
  annots: [
    '%order',
  ],
} as const satisfies MichelsonType;
