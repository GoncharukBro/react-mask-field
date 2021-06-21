import { useState, forwardRef } from 'react';
import TextField from '@material-ui/core/TextField';
import { MaskedInput } from 'src/masked-input';

const CustomComponent = forwardRef((props: any, ref: any) => {
  return <input ref={ref} {...props} />;
});

function TextFieldMask({ inputRef, ...other }: any) {
  return <MaskedInput {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" number />;
}

export default function App() {
  const [maskedInputData, setMaskedInputData] = useState({
    maskedValue: '',
    replacedValue: '',
  });
  const [customComponentData, setCustomComponentData] = useState({
    maskedValue: '',
    replacedValue: '',
  });
  const [textFieldData, setTextFieldData] = useState({
    maskedValue: '',
    replacedValue: '',
  });

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <div style={{ width: 500, margin: 'auto' }}>
        <h4>Нативное использование</h4>

        <MaskedInput
          mask="+7 (___) ___-__-__"
          char="_"
          number
          value={maskedInputData.maskedValue}
          onChange={(event, maskedValue, replacedValue) => {
            setMaskedInputData({ maskedValue, replacedValue });
          }}
        />
        <pre>{JSON.stringify(maskedInputData, null, 2)}</pre>

        <br />

        <h4>Интеграция с пользовательскими компонентами</h4>

        <MaskedInput
          component={CustomComponent}
          mask="+7 (___) ___-__-__"
          char="_"
          number
          value={customComponentData.replacedValue}
          onChange={(event, maskedValue, replacedValue) => {
            setCustomComponentData({ maskedValue, replacedValue });
          }}
        />
        <pre>{JSON.stringify(customComponentData, null, 2)}</pre>

        <br />

        <h4>Интеграция с компонентами Material UI</h4>

        <TextField
          InputProps={{ inputComponent: TextFieldMask }}
          value={textFieldData.replacedValue}
          onChange={
            ((event: never, maskedValue: string, replacedValue: string) => {
              setTextFieldData({ maskedValue, replacedValue });
            }) as any
          }
        />
        <pre>{JSON.stringify(textFieldData, null, 2)}</pre>
      </div>
    </div>
  );
}
