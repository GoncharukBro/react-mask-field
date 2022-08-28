import React, { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import InputMaskComponent from '..';

import type { InputMaskProps } from '..';
import type { MaskingEventDetail } from '../types';

export default {
  title: 'Mask',
  component: InputMaskComponent,
} as Meta<InputMaskProps>;

export const TestProps: ComponentStory<typeof InputMaskComponent> = () => {
  const [detail, setDetail] = useState<MaskingEventDetail | null>(null);
  const [state, setState] = useState({
    mask: '+7 (___) ___-__-__',
    replacement: { _: /\d/ },
    showMask: true,
    separate: false,
  });

  const [value, setValue] = useState('fegoj0fwfwe');

  return (
    <>
      <InputMaskComponent
        mask={state.mask}
        replacement={state.replacement}
        showMask={state.showMask}
        separate={state.separate}
        value={value}
        // defaultValue="fegoj0fwfwe"
        onChange={(event) => setValue(event.target.value)}
        onMasking={(event) => {
          setDetail(event.detail);
        }}
      />

      <button
        type="button"
        onClick={() =>
          setState((prev) => ({
            ...prev,
            mask: prev.mask === '+7 (___) ___-__-__' ? '___-___' : '+7 (___) ___-__-__',
          }))
        }
      >
        Изменить mask
      </button>

      {/* <button
        type="button"
        onClick={() =>
          setState((prev) => ({
            ...prev,
            replacement: prev.replacement === { _: /\d/ } ? '0' : '_',
          }))
        }
      >
        Изменить replacement
      </button> */}

      <button
        type="button"
        onClick={() => setState((prev) => ({ ...prev, showMask: !prev.showMask }))}
      >
        Изменить showMask
      </button>

      <button
        type="button"
        onClick={() => setState((prev) => ({ ...prev, separate: !prev.separate }))}
      >
        Изменить separate
      </button>

      <pre>{JSON.stringify({ state, detail }, null, 2)}</pre>
    </>
  );
};
