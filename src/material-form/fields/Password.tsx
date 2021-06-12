// Скрывает ввод пароля, маскируя символы звёздочками

import { useState, memo, cloneElement } from 'react';
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
import { useFormContext } from '../useFormContext';

type PasswordProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

export default memo((props: PasswordProps) => {
  const {
    value = '',
    name,
    id,
    label,
    placeholder,
    helperText,
    error,
    disabled,
    required,
    match,
  } = props;
  const { handleChange, handleBlur } = useFormContext();
  const [showPassword, setPasswordShow] = useState(false);

  console.warn('Password');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    handleChange(name, newValue, validateField(newValue, props));
  };

  const handleShowPassword = (event: never) => {
    setPasswordShow((prev) => !prev);
  };

  const showPasswordButton = (
    <InputAdornment position="end">
      <IconButton
        size="small"
        id={`${id}-show-password-button`}
        disabled={disabled}
        onClick={handleShowPassword}
        aria-label="toggle password visibility"
      >
        {cloneElement(showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />, {
          fontSize: 'inherit',
        })}
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
        onChange={handleInputChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});
