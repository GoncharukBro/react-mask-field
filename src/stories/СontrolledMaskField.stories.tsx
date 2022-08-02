import { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent } from '..';

import type { MaskFieldProps, Detail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

export const СontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = () => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        mask="+7 (___) ___-__-__"
        replacement={{ _: /\d/ }}
        onMasking={(event) => setDetail(event.detail)}
        value={detail?.maskedValue}
      />

      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};
