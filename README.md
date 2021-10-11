# react-mask-field

The MaskField component allows you to apply a mask to the input field.

![npm](https://img.shields.io/npm/dt/react-mask-field?style=flat-square)
![npm](https://img.shields.io/npm/v/react-mask-field?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/min/react-mask-field?style=flat-square)

## Installation

```bash
npm i react-mask-field
```

or using **Yarn**:

```bash
yarn add react-flexible-masonry
```

## Unique properties

| Name        |       Type       | Default | Description                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | :--------------: | :-----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component   |    Component     |         | Служит для возможности использования пользовательских компонентов, например, если вы хотите использовать собственный стилизованный компонент с возможностью маскирования значения (см. «Интеграция с пользовательскими компонентами»).                                                                                                                      |
| mask        |      string      |   ""    | Маска ввода, для замены символов используется `replacement`.                                                                                                                                                                                                                                                                                                |
| replacement | string \| object |   {}    | Устанавливает символы для замены в маске, где `key` - заменяемый символ, `value` - регулярное выражение, которому должен соответствовать вводимый символ (см. «Replacement»). Возможно передать символ замены в качестве строки, тогда `replacement="_"`, по умолчанию будет соответствовать `replacement={{ _: /./ }}`. Ключи игнорируются при вводе.      |
| showMask    |     boolean      |  false  | Управляет отображением маски, например, `+7 (912) ___-__-__`, вместо `+7 (912`.                                                                                                                                                                                                                                                                             |
| separate    |     boolean      |  false  | Сохраняет позицию вводимых символов. По умолчанию вводимые символы не разрывны, это означает что, если вы удалите символы в середине значения, символы сдвигаются в левую сторону, образуя неразрывное значение, что соответствует поведению `input`. Например, при `true` возможно значение - `+7 (912) ___-67-__` , при `false` - `+7 (912) 67_-__-__`.   |
| modify      |     function     |         | Хук, срабатывающий перед маскированием. Позволяет условно изменять свойства компонента, влияющие на маскирование. Допустимые значения для модификации: `unmaskedValue` (значение без символов маски), `mask`, `replacement`, `showMask` и `separate`. Это полезно, когда вам нужно условно настроить отображаемое значение для улучшения UX (см. «Modify»). |
| onMasking   |     function     |         | Обработчик пользовательского события `masking`. В отличии от события `change`, которое срабатывает только при вводе, событие `masking` срабатывает при маскировании, например в том числе если изменились `props` (см. «Событие masking»).                                                                                                                  |

> Вы также можете передать и другие свойства, доступные элементу `input` по умолчанию.

## Использование

Компонент `MaskField`, экспортируемый по умолчанию, является стандартным элементом `input` с дополнительной логикой обработки ввода.

Например, вот как можно легко реализовать маску для ввода номера телефона:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" replacement={{ _: /\d/ }} />;
}
```

Одной из ключевых особенностей компонента `MaskField` является то, что он полагается только на вводимые пользователем символы, поэтому вы можете безопасно включать в маску абсолютно любые символы, не опасаясь «неожиданного поведения» компонента.

Вы можете работать с компонентом `MaskField` точно также как и с элементом `input`, с той разницей, что компонент `MaskField` использует дополнительную логику для обработки значения.

> Компонент `MaskField` не меняет значение, переданное в свойстве `value` или `defaultValue`, поэтому указывайте в качестве инициализированного значения то, которое может соответствовать маскированному значению на любой стадии ввода. Если вы допустите ошибку, вы увидете в консоле предупреждение о её наличии.

## Replacement

Свойство `replacment` устанавливает символы для замены в маске, где `key` - заменяемый символ, `value` - регулярное выражение, которому должен соответствовать вводимый символ. Вы можете установить один или несколько заменяемых символов с разными регулярными выражениями,

вот так:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  return (
    <MaskField
      mask="dd.mm.yyyy"
      replacement={{
        d: /\d/,
        m: /\d/,
        y: /\d/,
      }}
      showMask
      separate
    />
  );
}
```

Возможно передать символ замены в качестве строки, тогда будет разрешен ввод любых символов. Например `replacement="_"` тоже самое, что и `replacement={{ _: /./ }}`.

> Не используйте в качестве ключей `replacement` вводимые символы. Например если вы разрешаете ввод только чисел, учитывая что пользователь может ввести "9", тогда не стоит устанавливать для `replacement` значение `{ 9: /\d/ }`, потому что ключи игнорируются при вводе.

## Modify

Хук `modify` срабатывает перед маскированием и позволяет условно изменять свойства компонента, влияющие на маскирование. `modify` принимает объект, содержащий данные для модификации, включая `unmaskedValue` (значение без символов маски), `mask`, `replacement`, `showMask` и `separate`. Все эти свойства можно изменить.

Хук `modify` ожидает возврата объекта, аналогичного объекту в параметрах или `undefined`. Изменения будут применены только к тем свойствам, которые были возвращены, поэтому вы можете изменить любое свойство по своему усмотрению или не изменять какое-либо свойство, передав `undefined`.

Давайте рассмотрим возможную ситуацию, когда нам нужно изменить маску в зависимости от кода города телефона:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  // Модифицируем маску
  const modify = ({ unmaskedValue }) => {
    return {
      mask: unmaskedValue[0] === '7' ? '+_ (___) ___-__-__' : undefined,
    };
  };

  return <MaskField mask="+_ __________" replacement={{ _: /\d/ }} modify={modify} />;
}
```

Преимущество такого подхода в том, что вам не нужно хранить состояние компонента для изменения `props`, модификация происходит в уже запущенном процессе маскирования.

## Событие masking

Может быть полезно иметь под рукой дополнительные данные о значении или моментально получать новое значение при изменении `props`, для этого вы можете использовать событие `masking`, предоставляемое компонентом `MaskField`.

В отличии от события `change`, которое срабатывает только при вводе, событие `masking` срабатывает каждый раз при изменении значения, посредством ввода или при изменении `props`. Помимо этого, в объекте события `masking` присутствует свойство `detail`, которое содержит дополнительную информацию о значении:

| Name          |  Type   | Description                                                                                 |
| ------------- | :-----: | ------------------------------------------------------------------------------------------- |
| unmaskedValue | string  | Значение без учёта символов маски.                                                          |
| maskedValue   | string  | Маскированное значение (тоже, что и в `event.target.value`).                                |
| pattern       | string  | Регулярное выражение типа `string`, которому должно соответствовать маскированное значение. |
| isValid       | boolean | `true`, если маска заполнена полностью и соответствует значению паттерна.                   |

В остальном, вы можете использовать событие `masking` также, как и событие `change` для хранения состояния,

например:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [value, setValue] = React.useState('');
  const [detail, setDetail] = React.useState(null);

  const handleMasking = (event) => {
    setValue(event.target.value);
    setDetail(event.detail);
  };

  return (
    <MaskField mask="1yyy" replacement={{ y: /\d/ }} value={value} onMasking={handleMasking} />
  );
}
```

