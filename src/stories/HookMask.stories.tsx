import { useState } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import { MaskField as MaskFieldComponent, useMask } from '..';
import type { MaskFieldProps, Detail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

const initialProps = {
  mask: '+7 (___) nnn-__-__',
  replacement: {
    _: /\d/,
    // n: /\D/,
  },
  showMask: true,
  separate: false,
};

export const HookMask: ComponentStory<any> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [value, setValue] = useState('');
  const ref = useMask({
    ...args,
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

HookMask.args = initialProps;
