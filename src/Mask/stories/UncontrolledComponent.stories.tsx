import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import MaskFieldComponent from '..';

import type { MaskFieldProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

export const UncontrolledComponent: ComponentStory<typeof MaskFieldComponent> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);

  return (
    <>
      <MaskFieldComponent
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        defaultValue="+7 (___) ___-__-__"
        onMasking={(event) => setDetail(event.detail)}
        autoFocus
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};