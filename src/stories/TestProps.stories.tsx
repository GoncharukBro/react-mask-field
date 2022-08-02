import { useState } from 'react';

import type { ComponentStory, Meta } from '@storybook/react';

import { MaskField as MaskFieldComponent } from '..';

import type { MaskFieldProps, Detail } from '..';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

export const TestProps: ComponentStory<typeof MaskFieldComponent> = () => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState({
    mask: '+7 (___) ___-__-__',
    replacement: { _: /\d/ },
    showMask: true,
    separate: false,
  });

  const [value, setValue] = useState('fegoj0fwfwe');

  return (
    <>
      <MaskFieldComponent
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
