export type Range = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'change';
}>;

export interface ChangedData {
  value: string;
  added: string | undefined;
  beforeRange: string;
  afterRange: string;
}

export interface MaskedData {
  value: string;
  mask: string;
  char: string;
  ast: AST | null;
}
