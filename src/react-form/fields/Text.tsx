import { memo } from 'react';
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

  return (
    <>
      {Component ? (
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
      ) : (
        <div>
          {label && <label htmlFor={id}>{label}</label>}
          <input
            type="text"
            aria-describedby={`${id}-helper-text`}
            name={name}
            id={id}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            onBlur={onBlur}
          />
          {helperText && <span id={`${id}-helper-text`}>{helperText}</span>}
        </div>
      )}
    </>
  );
});
