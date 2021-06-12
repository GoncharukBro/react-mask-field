// Валидирует адрес электронной почты, добавляя автоподстановку

import { memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../useFormContext';

type EmailProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

const Email = memo((props: EmailProps) => {
  const { value = '', name, id, label, placeholder, helperText, error, disabled, required } = props;
  const { handleChange, handleBlur } = useFormContext();

  console.warn('Email');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    handleChange(name, newValue, validateField(newValue, { ...props, email: true }));
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type="email"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={handleInputChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Email;
