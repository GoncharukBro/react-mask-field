import { useState, forwardRef } from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent, { MaskFieldProps } from './MaskField';

export default {
  title: 'Example',
  component: MaskFieldComponent,
  argTypes: {
    mask: {
      description: 'Маска ввода',
    },
    char: {
      description: 'Символ для замены',
    },
    set: {
      description: 'Разрешенные правила ввода',
    },
    showMask: {
      description: 'Атрибут определяющий будет ли отображена маска ввода',
    },
  },
} as Meta<MaskFieldProps>;

/**
 *
 * Неконтролируемый компонент
 *
 */
export const UncontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <>
    <MaskFieldComponent {...args} set={/\d/} defaultValue="+7 (912) 345-67-89" />
  </>
);

UncontrolledMaskField.args = {
  mask: '+_ (___) ___-__-__',
  char: '_',
  showMask: false,
};

/**
 *
 * Контролируемый компонент
 *
 */
export const СontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '+7 (912) 345-67-89', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <MaskFieldComponent {...args} set={/\d/} value={data.maskedValue} onChange={handleChange} />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = {
  mask: '+_ (___) ___-__-__',
  char: '_',
  showMask: false,
};

/**
 *
 * Контролируемый компонент с модификацией
 *
 */
export const СontrolledMaskFieldWithModify: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  const rusPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  const modify = (value: string) => {
    let newValue = value;
    if (value[0] === '8') {
      newValue = `7${value.slice(1)}`;
    }
    if (value[0] === '9') {
      newValue = `7${value}`;
    }
    const newMask = newValue[0] === '7' ? rusPhoneMask : otherPhoneMask;
    return { value: newValue, mask: newMask };
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={rusPhoneMask}
        set={/\d/}
        modify={modify}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = {
  char: '_',
  showMask: false,
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
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        component={CustomComponent}
        set={/\d/}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponent.args = {
  mask: '+_ (___) ___-__-__',
  char: '_',
  showMask: false,
};
