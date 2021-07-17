# react-mask-field

The MaskField component allows you to apply a mask to the input field.

[![NPM](https://img.shields.io/npm/v/react-mask-field.svg)](https://www.npmjs.com/package/react-mask-field)

## Installation

```bash
npm i react-mask-field
```

## Unique properties

| Name      |   Type    | Описание Description                                                                                                                                                                                                                                      |
| --------- | :-------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component | Component | Serves for the possibility of using custom components, for example, if you want to use your own styled component with the ability to mask the value (see the section "Integration with custom components").                                               |
| mask \*   |  string   | The mask is in string format, uses `char` as the replacement character.                                                                                                                                                                                   |
| char \*   |  string   | The replacement character used in the mask (not taken into account when entering).                                                                                                                                                                        |
| set       |  RegExp   | Indicates which characters are allowed to be entered. For example, if you only want to allow numeric input, you can set `set` to `/[0-9]/` or `/\d/`, as shown in the examples. If you don't set the `set` property, then any characters will be allowed. |
| showMask  |  boolean  | Controls the display of the mask. If `showMask === true` will display the full mask, for example `+7 (912) 3 __-__-__` instead of `+7 (912) 3`.                                                                                                           |
| modify    | Function  | The modifier function allows you to change the properties of the component: `value` (value entered by the user), `mask`, `char`, `set`, `showMask`. Useful when you need to conditionally adjust the displayed value to improve UX.                       |

> You can also pass all the properties available to the `input` element.

## Using

The package exports by default the MaskField component, which is a standard `input` element with input processing logic.

This is how you can easily implement any mask:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" char="_" />;
}
```

The component also supports controlled input:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <MaskField
      mask="+7 (___) ___-__-__"
      char="_"
      set={/\d/}
      value={value}
      onChange={handleChange}
    />
  );
}
```

One of the key features of the MaskField component is that it relies only on user-entered characters, so you can safely include absolutely any characters in the mask without fear of the “unexpected behavior” of the component.

## Custom value

It can be useful to have on hand the value entered by the user without taking into account the mask characters. For such cases, a second optional parameter was provided in the `onChange` event handler, which stores just such a value.

For example:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [state, setState] = React.useState({ maskedValue: '', value: '' });

  const handleChange = (event, value) => {
    setState({
      maskedValue: event.target.value, // '+7 (000) 000-00-00'
      value, // '0000000000'
    });
  };

  return (
    <MaskField
      mask="+7 (___) ___-__-__"
      char="_"
      set={/\d/}
      value={state.maskedValue}
      onChange={handleChange}
    />
  );
}
```

Note that `"7"` is present in the masked value, but not in the custom value. This is the correct behavior, as the `"7"` refers to mask characters. Thus, you always have a masked meaning on hand and a meaning without taking into account the mask symbols.

> Make sure you pass the `value` property of the MaskField component a masked value, not a character-insensitive value, otherwise it will render incorrectly.

## Value modification

You can pass a `modify` function, which allows you to conditionally change the value and other properties of a component. `modify` accepts an object containing data for easy modification, including `value` (the value entered by the user), `mask`, `char`, `set` and `showMask`. All of these properties can be changed. The `modify` function expects to return an object similar to the object in the parameters (`modifyData`, see example below) or `undefined`. Changes will be applied only to those properties that were returned, so you can change any property as needed or not change any property by passing `undefined`. The values ​​returned by the `modify` function take precedence over the values ​​in the properties of the MaskField component.

Consider a possible situation where we need to change the mask depending on the phone city code:

```jsx
import React from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const ruPhoneMask = '+_ (___) ___-__-__';
  const otherPhoneMask = '+_ __________';

  const modify = (modifyData) => {
    const newMask = modifyData.value[0] === '7' ? ruPhoneMask : otherPhoneMask;

    return { mask: newMask };
  };

  return <MaskField mask={ruPhoneMask} char="_" set={/\d/} value={value} onChange={handleChange} />;
}
```

> Note that the `value` property in the `modifyData` parameter stores the value entered by the user, not the masked value, since the value is modified before the mask is applied.

Or correct the value entered by the user:

```jsx
const ruPhoneMask = '+_ (___) ___-__-__';
const otherPhoneMask = '+_ __________';

const modify = (modifyData) => {
  let newValue = modifyData.value;

  if (modifyData.value[0] === '8') {
    newValue = `7${modifyData.value.slice(1)}`;
  }

  if (modifyData.value[0] === '9') {
    newValue = `7${modifyData.value}`;
  }

  const newMask = newValue[0] === '7' ? ruPhoneMask : otherPhoneMask;

  return { value: newValue, mask: newMask };
};
```

> Note that changing a value outside the control of the MaskField component may cause an incorrect display or incorrect value transmission.

## Integration with custom components

MaskField makes it easy to integrate custom components, allowing you to use your own styled components.

To do this, you need to pass the custom component to the `forwardRef` method provided by React. `forwardRef` allows you to automatically pass the `ref` value to the child element ([more about forwardRef](https://ru.reactjs.org/docs/forwarding-refs.html)).

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
  return <MaskField component={CustomComponent} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}
```

## Integration with Material UI components

If you are using Material UI, you need to create a component that returns a MaskField and pass it as the `inputComponent` property of the Material UI component.

In this case, the Material UI component will pass to your component all the properties available to the `input` element, as well as an additional `inputRef` property, which you will need to pass as a value for the `ref` property of the MaskField component.

Here's how to do it:

```jsx
import React from 'react';
import TextField from '@material-ui/core/TextField';
import MaskField from 'react-mask-field';

// Component with MaskField
function CustomMaskField({ inputRef, ...other }) {
  return <MaskField {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}

// Component with Material UI
export default function Example() {
  return <TextField InputProps={{ inputComponent: CustomMaskField }} />;
}
```

## Usage with TypeScript

If you are using Material UI with TypeScript and want to get the value from the second optional parameter of the `onChange` event, you need to pass an event handler of type `any`.

Like this:

```tsx
export default function Example() {
  const [state, setState] = React.useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setState({ maskedValue: event.target.value, value });
  };

  return (
    <TextField
      InputProps={{ inputComponent: CustomMaskField }}
      value={state.maskedValue}
      onChange={handleChange as any}
    />
  );
}
```

This is a trade-off, as having the second parameter does not match the expected Material UI component type. If you are using Material UI with TypeScript, and do not want to get the value from the second optional parameter of the `onChange` event, you do not need to cast to the `any` type.

If you use TypeScript directly with the MaskField component itself, the `as any` specification is no longer required, since the MaskField itself expects a second optional parameter:

```tsx
export default function Example() {
  const [state, setState] = React.useState({ maskedValue: '', value: '' });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    setState({ maskedValue: event.target.value, value });
  };

  return (
    <MaskField
      mask="+7 (___) ___-__-__"
      char="_"
      set={/\d/}
      value={state.maskedValue}
      onChange={handleChange}
    />
  );
}
```

To type the parameter of a `modify` function, you can import the `ModifyData` type as a named import.

For example:

```tsx
import React from 'react';
import MaskField, { ModifyData } from 'react-mask-field';

const modify = (modifyData: ModifyData) => {
  // ...
};
```

If for some reason you need to use the MaskField component property type, you can also import it as a named import:

```tsx
import MaskField, { MaskFieldProps, ModifyData } from 'react-mask-field';
```

## License

MIT © [Nikolay Goncharuk](https://github.com/GoncharukBro)
