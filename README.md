# React Masked Input

Компонент MaskedInput позволяет накладывать маску на поле ввода.

```javascript
import { useState } from 'react';
import { MaskedInput } from 'src/masked-input';

export default function App() {
  const [state, setState] = useState({ maskedValue: '', replacedValue: '' });

  const handleChange = (event, maskedValue, replacedValue) => {
    setState({ maskedValue, replacedValue });
  };

  return (
    <MaskedInput
      mask="+7 (___) ___-__-__"
      char="_"
      number
      value={state.maskedValue}
      onChange={handleChange}
    />
  );
}
```

## Интеграция пользовательскими компонентами

MaskedInput позволяет с лёгкостью интегрировать пользовательские компоненты, давая возможность использовать собственные стилизованные компоненты.

Для этого необходимо передать пользовательский компонент в метод `forwardRef`, предоставляемый React. `forwardRef` позволяет автоматически передавать значение `ref` дочернему элементу ([подробнее](https://ru.reactjs.org/docs/forwarding-refs.html)).

Вот как это делается:

```javascript
import { useState, forwardRef } from 'react';
import { MaskedInput } from 'src/masked-input';

// Пользовательский компонент
const CustomComponent = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Компонент с MaskedInput
export default function App() {
  const [state, setState] = useState({ maskedValue: '', replacedValue: '' });

  const handleChange = (event, maskedValue, replacedValue) => {
    setState({ maskedValue, replacedValue });
  };

  return (
    <MaskedInput
      component={CustomComponent}
      mask="+7 (___) ___-__-__"
      char="_"
      number
      value={state.replacedValue}
      onChange={handleChange}
    />
  );
}
```

## Интеграция с компонентами Material UI

Если вы используете Material UI, вам необходимо создать свой компонент и передать его как свойство `inputComponent`.

Ваш компонент должен передавать свойство `inputRef`, в качестве значения для свойства `ref` компонента MaskedInput.

Вот как это делается:

```javascript
import { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { MaskedInput } from 'src/masked-input';

// Компонент с MaskedInput
function TextFieldMask({ inputRef, ...other }) {
  return <MaskedInput {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" number />;
}

// Компонент с Material UI
export default function App() {
  const [state, setState] = useState({ maskedValue: '', replacedValue: '' });

  const handleChange = (event, maskedValue, replacedValue) => {
    setState({ maskedValue, replacedValue });
  };

  return (
    <TextField
      InputProps={{ inputComponent: TextFieldMask }}
      value={state.replacedValue}
      onChange={handleChange}
    />
  );
}
```