> Если вам понадобятся только числа из маскированного значения, свойство `event.detail.unmaskedValue` не будет содержать числа из маски, так как они являются символами маски. Так, в примере выше (`mask="1yyy"`), при вводе значения "991" значение в свойстве `event.detail.unmaskedValue` будет соответствовать вводимому значению "991", но не "1991".

## Интеграция с пользовательскими компонентами

Компонент `MaskField` упрощает интеграцию с пользовательскими компонентами, позволяя использовать собственные стилизованные компоненты. Для этого вам необходимо передать настраиваемый компонент методу `forwardRef`, предоставленному React. `forwardRef` позволяет вам автоматически передавать значение `ref` дочернему элементу ([подробнее о `forwardRef`](https://ru.reactjs.org/docs/forwarding-refs.html)).

Вот как это сделать:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

// Custom component
const CustomComponent = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Component with `MaskField`
export default function Example() {
  return <MaskField component={CustomComponent} mask="___-___" replacement="_" />;
}
```

## Интеграция с Material UI

Если вы используете [Material UI](https://mui.com/), вам необходимо создать компонент, который возвращает `MaskField` и передать его как значение свойству `inputComponent` компонента Material UI.

В этом случае компонент Material UI передаст вашему компоненту дополнительное свойство inputRef, которое вам нужно будет передать как значение для свойства `ref` элемента компонент MaskField.

Вот как это сделать:

```jsx
import React from 'react';
import TextField from '@material-ui/core/TextField';
import MaskField from 'react-mask-field';

// Component with `MaskField`
function CustomMaskField({ inputRef, ...otherProps }) {
  return <MaskField ref={inputRef} mask="___-___" replacement="_" {...otherProps} />;
}

// Component with Material UI
export default function Example() {
  return <TextField InputProps={{ inputComponent: CustomMaskField }} />;
}
```

## Использование с TypeScript

Пакет `react-mask-field` написан на TypeScript, поэтому вы имеете полную поддержку типов из-под коробки. Помимо этого, вы можете импортировать необходимые типы для своего использования.

## License

MIT © [Nikolay Goncharuk](https://github.com/GoncharukBro)
