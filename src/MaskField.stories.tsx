import { useState, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import { MaskField as MaskFieldComponent, useMask } from '.';
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
  separate: true,
};

/**
 *
 * Хук
 *
 */
export const HookMask: ComponentStory<any> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);
  const ref = useMask({
    ...args,
    onMasking: (event) => setDetail(event.detail),
  });

  return (
    <>
      <input ref={ref} value={detail?.maskedValue || ''} />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

HookMask.args = initialProps;

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
        autoFocus
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
        onMasking={(event) => setDetail(event.detail)}
        value={detail?.maskedValue || ''}
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
        // modify={modify}
        value={detail?.maskedValue || ''}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = initialProps;

/**
 *
 * Интеграция с пользовательским компонентом (внешнее состояние)
 *
 */
const CustomComponentOuterState = forwardRef(
  (
    { label, value }: { label?: string; value: string },
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input ref={ref} id="custom-input" value={value} />
      </>
    );
  }
);

export const MaskFieldWithCustomComponentOuterState: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        component={CustomComponentOuterState}
        onMasking={(event) => setDetail(event.detail)}
        label="Мой лейбел"
        value={detail?.maskedValue || ''}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponentOuterState.args = initialProps;

/**
 *
 * Интеграция с пользовательским компонентом (внутреннее состояние)
 *
 */
const CustomComponentInnerState = forwardRef(
  ({ label }: { label?: string }, ref: React.ForwardedRef<HTMLInputElement>) => {
    const [value, setValue] = useState('');

    return (
      <>
        <label htmlFor="custom-input">{label}</label>
        <input
          ref={ref}
          id="custom-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </>
    );
  }
);

export const MaskFieldWithCustomComponentInnerState: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
  return (
    <>
      <MaskFieldComponent {...args} component={CustomComponentInnerState} label="Мой лейбел" />
    </>
  );
};

MaskFieldWithCustomComponentInnerState.args = initialProps;

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
