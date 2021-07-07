# react-mask-field

Компонент MaskField позволяет накладывать маску на поле ввода.

[![NPM](https://img.shields.io/npm/v/react-mask-field.svg)](https://www.npmjs.com/package/react-mask-field)

## Установка

```bash
npm i react-mask-field
```

## Использование

Пакет экспортирует по умолчанию компонент MaskField, который представляет собой стандартный элемент `input`, с логикой обработки ввода.

Вот так просто можно реализовать любую маску:

```jsx
import MaskField from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" char="_" />;
}
```

Компонент также поддерживает котролируемый ввод:

```jsx
import { useState } from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [state, setState] = useState({ maskedValue: '', value: '' });

  const handleChange = (event, value) => {
    setState({ maskedValue: event.target.value, value });
  };

  return (
    <MaskField
      mask="+7 (___) ___-__-__"
      char="_"
      set={/\d/}
      value={state.value}
      onChange={handleChange}
    />
  );
}
```

Обратите внимание, что обработчик событий `handleChange` принимает два параметра `event` и `value` вместо одного. Всё дело в том, что иногда вместо только лишь маскированного значения удобно иметь еще и значение, введенное пользователем, без учета символов маски. Вам необязательно использовать второй параметр `value`, он существует только лишь для удобства.

> Для корректной работы маски, рекомендуется помещать в качестве значения `value`, передаваемое компоненту MaskField, либо значение из `event.target.value`, либо из дополнительного параметра `value`, как показано на примере выше.

Одной из ключевых особенностей компонента MaskField является то, что он опирается только на вводимые пользователем символы, за счет чего вы можете смело включать абсолютно любые символы в маску, не опасаясь за "неожиданное поведение" компонента.

### Уникальные свойства

| Свойство  |    Тип    | Значение по умолчанию | Описание                                                                                                                                                                                                                                                                              |
| --------- | :-------: | :-------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component | Component |       undefined       | Служит для возможности использования пользователских компонентов, например если вы хотите использовать собственный стилизованный компонент с возможностью маскировать значение (см. раздел "Интеграция c пользовательскими компонентами").                                            |
| mask \*   |  string   |                       | Маска в формате строки, использует `char` как символ для замены.                                                                                                                                                                                                                      |
| char \*   |  string   |                       | Символ для замены используемый в маске (не учитывается при вводе).                                                                                                                                                                                                                    |
| set       |  RegExp   |       undefined       | Указывает какие символы разрешены для ввода. Например если вы хотите разрешить ввод только числовых значений, вы можете установить для `set` значение `/[0-9]/` или `/\d/`, как показано на примерах выше. Если вы не установите свойство `set`, тогда будут разрешены любые символы. |
| showMask  |  boolean  |         false         | Управляет отображением маски. При `showMask === true` будет отображена полная маска, например `+7 (912) 3__-__-__` вместо `+7 (912). 3`                                                                                                                                               |

> Вы также можете передавать все свойства доступные элементу `input`.

## Более сложное использование

MaskField позволяет адаптировать маску по условию. Рассмотрим возможную ситуацию, где нам необходимо изменять маску в зависимости от кода города телефона:

```jsx
import { useState } from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [state, setState] = useState({ maskedValue: '', value: '' });

  const handleChange = (event, value) => {
    setData({ maskedValue: event.target.value, value });
  };

  const mask = data.value[0] === '7' ? '+_ (___) ___-__-__' : '+_ __________';

  return <MaskField mask={mask} char="_" set={/\d/} value={state.value} onChange={handleChange} />;
}
```

Также вы можете модифицировать само значение. Проще всего это делать со значением в дополнительном параметре `value` события `onChange`:

```jsx
const handleChange = (event, value) => {
  let newValue = value;

  if (newValue[0] === '8') {
    newValue = `7${newValue.slice(1)}`;
  }

  if (newValue[0] === '9') {
    newValue = `7${newValue}`;
  }

  setData({ maskedValue: event.target.value, value: newValue });
};
```

> Если вы модифицируете маскированное значение, убедитесь, что значение, передаваемое свойству `value` компонента MaskField соответствует формату передаваемой маски, иначе значение может отображаться некорректно.

## Интеграция c пользовательскими компонентами

MaskField позволяет с лёгкостью интегрировать пользовательские компоненты, давая возможность использовать собственные стилизованные компоненты.

Для этого необходимо передать пользовательский компонент в метод `forwardRef`, предоставляемый React. `forwardRef` позволяет автоматически передавать значение `ref` дочернему элементу ([подробнее про forwardRef](https://ru.reactjs.org/docs/forwarding-refs.html)).

Вот как это делается:

```jsx
import { useState, forwardRef } from 'react';
import MaskField from 'react-mask-field';

// Пользовательский компонент
const CustomComponent = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Компонент с MaskField
export default function Example() {
  return <MaskField component={CustomComponent} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}
```

## Интеграция с компонентами Material UI

Если вы используете Material UI, вам необходимо создать компонент, возвращающий MaskField и передать его как свойство `inputComponent` компонента Material UI.

В этом случае компонент Material UI будет передавать вашему компоненту все свойства доступные элементу `input`, а также дополнительное свойство `inputRef`, которое вам необходимо будет передать в качестве значения для свойства `ref` компонента MaskField.

Вот как это делается:

```jsx
import { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import MaskField from 'react-mask-field';

// Компонент с MaskField
function TextFieldMask({ inputRef, ...other }) {
  return <MaskField {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}

// Компонент с Material UI
export default function Example() {
  return <TextField InputProps={{ inputComponent: TextFieldMask }} />;
}
```

## Использование с TypeScript

Если вы используете Material UI совместно с TypeScript и хотите получить значение из второго необязательного параметра события `onChange`, вам необходимо передать обработчик события с типом `any`.

Вот так:

```tsx
export default function Example() {
  const [state, setState] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setState({ maskedValue: event.target.value, value });
  };

  return (
    <TextField
      InputProps={{ inputComponent: TextFieldMask }}
      value={state.value}
      onChange={handleChange as any}
    />
  );
}
```

> Это компромиссное решение, так как наличие второго параметра не соответствует ожидаемому типу компонента Material UI.

Если вы используете TypeScript непосредственно с самим компонентом MaskField, указание `as any` уже не потребуется, так как сам MaskField ожидает второй необязательный параметр:

```tsx
export default function Example() {
  const [state, setState] = useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setState({ maskedValue: event.target.value, value });
  };

  return (
    <MaskField
      mask="+7 (___) ___-__-__"
      char="_"
      set={/\d/}
      value={state.value}
      onChange={handleChange}
    />
  );
}
```

## License

MIT © [Nikolay Goncharuk](https://github.com/GoncharukBro)
