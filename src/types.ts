export type Range = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'change';
}>;

export interface ChangedData {
  value: string;
  added: string;
  beforeRange: string;
  afterRange: string;
}

export interface MaskedData {
  value: string;
  mask: string;
  pattern: { [key: string]: RegExp };
  ast: AST | null;
}
