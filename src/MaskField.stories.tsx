import { useState, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent from '.';
import type { MaskFieldProps, ModifiedData, Detail } from '.';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

const initialProps = {
  mask: '+7 (___) nnn-__-__',
  replacement: {
    _: /\d/,
    // n: /\D/,
  },
  showMask: true,
  separate: false,
};

/**
 *
 * Неконтролируемый компонент
 *
 */
export const UncontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        defaultValue="+7 (___) ___-__-__"
        onMasking={(event) => setDetail(event.detail)}
        // onChange={(event) => {
        //   console.log(2, event);
        // }}
        // onInput={(event) => {
        //   console.log(3, event);
        // }}
        // onFocus={(event) => console.log(event)}
        // onBlur={(event) => console.log(event)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

UncontrolledMaskField.args = initialProps;

/**
 *
 * Контролируемый компонент
 *
 */
export const СontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        value={detail?.maskedValue || ''}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = initialProps;

/**
 *
 * Контролируемый компонент с модификацией
 *
 */
export const СontrolledMaskFieldWithModify: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  const ruPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  const modify = ({ unmaskedValue, separate }: ModifiedData) => {
    let newUnmaskedValue = unmaskedValue;
    if (unmaskedValue[0] === '8') {
      newUnmaskedValue = `7${unmaskedValue.slice(1)}`;
    }
    if (unmaskedValue[0] === '9') {
      newUnmaskedValue = `7${unmaskedValue}`;
    }
    const newMask = !newUnmaskedValue || newUnmaskedValue[0] === '7' ? ruPhoneMask : otherPhoneMask;
    return { unmaskedValue: newUnmaskedValue, mask: newMask, separate: false };
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={ruPhoneMask}
        modify={modify}
        value={detail?.maskedValue}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = initialProps;

/**
 *
 * Интеграция с пользовательским компонентом
 *
 */
const CustomComponent = forwardRef(
  ({ label }: { label?: string }, ref: React.ForwardedRef<HTMLInputElement>) => {
    return (
      <>
        <label htmlFor="customInput">{label}</label>
        <input ref={ref} id="customInput" />
      </>
    );
  }
);

export const MaskFieldWithCustomComponent: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        // {...args}
        component={CustomComponent}
        mask="+7 (___) nnn-__-__"
        replacement={{ _: /\d/ }} // n: /\D/,
        showMask
        separate={false}
        // defaultValue="+7 (9__)"
        // value={detail?.maskedValue}
        onMasking={(event) => setDetail(event.detail)}
        label="Helper"
        // value=""
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponent.args = initialProps;

/**
 *
 * Тестируем динамику `props`
 *
 */
export const TestProps: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [state, setState] = useState(initialProps);

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={state.mask}
        replacement={state.replacement}
        showMask={state.showMask}
        separate={state.separate}
        defaultValue="fegoj0fwfwe"
        onMasking={(event) => setDetail(event.detail)}
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

TestProps.args = {};
