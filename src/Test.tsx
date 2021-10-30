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

interface Props {
  mask?: string;
}

interface PropsWithComponent<C extends Component = undefined> extends Props {
  component?: C;
}

export type MaskFieldProps<C extends Component = undefined> = PropsWithComponent<C> &
  (C extends undefined ? React.InputHTMLAttributes<HTMLInputElement> : ComponentProps<C>);

function MaskFieldComponent<C extends Component = undefined>(
  props: Props & { component: C } & ComponentProps<C>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent(
  props: Props & React.InputHTMLAttributes<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent({
  component: CustomComponent,
  mask: maskProps,
  ...otherProps
}: PropsWithComponent<Component> & React.InputHTMLAttributes<HTMLInputElement>): JSX.Element {
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
