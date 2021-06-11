// Скрывает ввод пароля, маскируя символы звёздочками

import { useState, memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';

type PasswordProps = BaseFieldProps &
  Pick<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onBlur'>;

export default memo((props: PasswordProps) => {
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
    match,
    onBlur,
    onChange,
  } = props;

  const [showPassword, setPasswordShow] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange?.(name, newValue, validateField(newValue, props));
  };

  const handleShowPassword = (event: never) => {
    setPasswordShow((prev) => !prev);
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

  const showPasswordButton = (
    <InputAdornment position="end">
      <IconButton
        id={`${id}-show-password-button`}
        disabled={disabled}
        onClick={handleShowPassword}
        aria-label="toggle password visibility"
      >
        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        endAdornment={!match && showPasswordButton}
        onChange={handleChange}
        onBlur={onBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});
