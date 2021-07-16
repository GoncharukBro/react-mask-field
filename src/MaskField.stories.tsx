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

export const UncontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <>
    <MaskFieldComponent
      {...args}
      // name="phone"
      type="tel"
      set={/\d/}
    />
  </>
);

UncontrolledMaskField.args = {
  mask: '+_ (___) ___-__-__',
  char: '_',
  showMask: false,
};

export const СontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        // name="phone"
        type="tel"
        set={/\d/}
        value={data.value}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = {
  mask: '+_ (___) ___-__-__',
  char: '_',
  showMask: false,
};

export const СontrolledMaskFieldModifyValue: ComponentStory<typeof MaskFieldComponent> = (args) => {
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
        // name="phone"
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

СontrolledMaskFieldModifyValue.args = {
  char: '_',
  showMask: false,
};

export const СontrolledMaskFieldModifyValueWithModify: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
  const [data, setData] = useState({ maskedValue: '', value: '79144088469' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  const rusPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  // const modify = (value: string, mask: string, char: string) => {
  //   let newValue = value;
  //   if (value[0] === '8') {
  //     newValue = `7${value.slice(1)}`;
  //   }
  //   if (value[0] === '9') {
  //     newValue = `7${value}`;
  //   }
  //   const newMask = newValue[0] === '7' ? rusPhoneMask : otherPhoneMask;
  //   return { value: newValue, mask: newMask };
  // };

  return (
    <>
      <MaskFieldComponent
        {...args}
        type="tel"
        mask={rusPhoneMask}
        set={/\d/}
        // modify={modify}
        value={data.value}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldModifyValueWithModify.args = {
  char: '_',
  showMask: false,
};

export const СontrolledMaskFieldModifyMaskedValue: ComponentStory<typeof MaskFieldComponent> = (
  args
) => {
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

СontrolledMaskFieldModifyMaskedValue.args = {
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
