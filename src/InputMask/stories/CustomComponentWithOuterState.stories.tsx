import React, { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

const CustomComponent = forwardRef(
  (
    { label, value }: { label?: string; value: string },
    forwardedRef: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={forwardedRef} id="custom-input" value={value} />
      </>
    );
  }
);

export const CustomComponentWithOuterState: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);

  return (
    <>
      <InputMaskComponent
        component={CustomComponent}
        label="Мой лейбел"
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={detail?.maskedValue}
        onMasking={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
