import { useState, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import { MaskField as MaskFieldComponent } from '..';
import type { MaskFieldProps } from '..';

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

const CustomComponentInnerState = forwardRef(
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

export const MaskFieldWithCustomComponentInnerState: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
  return (
    <>
      <MaskFieldComponent {...args} component={CustomComponentInnerState} label="Мой лейбел" />
    </>
  );
};

MaskFieldWithCustomComponentInnerState.args = initialProps;
