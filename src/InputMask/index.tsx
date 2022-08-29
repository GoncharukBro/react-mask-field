import { forwardRef } from 'react';

import useMask from './useMask';

import type { MaskProps } from './types';

import useSetInputRef from '../useSetInputRef';

import type {
  ForwardedComponent,
  ForwardedComponentProps,
  PropsWithComponent,
  BaseComponent,
  BaseComponentProps,
} from '../types';

export type InputMaskProps<C extends ForwardedComponent = undefined, P = any> = BaseComponentProps<
  MaskProps,
  C,
  P
>;

function BaseInputMask<C extends ForwardedComponent<P> = undefined, P = any>(
  props: PropsWithComponent<MaskProps, C, P> & ForwardedComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function BaseInputMask(
  props: PropsWithComponent<MaskProps> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function BaseInputMask(
  {
    component: Component,
    mask,
    replacement,
    showMask,
    separate,
    modify,
    onMasking,
    ...props
  }: PropsWithComponent<MaskProps, ForwardedComponent> &
    React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputRef = useMask({ mask, replacement, showMask, separate, modify, onMasking });
  const setInputRef = useSetInputRef(inputRef, forwardedRef);

  if (Component) {
    return <Component ref={setInputRef} {...props} />;
  }

  return <input ref={setInputRef} {...props} />;
}

const InputMask = forwardRef(BaseInputMask) as BaseComponent<MaskProps>;

export default InputMask;
