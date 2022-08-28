import React, { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import MaskFieldComponent from '..';

import type { MaskFieldProps } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

const CustomComponent = forwardRef(
  ({ label }: { label?: string }, ref: React.ForwardedRef<HTMLInputElement>) => {
    const [value, setValue] = useState('');

    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input
          ref={ref}
          id="custom-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </>
    );
  }
);

export const CustomComponentWithInnerState: ComponentStory<typeof MaskFieldComponent> = () => {
  return (
    <>
      <MaskFieldComponent
        component={CustomComponent}
        label="Мой лейбел"
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
      />
    </>
  );
};
