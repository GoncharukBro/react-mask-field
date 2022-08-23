import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent } from '..';

import type { MaskFieldProps, ModifiedData, MaskingEventDetail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

export const СontrolledMaskFieldWithModifyPhone: ComponentStory<typeof MaskFieldComponent> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);

  const modify = ({ unmaskedValue }: ModifiedData) => {
    const newMask =
      unmaskedValue && unmaskedValue[0] !== '7' ? '+_ __________' : '+_ (___) ___-__-__';
    return { mask: newMask };
  };

  return (
    <>
      <MaskFieldComponent
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
