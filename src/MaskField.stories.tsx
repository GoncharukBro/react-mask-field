import { useState, forwardRef } from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent from '../dist';
import { MaskFieldProps } from './MaskField';

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

export const MaskFieldModifyValue: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '79144088469' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    let newValue = value;
    if (newValue[0] === '8') {
      newValue = `7${newValue.slice(1)}`;
    }
    if (newValue[0] === '9') {
      newValue = `7${newValue}`;
    }
    setData({ maskedValue: event.target.value, value: newValue });
  };

  const mask = data.value[0] === '7' ? '+_ (___) ___-__-__' : '+_ __________';

  return (
    <>
      <MaskFieldComponent
        {...args}
        name="phone"
        type="tel"
        mask={mask}
        set={/\d/}
        value={data.value}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskFieldModifyValue.args = {
  char: '_',
  showMask: false,
};

export const MaskFieldModifyMaskedValue: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  const mask = data.maskedValue.slice(0, 2) === '+7' ? '+_ (___) ___-__-__' : '+_ __________';

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={mask}
        set={/\d/}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskFieldModifyMaskedValue.args = {
  char: '_',
  showMask: false,
};

/**
 * Integration with Custom components
 */

const ForwardInput = forwardRef(
  (
    props: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => <input ref={ref} {...props} />
);

export const CustomComponent: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        component={ForwardInput}
        set={/\d/}
        value={data.value}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

CustomComponent.args = {
  mask: '+7 (___) ___-__-__',
  char: '_',
  showMask: false,
};
