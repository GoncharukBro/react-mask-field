import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useNumberFormat from '../useNumberFormat';

export default {
  title: 'Example',
} as Meta;

export const HookNumberFormat: ComponentStory<any> = () => {
  const refDefault = useNumberFormat();
  const refIN = useNumberFormat('en-IN', {});
  const refRU = useNumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 10 });
  const refAR = useNumberFormat('ar-EG', {});
  const refCN = useNumberFormat('zh-Hans-CN-u-nu-hanidec', {});

  const [value, setValue] = useState('');

  return (
    <>
      <input ref={refDefault} value={value} onChange={(event) => setValue(event.target.value)} />
      <input ref={refIN} />
      <input ref={refRU} />
      <input ref={refAR} />
      <input ref={refCN} />

      <div>value: {value}</div>
    </>
  );
};
