export interface InputElement extends HTMLInputElement {
  _wrapperState?: {
    controlled?: boolean;
    initialValue?: string;
  };
  _valueTracker?: {
    getValue?: () => string;
    setValue?: (value: string) => void;
  };
}

export type ForwardedComponent<P = any> =
  | React.ComponentClass<P>
  | React.FunctionComponent<P>
  | undefined;

export type ForwardedComponentProps<
  C extends ForwardedComponent = undefined,
  P = any
> = C extends React.ComponentClass<P>
  ? ConstructorParameters<C>[0] | {}
  : C extends React.FunctionComponent<P>
  ? Parameters<C>[0] | {}
  : {};

export type PropsWithComponent<
  O extends object,
  C extends ForwardedComponent<P> = undefined,
  P = any
> = O & {
  component?: C;
};

export interface BaseComponent<O extends object> {
  <C extends ForwardedComponent<P> = undefined, P = any>(
    props: PropsWithComponent<O, C, P> &
      ForwardedComponentProps<C, P> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
  (
    props: PropsWithComponent<O> &
      React.InputHTMLAttributes<HTMLInputElement> &
      React.RefAttributes<HTMLInputElement>
  ): JSX.Element;
}

export type BaseComponentProps<
  O extends object,
  C extends ForwardedComponent = undefined,
  P = any
> = PropsWithComponent<O, C, P> &
  (C extends undefined
    ? React.InputHTMLAttributes<HTMLInputElement>
    : ForwardedComponentProps<C, P>);

export interface CustomInputEvent<D = any> extends CustomEvent<D> {
  target: EventTarget & HTMLInputElement;
}

export type CustomInputEventHandler<D = any> = (event: CustomInputEvent<D>) => void;

export type InputType = 'initial' | 'insert' | 'deleteBackward' | 'deleteForward';

interface MethodReturn {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface CustomInputEventDetail<D> {
  customInputEventDetail?: D;
}

export type Init = (params: { controlled: boolean; initialValue: string }) => MethodReturn;

export type Update<D = any> = () => (MethodReturn & CustomInputEventDetail<D>) | undefined;

export type Tracking<D = any> = (params: {
  inputType: InputType;
  added: string;
  deleted: string;
  previousValue: string;
  selectionStartRange: number;
  selectionEndRange: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
}) => MethodReturn & CustomInputEventDetail<D>;

export type Fallback = (params: {
  inputType: InputType;
  previousValue: string;
  selectionStart: number;
  selectionEnd: number;
}) => MethodReturn;
