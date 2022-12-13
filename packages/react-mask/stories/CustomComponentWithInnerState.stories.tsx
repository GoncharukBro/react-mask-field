import React, { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { InputMask as InputMaskComponent } from '..';

import type { InputMaskProps } from '..';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

const CustomComponent = forwardRef(
  ({ label }: { label?: string }, forwardedRef: React.ForwardedRef<HTMLInputElement>) => {
    const [value, setValue] = useState('');

    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input
          ref={forwardedRef}
          id="custom-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </>
    );
  }
);

export const CustomComponentWithInnerState: ComponentStory<typeof InputMaskComponent> = () => {
  return (
    <InputMaskComponent
      component={CustomComponent}
      label="Мой лейбел"
      mask="+7 (___) ___-__-__"
      replacement={{ _: /\d/ }}
    />
  );
};
