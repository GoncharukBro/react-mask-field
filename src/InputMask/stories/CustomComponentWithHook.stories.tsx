import React, { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useMask from '../useMask';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';

import type { MaskEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

const CustomComponent = forwardRef(
  (
    { label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>,
    forwardedRef: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={forwardedRef} {...props} />
      </>
    );
  }
);

export const CustomComponentWithHook: ComponentStory<any> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  const ref = useMask({
    mask: '+7 (___) ___-__-__',
    replacement: { _: /\d/ },
    separate: true,
    showMask: true,
    onMask: (event) => {
      setDetail(event.detail);
    },
  });

  return (
    <>
      <CustomComponent ref={ref} label="Мой лейбел" id="custom-input" value={detail?.maskedValue} />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
