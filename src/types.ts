export interface Detail {
  value: string;
  added: string;
  pattern: string;
}

export interface MaskingEvent<T = HTMLInputElement, D = Detail> extends CustomEvent<D> {
  target: EventTarget & T;
}

export type MaskingEventHandler<T = HTMLInputElement> = (event: MaskingEvent<T>) => void;

export interface Replacement {
  [key: string]: RegExp;
}

export interface SelectionRange {
  start: number;
  end: number;
}

export interface Selection extends SelectionRange {
  cachedRequestID: number;
  requestID: number;
}

export type AST = {
  symbol: string;
  index: number;
  own: 'replacement' | 'mask' | 'change';
}[];

export interface ChangeData {
  value: string;
  added: string;
  beforeRange: string;
  afterRange: string;
}

export interface MaskData {
  value: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
  ast: AST;
  pattern: string;
}

export interface ModifiedData {
  value: string;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}

export type Modify = (modifiedData: ModifiedData) => Partial<ModifiedData> | undefined;
