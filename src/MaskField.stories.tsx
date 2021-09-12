import { useState, forwardRef } from 'react';
import { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent, { MaskFieldProps, ModifyData } from '.';

function Example() {
  return (
    <>
      <MaskFieldComponent
        name="phone"
        mask="+_ (_0_) _0_-__-__"
        pattern={{ _: /\d/, 0: /\D/ }}
        defaultValue="+7 (9f2) 3f5-67-89"
      />
    </>
  );
}

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
export const UncontrolledMaskFieldAny: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <>
    <MaskFieldComponent {...args} name="phone" mask="+_ (___) ___-__-__" pattern="_" showMask />
  </>
);

UncontrolledMaskFieldAny.args = {};

export const UncontrolledMaskFieldPhone: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <>
    <MaskFieldComponent
      {...args}
      name="phone"
      mask="+_ (_0_) _0_-__-__"
      pattern={{ _: /\d/, 0: /\D/ }}
      showMask
      defaultValue="+7 (9f2) 3f5-67-89"
    />
  </>
);

UncontrolledMaskFieldPhone.args = {};

export const UncontrolledMaskFieldDate: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <>
    <MaskFieldComponent
      {...args}
      mask="dd-mm-yyyy"
      pattern={{ d: /\d/, m: /\d/, y: /\d/ }}
      placeholder="dd-mm-yyyy"
      showMask
    />
  </>
);

UncontrolledMaskFieldDate.args = {};

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
      <MaskFieldComponent
        {...args}
        name="phone"
        pattern={{ _: /\d/ }}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = {
  mask: '+_ (___) ___-__-__',
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

  const ruPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  const modify = ({ value }: ModifyData) => {
    let newValue = value;
    if (value[0] === '8') {
      newValue = `7${value.slice(1)}`;
    }
    if (value[0] === '9') {
      newValue = `7${value}`;
    }
    const newMask = newValue[0] === '7' ? ruPhoneMask : otherPhoneMask;
    return { value: newValue, mask: newMask };
  };

  return (
    <>
      <MaskFieldComponent
        {...args}
        name="phone"
        mask={ruPhoneMask}
        pattern={{ _: /\d/ }}
        modify={modify}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = {
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
        name="phone"
        component={CustomComponent}
        pattern={{ _: /\d/ }}
        value={data.maskedValue}
        onChange={handleChange}
      />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponent.args = {
  mask: '+_ (___) ___-__-__',
  showMask: false,
};
