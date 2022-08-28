import { useCallback, forwardRef } from 'react';

import useNumberFormat from './useNumberFormat';

interface A {
  locales?: string | string[];
  options: Intl.NumberFormatOptions;
}

type Component<P = any> = React.ComponentClass<P> | React.FunctionComponent<P> | undefined;

type ComponentProps<C extends Component = undefined, P = any> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : {};

interface PropsWithComponent<C extends Component<P> = undefined, P = any> extends A {
  component?: C;
}

export type InputNumberFormatProps<C extends Component = undefined, P = any> = PropsWithComponent<
  C,
  P
> &
  (C extends undefined ? React.InputHTMLAttributes<HTMLInputElement> : ComponentProps<C, P>);

function InputNumberFormatComponent<C extends Component<P> = undefined, P = any>(
  props: PropsWithComponent<C, P> & ComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputNumberFormatComponent(
  props: PropsWithComponent & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function InputNumberFormatComponent(
  {
    component: CustomComponent,
    locales,
    options,
    ...props
  }: PropsWithComponent<Component, any> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputRef = useNumberFormat(locales, options);

  const setInputRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputRef.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (typeof forwardedRef === 'object' && forwardedRef !== null) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = ref;
      }
    },
    [forwardedRef, inputRef]
  );

  if (CustomComponent) {
    return <CustomComponent ref={setInputRef} {...props} />;
  }

  return <input ref={setInputRef} {...props} />;
}

const InputNumberFormat = forwardRef(InputNumberFormatComponent) as {
  <C extends Component<P> = undefined, P = any>(
    props: PropsWithComponent<C, P> & ComponentProps<C, P> & React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
  (
    props: PropsWithComponent &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
};

export default InputNumberFormat;
