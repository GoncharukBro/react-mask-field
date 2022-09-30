import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputNumberFormatComponent from '..';

import type { InputNumberFormatProps } from '..';
import type { NumberFormatEventDetail } from '../types';

export default {
  title: 'Number Format',
  component: InputNumberFormatComponent,
} as Meta<InputNumberFormatProps>;

export const UncontrolledComponent: ComponentStory<typeof InputNumberFormatComponent> = () => {
  const [detail, setDetail] = useState<NumberFormatEventDetail | null>(null);

  return (
    <>
      <InputNumberFormatComponent onFormat={(event) => setDetail(event.detail)} />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
