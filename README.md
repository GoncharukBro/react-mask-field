# react-mask-field

The MaskField component allows you to apply a mask to the input field.

[![NPM](https://img.shields.io/npm/v/react-mask-field.svg)](https://www.npmjs.com/package/react-mask-field)

## Installation

```bash
npm i react-mask-field
```

## Unique properties

| Name      |   Type    | Default value | Описание Description                                                                                                                                                                                                                                            |
| --------- | :-------: | :-----------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| component | Component |   undefined   | Serves for the possibility of using custom components, for example, if you want to use your own styled component with the ability to mask the value (see the section "Integration with custom components").                                                     |
| mask \*   |  string   |               | The mask is in string format, uses `char` as the replacement character.                                                                                                                                                                                         |
| char \*   |  string   |               | The replacement character used in the mask (not taken into account when entering).                                                                                                                                                                              |
| set       |  RegExp   |   undefined   | Indicates which characters are allowed to be entered. For example, if you only want to allow numeric input, you can set `set` to `/[0-9]/` or `/\d/`, as shown in the examples above. If you don't set the `set` property, then any characters will be allowed. |
| showMask  |  boolean  |     false     | Controls the display of the mask. If `showMask === true` will display the full mask, for example `+7 (912) 3 __-__-__` instead of `+7 (912) 3`.                                                                                                                 |

> You can also pass all the properties available to the `input` element.

## Using

The package exports by default the MaskField component, which is a standard `input` element with input processing logic.

This is how you can easily implement any mask:

```jsx
import MaskField from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" char="_" />;
}
```

The component also supports controlled input:

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

Note that the `handleChange` event handler takes two `event` and `value` parameters instead of one. The thing is that sometimes, instead of just a masked value, it is convenient to have the value entered by the user, without taking into account the mask characters. You do not need to use the second parameter `value`, it only exists for convenience.

> For the mask to work correctly, it is recommended to put the value passed to the MaskField component either the value from event.target.value, or from the additional parameter value, as shown in the example above.

One of the key features of the MaskField component is that it relies only on user-entered characters, so you can safely include absolutely any characters in the mask without fear of the “unexpected behavior” of the component.

## More complex use

MaskField allows you to conditionally adapt the mask. Consider a possible situation where we need to change the mask depending on the phone city code:

```jsx
import { useState } from 'react';
import MaskField from 'react-mask-field';

export default function Example() {
  const [state, setState] = useState({ maskedValue: '', value: '' });

  const handleChange = (event, value) => {
    setState({ maskedValue: event.target.value, value });
  };

  const mask = data.value[0] === '7' ? '+_ (___) ___-__-__' : '+_ __________';

  return <MaskField mask={mask} char="_" set={/\d/} value={state.value} onChange={handleChange} />;
}
```

You can also modify the value itself. The easiest way to do this is with the value in the additional `value` parameter of the `onChange` event:

```jsx
const handleChange = (event, value) => {
  let newValue = value;

  if (newValue[0] === '8') {
    newValue = `7${newValue.slice(1)}`;
  }

  if (newValue[0] === '9') {
    newValue = `7${newValue}`;
  }

  setState({ maskedValue: event.target.value, value: newValue });
};
```

> Note that changing a value outside the control of the MaskField component may cause an incorrect display or incorrect value transmission. This point will definitely be taken into account in the next release, but for now, approach this decision with great caution.

## Integration with custom components

MaskField makes it easy to integrate custom components, allowing you to use your own styled components.

To do this, you need to pass the custom component to the `forwardRef` method provided by React. `forwardRef` allows you to automatically pass the `ref` value to the child element ([more about forwardRef](https://ru.reactjs.org/docs/forwarding-refs.html)).

Here's how to do it:

```jsx
import { useState, forwardRef } from 'react';
import MaskField from 'react-mask-field';

// Custom component
const CustomComponent = forwardRef((props, ref) => {
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
import { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import MaskField from 'react-mask-field';

// Component with MaskField
function TextFieldMask({ inputRef, ...other }) {
  return <MaskField {...other} ref={inputRef} mask="+7 (___) ___-__-__" char="_" set={/\d/} />;
}

// Component with Material UI
export default function Example() {
  return <TextField InputProps={{ inputComponent: TextFieldMask }} />;
}
```

## Usage with TypeScript

If you are using Material UI with TypeScript and want to get the value from the second optional parameter of the `onChange` event, you need to pass an event handler of type `any`.

Like this:

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

> This is a trade-off, as having the second parameter does not match the expected Material UI component type.

If you use TypeScript directly with the MaskField component itself, the `as any` specification is no longer required, since the MaskField itself expects a second optional parameter:

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
