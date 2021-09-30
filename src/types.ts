export type Pattern = {
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
  own: 'pattern' | 'mask' | 'change';
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
  pattern: Pattern;
  showMask: boolean;
  break: boolean;
  ast: AST;
  inputPattern: string;
}
