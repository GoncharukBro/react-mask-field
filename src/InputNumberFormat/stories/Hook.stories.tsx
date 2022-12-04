import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import useNumberFormat from '../useNumberFormat';

export default {
  title: 'Number Format',
} as Meta;

export const Hook: ComponentStory<any> = () => {
  const refIN = useNumberFormat({ locales: 'en-IN', options: { minimumIntegerDigits: 1 } });
  const refRU = useNumberFormat({ locales: 'ru-RU', options: { maximumSignificantDigits: 6 } });
  const refRUCur = useNumberFormat({
    locales: 'ru-RU',
    options: { style: 'currency', currency: 'RUB' },
  });
  const refJA = useNumberFormat({
    locales: 'ja-JP',
    options: { style: 'currency', currency: 'RUB' },
  });
  const refAR = useNumberFormat({ locales: 'ar-EG' });
  const refCN = useNumberFormat({ locales: 'zh-Hans-CN-u-nu-hanidec' });

  return (
    <>
      <div>
        <p>{`{ locales: 'en-IN', options: { minimumIntegerDigits: 4 } }`}</p>
        <input ref={refIN} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ru-RU', options: { maximumSignificantDigits: 6 } }`}</p>
        <input ref={refRU} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ru-RU', options: { style: 'currency', currency: 'RUB' } }`}</p>
        <input ref={refRUCur} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ja-JP', options: { style: 'currency', currency: 'RUB' } }`}</p>
        <input ref={refJA} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'ar-EG' }`}</p>
        <input ref={refAR} />
      </div>

      <hr />

      <div>
        <p>{`{ locales: 'zh-Hans-CN-u-nu-hanidec' }`}</p>
        <input ref={refCN} />
      </div>
    </>
  );
};
