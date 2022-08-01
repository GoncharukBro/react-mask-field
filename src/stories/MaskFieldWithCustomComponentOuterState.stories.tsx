import { useState, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import { MaskField as MaskFieldComponent } from '..';
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

export const MaskFieldWithCustomComponentOuterState: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        component={CustomComponentOuterState}
        onMasking={(event) => setDetail(event.detail)}
        label="Мой лейбел"
        value={detail?.maskedValue}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponentOuterState.args = initialProps;
