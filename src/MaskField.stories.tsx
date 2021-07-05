import { useState, forwardRef } from 'react';
import TextField from '@material-ui/core/TextField';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import { ComponentStory, Meta } from '@storybook/react';
import MaskedInputComponent, { MaskedInputProps } from './MaskField';

export default {
  title: 'Example',
  component: MaskedInputComponent,
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
} as Meta<MaskedInputProps>;

export const MaskedInput: ComponentStory<typeof MaskedInputComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

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
      <MaskedInputComponent
        {...args}
        mask={mask}
        set={/\d/}
        value={data.value}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskedInput.args = {
  char: '_',
  showMask: false,
};

const ForwardInput = forwardRef(
  (
    props: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => <input ref={ref} {...props} />
);

export const CustomComponent: ComponentStory<typeof MaskedInputComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <MaskedInputComponent
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

function TextFieldMask({ inputRef, ...other }: InputBaseComponentProps) {
  return <MaskedInput {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}

export const MaterialUIComponent: ComponentStory<typeof MaskedInputComponent> = () => {
  const [data, setData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setData({ maskedValue: event.target.value, value });
  };

  return (
    <>
      <TextField
        InputProps={{ inputComponent: TextFieldMask }}
        value={data.value}
        onChange={handleChange as any}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};
