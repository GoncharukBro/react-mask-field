export interface Detail {
  unmaskedValue: string;
  maskedValue: string;
  pattern: string;
  isValid: boolean;
}

export interface MaskingEvent<T = HTMLInputElement, D = Detail> extends CustomEvent<D> {
  target: EventTarget & T;
}

export type MaskingEventHandler<T = HTMLInputElement> = (event: MaskingEvent<T>) => void;

export interface Replacement {
  [key: string]: RegExp;
}

export type InputType = 'insert' | 'delete' | 'deleteForward' | 'initial';

export interface SelectionRange {
  start: number;
  end: number;
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

export interface Props {
  mask?: string;
  replacement?: string | Replacement;
  showMask?: boolean;
  separate?: boolean;
  modify?: Modify;
  onMasking?: MaskingEventHandler;
}
