import { useCallback, forwardRef } from 'react';
import useMask from './useMask';
import type { MaskProps } from './types';

type Component<P = any> = React.ComponentClass<P> | React.FunctionComponent<P> | undefined;

type ComponentProps<C extends Component = undefined, P = any> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : {};

interface PropsWithComponent<C extends Component<P> = undefined, P = any> extends MaskProps {
  component?: C;
}

export type MaskFieldProps<C extends Component = undefined, P = any> = PropsWithComponent<C, P> &
  (C extends undefined ? React.InputHTMLAttributes<HTMLInputElement> : ComponentProps<C, P>);

function MaskFieldComponent<C extends Component<P> = undefined, P = any>(
  props: PropsWithComponent<C, P> & ComponentProps<C, P>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent(
  props: PropsWithComponent & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element;
// eslint-disable-next-line no-redeclare
function MaskFieldComponent(
  {
    component: CustomComponent,
    mask,
    replacement,
    showMask,
    separate,
    modify,
    onMasking,
    ...otherProps
  }: PropsWithComponent<Component, any> & React.InputHTMLAttributes<HTMLInputElement>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
): JSX.Element {
  const inputElement = useMask({ mask, replacement, showMask, separate, modify, onMasking });

  const setRef = useCallback(
    (ref: HTMLInputElement | null) => {
      inputElement.current = ref;
      // Добавляем ссылку на элемент для родительских компонентов
      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (typeof forwardedRef === 'object' && forwardedRef !== null) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = ref;
      }
    },
    [forwardedRef, inputElement]
  );

  if (CustomComponent) {
    return <CustomComponent ref={setRef} {...otherProps} />;
  }

  return <input ref={setRef} {...otherProps} />;
}

const MaskField = forwardRef(MaskFieldComponent) as {
  <C extends Component<P> = undefined, P = any>(
    props: PropsWithComponent<C, P> & ComponentProps<C, P> & React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
  (
    props: PropsWithComponent &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
};

export default MaskField;
