import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent, useMask } from '..';

import type { MaskFieldProps, MaskingEventDetail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

export const HookMask: ComponentStory<any> = () => {
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
