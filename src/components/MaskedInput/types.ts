export type Range = [number, number];

export type AST = Array<{
  symbol: string;
  index: number;
  own: 'mask' | 'user';
}>;
