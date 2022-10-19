import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';
import type { MaskEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const СontrolledComponent: ComponentStory<typeof InputMaskComponent> = () => {
  const [mask, setMask] = useState('+7 (___) ___-__-__');
  const [value, setValue] = useState('');

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setMask((prev) => {
            return prev[1] === '7' ? '+1 (___) ___-__-__' : '+7 (___) ___-__-__';
          })
        }
      >
        Изменить маску
      </button>

      <InputMaskComponent
        mask={mask}
        replacement={{ _: /\d/ }}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <pre>{JSON.stringify({ mask, value }, null, 2)}</pre>
    </>
  );
};
