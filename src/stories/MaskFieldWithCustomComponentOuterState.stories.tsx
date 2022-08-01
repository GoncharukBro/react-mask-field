import { useState, forwardRef } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent } from '..';

import type { MaskFieldProps, Detail } from '..';

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

export const MaskFieldWithCustomComponentOuterState: ComponentStory<typeof MaskFieldComponent> =
  () => {
    const [detail, setDetail] = useState<Detail | null>(null);

    return (
      <>
        <MaskFieldComponent
          component={CustomComponentOuterState}
          label="Мой лейбел"
          mask="+7 (___) nnn-__-__"
          replacement={{ _: /\d/, n: /\D/ }}
          onMasking={(event) => setDetail(event.detail)}
          value={detail?.maskedValue}
        />

        <pre>{JSON.stringify(detail, null, 2)}</pre>
      </>
    );
  };
