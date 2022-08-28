import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import useMask from '../useMask';

import type { InputMaskProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const Hook: ComponentStory<any> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);
  const [value, setValue] = useState('');

  const ref = useMask({
    mask: '+7 (___) ___-__-__',
    replacement: { _: /\d/ },
    separate: true,
    showMask: true,
    onMasking: (event) => {
      setDetail(event.detail);
    },
  });

  return (
    <>
      <input
        ref={ref}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
