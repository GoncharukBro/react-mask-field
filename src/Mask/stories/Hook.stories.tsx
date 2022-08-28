import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import MaskFieldComponent from '..';

import useMask from '../useMask';

import type { MaskFieldProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

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
