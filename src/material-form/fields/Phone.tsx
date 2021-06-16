import { useState, memo } from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MaskedInput from 'src/react-mask/MaskedInput';
import { BaseFieldProps } from '../types';
import { validateField } from '../validate';
import { useFormContext } from '../context';

// Нормализуем значение подставляя маску
function normalize(value: string) {
  let maksedValue = '';
  // Определяем по первому символу к какой стране принадлежит номер
  const isPhoneRu = ['7', '8', '9'].includes(value[0]);

  if (isPhoneRu) {
    maksedValue = `${value[0] === '8' ? '8' : '+7'}`;
    if (value.length > 1) maksedValue += ` (${value.substring(1, 4)}`;
    if (value.length > 4) maksedValue += `) ${value.substring(4, 7)}`;
    if (value.length > 7) maksedValue += `-${value.substring(7, 9)}`;
    if (value.length > 9) maksedValue += `-${value.substring(9, 11)}`;
  } else {
    maksedValue = `+${value}`;
  }

  return maksedValue;
}

type PhoneProps = BaseFieldProps & Pick<React.InputHTMLAttributes<HTMLInputElement>, 'value'>;

const Phone = memo((props: PhoneProps) => {
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
    phone = true,
    maxLength = 18,
  } = props;
  const { setValue, setTouched } = useFormContext();
  const [normalizeValue, setNormalizeValue] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // const parseValue = event.target.value.replace(/\D/g, ''); // Оставляем только числовые значения
    // let value = '';

    // // Если ввод не содержит числовые данные, оставляем пустую строку
    // if (!parseValue) {
    //   value = '';
    //   // Проверяем, находится ли курсор в середине поля
    // } else if (event.target.value.length !== event.target.selectionStart) {
    //   // Если введенные символ является нечисловым, оставляем значение без изменений
    //   // При "Backspace" event.data принимает значение `null`
    //   if ((event as any).data && /\D/g.test((event as any).data)) {
    //     value = parseValue;
    //   } else return;
    // } else {
    //   value = normalize(parseValue[0] === '9' ? `7${parseValue}` : parseValue);
    // }

    // setNormalizeValue(value);

    const newValue = event.target.value.replace(/\D/g, '');
    setValue(name, newValue, validateField(newValue, { ...props, phone }));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched(event.target.name);
  };

  return (
    <FormControl fullWidth error={error} disabled={disabled} required={required}>
      {label && <InputLabel htmlFor={id}>{label}</InputLabel>}

      <Input
        type="tel"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        inputProps={{ maxLength }}
        inputComponent={MaskedInput}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-describedby={`${id}-helper-text`}
      />

      {helperText && <FormHelperText id={`${id}-helper-text`}>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export default Phone;
