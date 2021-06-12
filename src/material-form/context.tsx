import { createContext, useContext } from 'react';

interface FormContextValue {
  handleChange: (name: string, value: string | boolean, error: string | undefined) => void;
  handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export function FormContextProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: FormContextValue }>) {
  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
  const context = useContext(FormContext);

  if (context === undefined) {
    throw new Error('"useFormContext" должен использоваться совместно с "FormContextProvider"');
  }

  return context;
}
