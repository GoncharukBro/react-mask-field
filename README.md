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
yarn add react-mask-field
```

## Unique properties

| Name        |       Type       | Default | Description                                                                                                                                                                                                                                                                                                                                                                            |
| ----------- | :--------------: | :-----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component   |    Component     |         | Serves to enable the use of custom components, for example, if you want to use your own styled component with the ability to mask the value (see «Integration with custom components»).                                                                                                                                                                                                |
| mask        |      string      |   ""    | Input mask, `replacement` is used to replace characters.                                                                                                                                                                                                                                                                                                                               |
| replacement | string \| object |   {}    | Sets the characters replaced in the mask, where `key` is the replaced character, `value` is the regular expression to which the input character must match (see «Replacement»). It is possible to pass the replacement character as a string, then `replacement="_"` will default to `replacement={{ _: /./ }}`. Keys are ignored as you type.                                         |
| showMask    |     boolean      |  false  | Controls the display of the mask, for example, `+7 (912) ___-__-__` instead of `+7 (912`.                                                                                                                                                                                                                                                                                              |
| separate    |     boolean      |  false  | Stores the position of the entered characters. By default, input characters are non-breaking, which means that if you remove characters in the middle of the value, the characters are shifted to the left, forming a non-breaking value, which is the behavior of `input`. For example, with `true`, the possible value is `+7 (912) ___-67-__`, with `false` - `+7 (912) 67_-__-__`. |
| modify      |     function     |         | Function triggered before masking. Allows you conditionally change the properties of the component that affect masking. Valid values ​​for modification are `unmaskedValue` (value without mask characters), `mask`, `replacement`, `showMask` and `separate`. This is useful when you need conditionally tweak the displayed value to improve UX (see «Modify»).                      |
| onMasking   |     function     |         | Handler for the custom event `masking`. Unlike the `change` event, which fires only on input, the `masking` event fires when masking, for example, if `props` have changed (see «Masking event»).                                                                                                                                                                                      |

> You can also pass other properties available to the `input` element by default.

## Usage

The default exported `MaskField` component is a standard `input` element with additional input handling logic.

For example, here's how you can easily implement a mask for entering a phone number:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" replacement={{ _: /\d/ }} />;
}
```

One of the key features of the `MaskField` component is that it only relies on user-supplied characters, so you can safely include any character in the mask without fear of the component's «unexpected behavior».

You can work with the `MaskField` component in the same way as with the `input` element, with the difference that the `MaskField` component uses additional logic to process the value.

> The `MaskField` component does not change the value passed in the `value` or `defaultValue` property, so specify as the initialized value one that can match the masked value at any stage of input. If you make a mistake, you will see a warning about it in the console.

## Replacement

The `replacement` property sets the characters to be replaced in the mask, where `key` is the replaced character, `value` is the regular expression to which the input character must match. You can set one or more replaceable characters with different regexps,

like this:

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

It is possible to pass the replacement character as a string, then any characters will be allowed. For example, `replacement="_"` is the same as `replacement={{ _: /./ }}`.

> Do not use entered characters as `replacement` keys. For example, if you only allow numbers to be entered, given that the user can enter "9", then you should not set `replacement` to `{ 9: /\d/ }`, because keys are ignored when typing.

## Modify

The `modify` function is triggered before masking and allows you conditionally change the properties of the component that affect the masking. `modify` accepts an object containing data to modify, including `unmaskedValue` (value without mask characters), `mask`, `replacement`, `showMask` and `separate`. All of these properties can be changed.

The `modify` function expects to return an object similar to the object in the parameters or `undefined`. Changes will be only applied to those properties that were returned, so you can change any property as you like, or not change any property by passing `undefined`.

Let's consider a possible situation when we need to change the mask depending on the phone city code:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  // Modify the mask
  const modify = ({ unmaskedValue }) => {
    return {
      mask: unmaskedValue[0] === '7' ? '+_ (___) ___-__-__' : undefined,
    };
  };

  return <MaskField mask="+_ __________" replacement={{ _: /\d/ }} modify={modify} />;
}
```

The advantage of this approach is that you do not need to store the state of the component to change the `props`, the modification happens in the already running masking process.

## Masking event

It can be useful to have additional data about the value at hand or to instantly get a new value when `props` changes, for this you can use the `masking` event provided by the `MaskField` component.

Unlike the `change` event, which fires only on input, the `masking` event fires every time a value changes, through input, or when `props` changes. In addition, the `masking` event object has a `detail` property that contains additional information about the value:

| Name          |  Type   | Description                                                             |
| ------------- | :-----: | ----------------------------------------------------------------------- |
| unmaskedValue | string  | Value without mask symbols.                                             |
| maskedValue   | string  | Masked value (same as `event.target.value`).                            |
| pattern       | string  | A regular expression of type `string` that the masked value must match. |
| isValid       | boolean | `true` if the mask is full and matches the pattern value.               |

Otherwise, you can use the `masking` event as well as the `change` event to store the state,

for example:

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

> If you only want the numbers from the masked value, the `event.detail.unmaskedValue` property will not contain the numbers from the mask, since they are mask characters. So, in the example above (`mask="1yyy"`), if you enter the value "991", the value in the property `event.detail.unmaskedValue` will match the entered value "991", but not "1991".

## Integration with custom components

The `MaskField` component makes it easy to integrate with custom components allowing you to use your own styled components. To do this, you need to pass the custom component to the `forwardRef` method provided by React. `forwardRef` allows you automatically pass a `ref` value to a child element ([more on `forwardRef`](https://reactjs.org/docs/forwarding-refs.html)).

Here's how to do it:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

// Custom component
const CustomComponent = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Component with MaskField
export default function Example() {
  return <MaskField component={CustomComponent} mask="___-___" replacement="_" />;
}
```

## Integration with Material UI

If you are using [Material UI](https://mui.com/), you need to create a component that returns a `MaskField` and pass it as a value to the `inputComponent` property of the Material UI component.

In this case, the Material UI component will pass an additional inputRef property to your component, which you will need to pass as the value for the `ref` property of the element of the MaskField component.

Here's how to do it:

```jsx
import React from 'react';
import TextField from '@material-ui/core/TextField';
import MaskField from 'react-mask-field';

// Component with MaskField
function CustomMaskField({ inputRef, ...otherProps }) {
  return <MaskField ref={inputRef} mask="___-___" replacement="_" {...otherProps} />;
}

// Component with Material UI
export default function Example() {
  return <TextField InputProps={{ inputComponent: CustomMaskField }} />;
}
```

## Usage with TypeScript

The `react-mask-field` package is written in TypeScript, so you have full type support out of the box. In addition, you can import the types you need for your use:

```tsx
import React from 'react';
import MaskField from 'react-mask-field';
import type {
  Detail,
  MaskingEvent,
  MaskingEventHandler,
  ModifiedData,
  Modify,
} from 'react-mask-field';

export default function Example() {
  const [detail, setDetail] = React.useState<Detail | null>(null);

  // Or `event: MaskingEvent`
  const handleMasking: MaskingEventHandler = (event) => {
    setDetail(event.detail);
  };

  // Or `data: ModifiedData`
  const modify: Modify = (data) => {
    return data;
  };

  return <MaskField mask="___-___" replacement="_" modify={modify} onMasking={handleMasking} />;
}
```

## License

MIT © [Nikolay Goncharuk](https://github.com/GoncharukBro)
