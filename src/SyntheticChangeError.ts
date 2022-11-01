import type { InputAttributes } from 'types';

export interface SyntheticChangeError {
  cause?: { attributes?: Partial<InputAttributes> };
}

// eslint-disable-next-line no-redeclare
export class SyntheticChangeError extends Error {
  constructor(message: string, cause?: SyntheticChangeError['cause']) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}
