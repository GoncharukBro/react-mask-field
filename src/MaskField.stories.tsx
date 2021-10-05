import { useState, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent from '.';
import type { MaskFieldProps, ModifiedData, Detail } from '.';

export default {
  title: 'Example',
  component: MaskFieldComponent,
} as Meta<MaskFieldProps>;

/**
 *
 * Неконтролируемый компонент
 *
 */
export const UncontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent {...args} onMasking={(event) => setDetail(event.detail)} />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

UncontrolledMaskField.args = {
  mask: '+7 (___) ___-__-__',
  replacement: { _: /\d/ },
  showMask: false,
  separate: true,
};

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
        value={detail?.masked}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = {
  mask: '+7 (___) ___-__-__',
  replacement: { _: /\d/ },
  showMask: true,
  separate: true,
};

/**
 *
 * Контролируемый компонент с модификацией
 *
 */
export const СontrolledMaskFieldWithModify: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  const ruPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  const modify = ({ value }: ModifiedData) => {
    let newValue = value;
    if (value[0] === '8') {
      newValue = `7${value.slice(1)}`;
    }
    if (value[0] === '9') {
      newValue = `7${value}`;
    }
    const newMask = !newValue || newValue[0] === '7' ? ruPhoneMask : otherPhoneMask;
    return { value: newValue, mask: newMask };
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={ruPhoneMask}
        modify={modify}
        value={detail?.masked}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = {
  replacement: { _: /\d/ },
  showMask: true,
  separate: true,
};

/**
 *
 * Интеграция с пользовательским компонентом
 *
 */
const CustomComponent = forwardRef(
  (
    props: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return <input ref={ref} {...props} />;
  }
);

export const MaskFieldWithCustomComponent: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [detail, setDetail] = useState<Detail | null>(null);

  return (
    <>
      <MaskFieldComponent
        {...args}
        component={CustomComponent}
        value={detail?.masked}
        onMasking={(event) => setDetail(event.detail)}
      />
      <pre>{JSON.stringify(detail, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponent.args = {
  mask: '+_ (___) ___-__-__',
  replacement: { _: /\d/ },
  showMask: true,
  separate: true,
};
