import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useNumberFormat from '../useNumberFormat';

export default {
  title: 'Number Format',
} as Meta;

export const Hook: ComponentStory<any> = () => {
  const refDefault = useNumberFormat();
  const refIN = useNumberFormat('en-IN', { minimumIntegerDigits: 4 });
  const refRU = useNumberFormat('ru-RU', { maximumSignificantDigits: 6 });
  const refRU2 = useNumberFormat('ru-RU');
  const refAR = useNumberFormat('ar-EG', {});
  const refCN = useNumberFormat('zh-Hans-CN-u-nu-hanidec', {});

  const [value, setValue] = useState('');

  return (
    <>
      <input ref={refDefault} value={value} onChange={(event) => setValue(event.target.value)} />
      <input ref={refIN} />
      <input ref={refRU} />
      <input ref={refRU2} />
      <input ref={refAR} />
      <input ref={refCN} />

      <div>value: {value}</div>
    </>
  );
};
