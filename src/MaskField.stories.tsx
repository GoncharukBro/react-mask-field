import { useState, useRef, forwardRef } from 'react';
import type { ComponentStory, Meta } from '@storybook/react';
import MaskFieldComponent from '.';
import type { MaskFieldProps, ModifiedData } from '.';

function Form({ children, ...other }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...other}>
      {children}
      <div>
        <button type="submit">Отправить</button>
      </div>
    </form>
  );
}

export default {
  title: 'Example',
  component: MaskFieldComponent,
  argTypes: {
    mask: {
      description: 'Маска ввода',
    },
    replacement: {
      description: 'Символ для замены',
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
export const UncontrolledMaskFieldAny: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [mask, setMask] = useState('+_ (___) ___-__-__');
  const [value, setValue] = useState('');

  return (
    <>
      <Form>
        <MaskFieldComponent
          {...args}
          mask={mask}
          replacement={{ _: /\d/ }}
          showMask
          separate
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />

        <button
          type="button"
          onClick={() => {
            setMask('___-___');
          }}
        >
          Поменять ref
        </button>
      </Form>

      <pre>{value}</pre>
    </>
  );
};

UncontrolledMaskFieldAny.args = {};

export const UncontrolledMaskFieldPhone: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <Form>
    <MaskFieldComponent
      {...args}
      name="phone"
      mask="+_ (___) ___-__-__"
      replacement={{ _: /\d/ }}
      showMask
      defaultValue="+7 (a12) 345-67-89"
    />
  </Form>
);

UncontrolledMaskFieldPhone.args = {};

export const UncontrolledMaskFieldDate: ComponentStory<typeof MaskFieldComponent> = (args) => (
  <Form>
    <MaskFieldComponent
      {...args}
      mask="dd-Dm-yyDy"
      replacement={{ d: new RegExp('\\d'), m: /\d/, y: /\d/, D: /\D/ }}
      showMask
      placeholder="dd-Dm-yyDy"
      onMasking={(event) => {
        console.log(event.detail.pattern);
      }}
    />
  </Form>
);

UncontrolledMaskFieldDate.args = {};

/**
 *
 * Контролируемый компонент
 *
 */
export const СontrolledMaskField: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({ maskedValue: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setData({ maskedValue: event.target.value });
  };

  return (
    <>
      <Form>
        <MaskFieldComponent
          {...args}
          mask="+_ (___) ___-__-__"
          replacement={{ _: /./ }}
          showMask
          value={data.maskedValue}
          onChange={handleChange}
        />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskField.args = {};

/**
 *
 * Контролируемый компонент с модификацией
 *
 */
export const СontrolledMaskFieldWithModify: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [data, setData] = useState({
    maskedValue: '',
    selection: { start: 0, end: 0 },
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      maskedValue: event.target.value,
      selection: { start: event.target.selectionStart, end: event.target.selectionEnd },
    });
  };

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
      <Form>
        <MaskFieldComponent
          {...args}
          mask={ruPhoneMask}
          replacement={{ _: /\d/ }}
          showMask
          modify={modify}
          value={data.maskedValue}
          onChange={handleChange}
        />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

СontrolledMaskFieldWithModify.args = {};

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
  const [data, setData] = useState({ maskedValue: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setData({ maskedValue: event.target.value });
  };

  return (
    <>
      <Form>
        <MaskFieldComponent
          {...args}
          name="phone"
          component={CustomComponent}
          mask="+_ (___) ___-__-__"
          replacement={{ _: /\d/ }}
          value={data.maskedValue}
          onChange={handleChange}
        />
      </Form>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

MaskFieldWithCustomComponent.args = {};

/**
 *
 * Тестируем динамику пропсов
 *
 */
export const MaskFieldTestProps: ComponentStory<typeof MaskFieldComponent> = (args) => {
  const [state, setState] = useState({ showMask: true });

  return (
    <>
      <Form>
        <MaskFieldComponent
          {...args}
          name="phone"
          mask="+_ (___) ___-__-__"
          replacement={{ _: /\d/ }}
          showMask={state.showMask}
          defaultValue="+а (___) ___-__"
        />
      </Form>
      <div>
        <button
          type="button"
          onClick={() => setState(({ showMask, ...prev }) => ({ ...prev, showMask: !showMask }))}
        >
          {state.showMask ? 'Выключить отображение маски' : 'Включить отображение маски'}
        </button>
      </div>
      <div>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </>
  );
};

MaskFieldTestProps.args = {};
