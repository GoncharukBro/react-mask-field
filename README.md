# React Masked Input

Компонент MaskedInput позволяет накладывать маску на поле ввода.

Вот так просто можно реализовать любую маску:

```javascript
import { useState } from 'react';
import { MaskedInput } from 'src/masked-input';

export default function Example() {
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

Одной из ключевых особенностей компонента MaskedInput является то, что он опирается только на вводимые пользователем символы, за счет чего вы можете смело включать абсолютно любые символы в маску не опасаясь за "неожиданное поведение" компонента.

### Уникальные свойства

- `mask` - маска в формате строки, использует `char` для замены пользователем;
- `char` - символ для замены используемый в маске (не учитывается при на боре текста);
- `number` - учитывает только числовые символы.

Также вы можете передавать в компонент MaskedInput все свойства доступные элементу `input`.

Компонент InputMask не мутирует объект события `event`, вместо этого он предоставляет два дополнительных параметра:

- `maskedValue` - содержащий маскированное значение;
- `replacedValue` - содержащий символы введенные пользователем без учета символов маски.

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
export default function Example() {
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
export default function Example() {
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

Если вы используете TypeScript вам необходимо передать обработчик событий с типом `any`.

Вот так:

```typescript
export default function Example() {
  const [state, setState] = useState({ maskedValue: '', replacedValue: '' });

  const handleChange = (event: never, maskedValue: string, replacedValue: string) => {
    setState({ maskedValue, replacedValue });
  };

  return (
    <TextField
      InputProps={{ inputComponent: TextFieldMask }}
      value={state.replacedValue}
      onChange={handleChange as any}
    />
  );
}
```

Это компромиссное решение, ведь, как уже было сказано компонент InputMask не мутирует объект события `event`, вместо этого он предоставляет два дополнительных параметра, что не соответствует ожидаемому типу компонентами Material UI.
