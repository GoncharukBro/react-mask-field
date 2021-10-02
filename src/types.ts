export type Replacement = {
  [key: string]: RegExp;
};

export type Selection = {
  cachedRequestID: number;
  requestID: number;
  start: number;
  end: number;
};

export type SelectionRange = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'replacement' | 'mask' | 'change';
}>;

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
  break: boolean;
  ast: AST;
  pattern: string;
}
