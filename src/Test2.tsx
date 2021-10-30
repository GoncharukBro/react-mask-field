import React from 'react';

interface MyComponentProps {
  label?: string;
}

function MyComponentFunction({ label }: MyComponentProps) {
  return <input />;
}

// eslint-disable-next-line react/prefer-stateless-function
class MyComponentClass extends React.Component<MyComponentProps> {
  render() {
    return <input />;
  }
}

type Component<P = any> = React.ComponentClass<P> | React.FunctionComponent<P> | undefined;

type ComponentProps<C extends Component = undefined, P = any> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : never;

type AddProps<C extends Component = undefined> = C extends undefined
  ? React.InputHTMLAttributes<HTMLInputElement>
  : ComponentProps<C>;

type Props<C extends Component = undefined> = {
  component?: C;
  mask?: string;
} & AddProps<C>;

const props: Props = {};
console.log(props);

function MaskFieldComponent<C extends Component = undefined>({
  component: CustomComponent,
  mask: maskProps,
  ...otherProps
}: Props<C>): JSX.Element {
  if (CustomComponent) return <CustomComponent {...otherProps} />;
  return <input {...otherProps} />;
}

<MaskFieldComponent mask="" />;
<MaskFieldComponent mask="" jfjf="" />;

<MaskFieldComponent mask="" component={MyComponentFunction} label="" />;
<MaskFieldComponent mask="" component={MyComponentClass} label="" />;

<MaskFieldComponent mask="" component={MyComponentFunction} label="" value="" />;
<MaskFieldComponent mask="" component={MyComponentClass} label="" value="" />;

<MaskFieldComponent mask="" component={{}} />;

<MaskFieldComponent<typeof MyComponentClass> mask="" component={MyComponentClass} />;
<MaskFieldComponent<typeof MyComponentClass> mask="" component={MyComponentFunction} />;

<MaskFieldComponent<typeof MyComponentClass> mask="" component={{}} />;

<MaskFieldComponent mask="" value="" onChange={(event) => {}} />;

export default MaskFieldComponent;
