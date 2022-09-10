import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useNumberFormat from '../useNumberFormat';

export default {
  title: 'Number Format',
} as Meta;

export const Hook: ComponentStory<any> = () => {
  const refDefault = useNumberFormat({
    locales: 'ja-JP',
    options: { style: 'currency', currency: 'JPY' },
  });
  const refIN = useNumberFormat({ locales: 'en-IN', options: { minimumIntegerDigits: 4 } });
  const refRU = useNumberFormat({ locales: 'ru-RU', options: { maximumIntegerDigits: 6 } });
  const refRU2 = useNumberFormat({ locales: 'ru-RU' });
  const refAR = useNumberFormat({ locales: 'ar-EG' });
  const refCN = useNumberFormat({ locales: 'zh-Hans-CN-u-nu-hanidec' });

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
