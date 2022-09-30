import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';
import type { ModifiedData, MaskEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const СontrolledComponentWithModifyPhone: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskEventDetail | null>(null);

  const modify = ({ unmaskedValue }: ModifiedData) => {
    const newMask =
      unmaskedValue && unmaskedValue[0] !== '7' ? '+_ __________' : '+_ (___) ___-__-__';
    return { mask: newMask };
  };

  return (
    <>
      <InputMaskComponent
        mask="+_ (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={detail?.maskedValue}
        modify={modify}
        onMask={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
