import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const СontrolledComponent: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);

  return (
    <>
      <InputMaskComponent
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        value={detail?.maskedValue}
        onMasking={(event) => setDetail(event.detail)}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
