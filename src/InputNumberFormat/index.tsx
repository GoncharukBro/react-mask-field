import { forwardRef } from 'react';

import useNumberFormat from './useNumberFormat';

import type { NumberFormatProps } from './types';

import useConnectedRef from '../useConnectedRef';

import type {
  ForwardedComponent,
  ForwardedComponentProps,
  PropsWithComponent,
  BaseComponent,
  BaseComponentProps,
} from '../types';

export type InputNumberFormatProps<
  C extends ForwardedComponent = undefined,
  P = any
> = BaseComponentProps<NumberFormatProps, C, P>;

function BaseInputNumberFormat<C extends ForwardedComponent<P> = undefined, P = any>(
  props: PropsWithComponent<NumberFormatProps, C, P> & ForwardedComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function BaseInputNumberFormat(
  props: PropsWithComponent<NumberFormatProps> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function BaseInputNumberFormat(
  {
    component: Component,
    locales,
    options,
    onFormat,
    ...props
  }: PropsWithComponent<NumberFormatProps, ForwardedComponent> &
    React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputRef = useNumberFormat({ locales, options, onFormat });

  const connectedRef = useConnectedRef(inputRef, forwardedRef);

  if (Component) {
    return <Component ref={connectedRef} {...props} />;
  }

  return <input ref={connectedRef} {...props} />;
}

const InputNumberFormat = forwardRef(BaseInputNumberFormat) as BaseComponent<NumberFormatProps>;

export default InputNumberFormat;
