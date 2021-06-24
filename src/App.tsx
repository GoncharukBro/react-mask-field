import { useState, forwardRef } from 'react';
import TextField from '@material-ui/core/TextField';
import { InputBaseComponentProps } from '@material-ui/core/InputBase';
import { MaskedInput } from 'src/masked-input';

const CustomComponent = forwardRef(
  (
    props: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    return <input ref={ref} {...props} />;
  }
);

function TextFieldMask({ inputRef, ...other }: InputBaseComponentProps) {
  return <MaskedInput {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}

export default function App() {
  const [maskedInputData, setMaskedInputData] = useState({ maskedValue: '', value: '' });
  const [customComponentData, setCustomComponentData] = useState({ maskedValue: '', value: '' });
  const [textFieldData, setTextFieldData] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    let newValue = value;
    if (newValue[0] === '8') {
      newValue = `7${newValue.slice(1)}`;
    }
    if (newValue[0] === '9') {
      newValue = `7${newValue}`;
    }
    setMaskedInputData({ maskedValue: event.target.value, value: newValue });
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ width: 500, margin: 'auto' }}>
        <h4>Нативное использование</h4>

        <MaskedInput
          mask={maskedInputData.value[0] === '7' ? '+_ (___) ___-__-__' : '+_ __________'}
          char="_"
          set={/\d/}
          placeholder="Телефон"
          value={maskedInputData.value}
          onChange={handleChange}
        />
        <pre>{JSON.stringify(maskedInputData, null, 2)}</pre>

        <br />

        <h4>Интеграция с пользовательскими компонентами</h4>

        <MaskedInput
          component={CustomComponent}
          mask="+7 (___) ___-__-__"
          char="_"
          set={/\d/}
          value={customComponentData.value}
          onChange={(event, value) => {
            setCustomComponentData({ maskedValue: event.target.value, value });
          }}
        />
        <pre>{JSON.stringify(customComponentData, null, 2)}</pre>

        <br />

        <h4>Интеграция с компонентами Material UI</h4>

        <TextField
          InputProps={{ inputComponent: TextFieldMask }}
          value={textFieldData.value}
          onChange={
            ((event: React.ChangeEvent<HTMLInputElement>, value: string) => {
              setTextFieldData({ maskedValue: event.target.value, value });
            }) as any
          }
        />
        <pre>{JSON.stringify(textFieldData, null, 2)}</pre>
      </div>
    </div>
  );
}
