import { useState } from 'react';
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

export const UncontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        defaultValue="+7 (___) ___-__-__"
        onMasking={(event) => setDetail(event.detail)}
        autoFocus
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

UncontrolledMaskField.args = initialProps;
