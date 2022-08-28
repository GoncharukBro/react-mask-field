import { forwardRef } from 'react';

import useMask from './useMask';

import type { MaskProps } from './types';

import useSetInputRef from '../useSetInputRef';

type Component<P = any> = React.ComponentClass<P> | React.FunctionComponent<P> | undefined;

type ComponentProps<C extends Component = undefined, P = any> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : {};

interface PropsWithComponent<C extends Component<P> = undefined, P = any> extends MaskProps {
  component?: C;
}

export type InputMaskProps<C extends Component = undefined, P = any> = PropsWithComponent<C, P> &
  (C extends undefined ? React.InputHTMLAttributes<HTMLInputElement> : ComponentProps<C, P>);

function InputMaskComponent<C extends Component<P> = undefined, P = any>(
  props: PropsWithComponent<C, P> & ComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputMaskComponent(
  props: PropsWithComponent & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputMaskComponent(
  {
    component: CustomComponent,
    mask,
    replacement,
    showMask,
    separate,
    modify,
    onMasking,
    ...props
  }: PropsWithComponent<Component, any> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputRef = useMask({ mask, replacement, showMask, separate, modify, onMasking });
  const setInputRef = useSetInputRef(inputRef, forwardedRef);

  if (CustomComponent) {
    return <CustomComponent ref={setInputRef} {...props} />;
  }

  return <input ref={setInputRef} {...props} />;
}

const InputMask = forwardRef(InputMaskComponent) as {
  <C extends Component<P> = undefined, P = any>(
    props: PropsWithComponent<C, P> & ComponentProps<C, P> & React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
  (
    props: PropsWithComponent &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
};

export default InputMask;
