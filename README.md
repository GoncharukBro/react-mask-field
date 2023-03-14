# react-mask-field

The MaskField component allows you to apply a mask to the input field.

![npm](https://img.shields.io/npm/dt/react-mask-field?style=flat-square)
![npm](https://img.shields.io/npm/v/react-mask-field?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/min/react-mask-field?style=flat-square)

> ⚠️ **Warning**! This package is no longer supported. Use the new [`@react-input/mask`](https://www.npmjs.com/package/@react-input/mask) package instead. Please read the documentation carefully before upgrading to a new package, as the package API has changed. In addition, you can use the new number formatting package [`@react-input/number-format`](https://www.npmjs.com/package/@react-input/number-format).

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
| component   |    Component     |         | **Not used in the useMask hook**. Serves to enable the use of custom components, for example, if you want to use your own styled component with the ability to mask the value (see «Integration with custom components»).                                                                                                                                                              |
| mask        |      string      |   ""    | Input mask, `replacement` is used to replace characters.                                                                                                                                                                                                                                                                                                                               |
| replacement | string \| object |   {}    | Sets the characters replaced in the mask, where `key` is the replaced character, `value` is the regular expression to which the input character must match (see «Replacement»). It is possible to pass the replacement character as a string, then `replacement="_"` will default to `replacement={{ _: /./ }}`. Keys are ignored as you type.                                         |
| showMask    |     boolean      |  false  | Controls the display of the mask, for example, `+7 (912) ___-__-__` instead of `+7 (912`.                                                                                                                                                                                                                                                                                              |
| separate    |     boolean      |  false  | Stores the position of the entered characters. By default, input characters are non-breaking, which means that if you remove characters in the middle of the value, the characters are shifted to the left, forming a non-breaking value, which is the behavior of `input`. For example, with `true`, the possible value is `+7 (912) ___-67-__`, with `false` - `+7 (912) 67_-__-__`. |
| modify      |     function     |         | Function triggered before masking. Allows you conditionally change the properties of the component that affect masking. Valid values ​​for modification are `unmaskedValue` (value without mask characters), `mask`, `replacement`, `showMask` and `separate`. This is useful when you need conditionally tweak the displayed value to improve UX (see «Modify»).                      |
| onMasking   |     function     |         | Handler for the custom event `masking`. Unlike the `change` event, which fires only on input, the `masking` event fires when masking, for example, if `props` have changed and stores additional data about the masked value (see «Masking event»).                                                                                                                                    |

> You can also pass other properties available element `input` default or your own components, when integrated across the property `component`.

## Usage

The `react-mask-field` package provides two options for using a mask. The first is the `MaskField` component, which is a standard input element with additional logic to handle the input. The second is using the `useMask` hook, which needs to be linked to the `input` element through the `ref` property.

One of the key features of the `react-mask-field` package is that it only relies on user-supplied characters, so you can safely include any character in the mask without fear of the «unexpected behavior».

Let's see how you can easily implement a mask for entering a phone number using the `MaskField` component:

```jsx
import React from 'react';
import { MaskField } from 'react-mask-field';

export default function Example() {
  return <MaskField mask="+7 (___) ___-__-__" replacement={{ _: /\d/ }} />;
}
```

You can work with the `MaskField` component in the same way as with the `input` element, with the difference that the `MaskField` component uses additional logic to process the value.

Now the same thing, but using the `useMask` hook:

```jsx
import React from 'react';
import { useMask } from 'react-mask-field';

export default function Example() {
  const ref = useMask({ mask: '+7 (___) ___-__-__', replacement: { _: /\d/ } });

  return <input ref={ref} />;
}
```

The `useMask` hook takes the same properties as the `MaskField` component, except for the `component` properties. Both approaches are equivalent, but the use of the `MaskField` component provides additional capabilities, which will be discussed in the section «Integration with custom components».

> The `MaskField` component does not change the value passed in the `value` or `defaultValue` property, so specify as the initialized value one that can match the masked value at any stage of input. If you make a mistake, you will see a warning about it in the console.

## Replacement

The `replacement` property sets the characters to be replaced in the mask, where `key` is the replaced character, `value` is the regular expression to which the input character must match. You can set one or more replaceable characters with different regexps,

like this:

```jsx
import React from 'react';
import { MaskField } from 'react-mask-field';

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
import { MaskField } from 'react-mask-field';

export default function Example() {
  const modify = ({ unmaskedValue }) => {
    const newMask = unmaskedValue[0] === '7' ? '+_ (___) ___-__-__' : undefined;
    return { mask: newMask };
  };

  return <MaskField mask="+_ __________" replacement={{ _: /\d/ }} modify={modify} />;
}
```

The advantage of this approach is that you do not need to store the state of the component to change the `props`, the modification happens in the already running masking process.

## Masking event

It can be useful to have additional data about the value at hand or to instantly get a new value when `props` changes, for this you can use the `masking` event.

The `masking` event is fired asynchronously after the` change` event, in addition, the `masking` event object has a` detail` property that contains additional information about the value:

| Name          |  Type   | Description                                                             |
| ------------- | :-----: | ----------------------------------------------------------------------- |
| unmaskedValue | string  | Value without mask symbols.                                             |
| maskedValue   | string  | Masked value (same as `event.target.value`).                            |
| pattern       | string  | A regular expression of type `string` that the masked value must match. |
| isValid       | boolean | `true` if the mask is full and matches the pattern value.               |

Unlike the `change` event, which fires only on input, the `masking` event fires every time a value changes, through input, or when `props` changes.

> You can use both the `masking` event and the` change` event to save the state, however if you do not need additional parameters in the `detail` property, prefer the` change` event, otherwise it is recommended to use only the `masking` event as it is called asynchronously after the `change` event finishes, which may entail additional rendering of the component.

An example of using the `masking` event:

```jsx
import React from 'react';
import { MaskField } from 'react-mask-field';

export default function Example() {
  const [detail, setDetail] = React.useState(null);

  const handleMasking = (event) => {
    setDetail(event.detail);
  };

  return (
    <MaskField
      mask="1yyy"
      replacement={{ y: /\d/ }}
      value={detail?.maskedValue}
      onMasking={handleMasking}
    />
  );
}
```

> If you only want the numbers from the masked value, the `event.detail.unmaskedValue` property will not contain the numbers from the mask, since they are mask characters. So, in the example above (`mask="1yyy"`), if you enter the value "991", the value in the property `event.detail.unmaskedValue` will match the entered value "991", but not "1991".

## Integration with custom components

The `MaskField` component makes it easy to integrate with custom components allowing you to use your own styled components. To do this, you need to pass the custom component to the `forwardRef` method provided by React. `forwardRef` allows you automatically pass a `ref` value to a child element ([more on `forwardRef`](https://reactjs.org/docs/forwarding-refs.html)).

Then place your own component in the `component` property. The value for the `component` property can be either function components or class components.

With this approach, the `MaskField` component acts as a HOC, adding additional logic to the `input` element.

Here's how to do it:

```jsx
import React from 'react';
import { MaskField } from 'react-mask-field';

// Custom component
const CustomComponent = React.forwardRef(({ label }, ref) => {
  return (
    <>
      <label htmlFor="custom-component">{label}</label>
      <input ref={ref} id="custom-component" />
    </>
  );
});

// Component with MaskField
export default function Example() {
  return (
    <MaskField
      component={CustomComponent}
      mask="___-___"
      replacement="_"
      label="Label for custom component"
    />
  );
}
```

> The `MaskField` component will not forward properties available only to the `MaskField`, so as not to break the logic of your own component.

## Integration with Material UI

If you are using [Material UI](https://mui.com/), you need to create a component that returns a `MaskField` and pass it as a value to the `inputComponent` property of the Material UI component.

In this case, the Material UI component will pass an additional inputRef property to your component, which you will need to pass as the value for the `ref` property of the element of the MaskField component.

Here's how to do it:

```jsx
import React from 'react';
import { TextField } from '@material-ui/core';
import { MaskField } from 'react-mask-field';

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
import { MaskField } from 'react-mask-field';
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

### Property type support

Since the `MaskField` component supports two use cases (as an `input` element and as an HOC for your own component), `MaskField` takes both use cases into account to support property types.

By default, the `MaskField` component is an `input` element and supports all the attributes supported by the `input` element. But if the `component` property was passed, the `MaskField` will only support those properties that are available to the integrated component. This approach allows you to integrate your own component as conveniently as possible, not forcing you to rewrite its logic, but using a mask where necessary.

```tsx
import React from 'react';
import { MaskField } from 'react-mask-field';
import type { MaskFieldProps } from 'react-mask-field';

export default function Example() {
  // Here, since no `component` property was passed,
  // `MaskField` returns an `input` element and takes the type:
  // `MaskFieldProps & React.InputHTMLAttributes<HTMLInputElement>`
  return <MaskField mask="___-___" replacement="_" />;
}
```

```tsx
import React from 'react';
import { MaskField } from 'react-mask-field';
import type { MaskFieldProps } from 'react-mask-field';

import { CustomComponent } from './CustomComponent';
import type { CustomComponentProps } from './CustomComponent';

export default function Example() {
  // Here, since the `component` property was passed,
  // `MaskField` returns the integrated component and takes the type:
  // `MaskFieldProps<typeof CustomComponent> & CustomComponentProps`
  return <MaskField component={CustomComponent} mask="___-___" replacement="_" />;
}
```

You may run into a situation where you need to pass rest parameters (`...rest`) to the `MaskField` component. If `rest` is of type `any`, the `component` property will not be typed correctly, as well as the properties of the component being integrated. this is typical TypeScript behavior for dynamic type inference.

To remedy this situation and help the `MaskField` type correctly the properties of your component, you can pass the type of your component directly to the `MaskField` component.

```tsx
import React from 'react';
import { MaskField } from 'react-mask-field';
import { CustomComponent } from './CustomComponent';

export default function Example(props: any) {
  return (
    <MaskField<typeof CustomComponent>
      component={CustomComponent}
      mask="___-___"
      replacement="_"
      {...props}
    />
  );
}
```

## Feedback

If you find a bug or want to make a suggestion for improving the package, [open the issues on GitHub](https://github.com/GoncharukBro/react-mask-field/issues) or email [goncharuk.bro@gmail.com](mailto:goncharuk.bro@gmail.com).

Support the project with a star ⭐ on [GitHub](https://github.com/GoncharukBro/react-mask-field).

## License

MIT © [Nikolay Goncharuk](https://github.com/GoncharukBro)
