import { useState } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import { MaskField as MaskFieldComponent } from '..';
import type { MaskFieldProps, ModifiedData, Detail } from '..';

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

export const СontrolledMaskFieldWithModify: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  const modify = ({ unmaskedValue }: ModifiedData) => {
    const newMask =
      unmaskedValue && unmaskedValue[0] !== '7' ? '+_ __________' : '+_ (___) ___-__-__';
    return { mask: newMask };
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask="+_ (___) ___-__-__"
        replacement={{ _: /\d/ }}
        modify={modify}
        value={detail?.maskedValue}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = initialProps;
