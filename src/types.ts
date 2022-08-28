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

export type Init = (params: { controlled: boolean; initialValue: string }) => MethodReturn;

export type Update<D> = () => (MethodReturn & { customInputEventDetail: D }) | undefined;

export type Tracking<D> = (params: {
  inputType: InputType;
  added: string;
  deleted: string;
  previousValue: string;
  selectionRangeStart: number;
  selectionRangeEnd: number;
  value: string;
  selectionStart: number;
  selectionEnd: number;
}) => MethodReturn & { customInputEventDetail: D };

export type Fallback = (params: {
  previousValue: string;
  selectionStart: number;
  selectionEnd: number;
}) => MethodReturn;
