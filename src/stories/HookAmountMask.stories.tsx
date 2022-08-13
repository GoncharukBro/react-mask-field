import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useAmountMask from '../useAmountMask';

export default {
  title: 'Example',
} as Meta;

export const HookAmountMask: ComponentStory<any> = () => {
  const ref = useAmountMask({ fractionDigits: 4 });

  const [value, setValue] = useState('');

  return (
    <input
      ref={ref}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
      }}
    />
  );
};
