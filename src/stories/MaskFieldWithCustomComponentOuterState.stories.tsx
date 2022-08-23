import React, { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent } from '..';

import type { MaskFieldProps, MaskingEventDetail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

const CustomComponentOuterState = forwardRef(
  (
    { label, value }: { label?: string; value: string },
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={ref} id="custom-input" value={value} />
      </>
    );
  }
);

export const MaskFieldWithCustomComponentOuterState: ComponentStory<
  typeof MaskFieldComponent
> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);

  return (
    <>
      <MaskFieldComponent
        component={CustomComponentOuterState}
        label="Мой лейбел"
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        onMasking={(event) => setDetail(event.detail)}
        value={detail?.maskedValue}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
