export type Pattern = {
  [key: string]: RegExp;
};

export type Range = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'change';
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
  ast: AST;
  inputPattern: string;
}
