import type { CustomInputEvent, CustomInputEventHandler } from '../types';

export interface MaskEventDetail {
  value: string;
  unmaskedValue: string;
  parts: MaskPart[];
  pattern: string;
  isValid: boolean;
}

export type MaskEvent = CustomInputEvent<MaskEventDetail>;

export type MaskEventHandler = CustomInputEventHandler<MaskEventDetail>;

export interface Replacement {
  [key: string]: RegExp;
}

export interface ModifiedData {
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
  onMask?: MaskEventHandler;
}

export interface ChangeData {
  unmaskedValue: string;
  added: string;
  beforeRange: string;
  afterRange: string;
}

export type MaskPart = {
  /**
   * - `replacement` - символ замены
   * - `mask` - символ маски
   * - `input` - символ введенный пользователем
   */
  type: 'replacement' | 'mask' | 'input';
  value: string;
  index: number;
};

export interface MaskData {
  value: string;
  unmaskedValue: string;
  parts: MaskPart[];
  pattern: string;
  isValid: boolean;
  mask: string;
  replacement: Replacement;
  showMask: boolean;
  separate: boolean;
}
