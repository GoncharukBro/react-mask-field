// Текстовое поле, предназначено для ввода символов с помощью клавиатуры

import { memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';

type TextProps = BaseFieldProps &
  Pick<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onBlur'>;

export default memo((props: TextProps) => {
  const {
    Component,
    name,
    id,
    value = '',
    label,
    placeholder,
    helperText,
    error,
    disabled,
    required,
    onBlur,
    onChange,
  } = props;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange?.(name, newValue, validateField(newValue, props));
  };

  if (Component) {
    return (
      <Component
        name={name}
        id={id}
        value={value}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
      />
    );
  }

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type="text"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});
