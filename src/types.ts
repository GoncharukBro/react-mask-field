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

export type InputType = 'insert' | 'deleteBackward' | 'deleteForward' | 'initial';

interface MethodReturn {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

interface InitParams {
  initialValue: string;
  controlled: boolean;
}

export type Init = ({ initialValue, controlled }: InitParams) => MethodReturn;

export type Update<D> = () => (MethodReturn & { customInputEventDetail: D }) | undefined;

interface TrackingParams {
  previousValue: string;
  inputType: InputType;
  added: string;
  selectionStart: number;
  selectionEnd: number;
}

export type Tracking<D> = ({
  previousValue,
  inputType,
  added,
  selectionStart,
  selectionEnd,
}: TrackingParams) => MethodReturn & { customInputEventDetail: D };

interface FallbackParams {
  previousValue: string;
  selectionStart: number;
  selectionEnd: number;
}

export type Fallback = ({
  previousValue,
  selectionStart,
  selectionEnd,
}: FallbackParams) => MethodReturn;

/**
 *
 * Mask types
 *
 */

export interface MaskingEventDetail {
  unmaskedValue: string;
  maskedValue: string;
  pattern: string;
  isValid: boolean;
}

export type MaskingEvent = CustomInputEvent<MaskingEventDetail>;

export type MaskingEventHandler = (event: MaskingEvent) => void;

export interface Replacement {
  [key: string]: RegExp;
}

export type AST = {
  symbol: string;
  index: number;
  own: 'replacement' | 'mask' | 'change';
}[];

export interface ChangeData {
  unmaskedValue: string;
  added: string;
  beforeRange: string;
  afterRange: string;
  inputType: InputType;
}

export interface MaskingData {
  maskedValue: string;
  ast: AST;
  isValid: boolean;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
  pattern: string;
}

export interface ModifiedData {
  unmaskedValue: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

export type Modify = (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;

export interface MaskProps {
  mask?: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
}
