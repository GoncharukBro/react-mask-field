export interface FormState<T = any> {
  isValid: boolean;
  values: Partial<T>;
  errors: {
    [Property in keyof T]?: string | undefined;
  };
  touched: {
    [Property in keyof T]?: boolean;
  };
  dependencies: {
    [Property in keyof T]?: string[];
  };
}

export interface ValidationValues {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  match?: string;
  minLength?: number;
}

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type GridSize = 'auto' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type BaseFieldProps = ValidationValues &
  Partial<Record<Breakpoint, boolean | GridSize>> & {
    name: string;
    id?: string;
    label?: string;
    placeholder?: string;
    helperText?: string;
    error?: boolean;
    disabled?: boolean;
    /**
     * Определяет обязательность поля при валидной завимисоти.
     * Если в качестве зависимости указано поле с именем "checkbox" и данное поле имеет значение `true`,
     * тогда поле с зависимостью становится обязательным, в противном случает оно отключено
     */
    dependence?: string;
    onChange?: (
      name: string,
      value: string | number | boolean,
      error: string | false | undefined
    ) => void;
  };
