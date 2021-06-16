import { useState } from 'react';

// Нормализуем значение подставляя маску
function normalize(value: string, country?: 'ru' | 'other') {
  let maksedValue = '';

  if (country === 'ru') {
    maksedValue = `${value[0] === '8' ? '8' : '+7'}`;

    if (value.length > 1) {
      maksedValue += ` (${value.substring(1, 4)}`;
    }
    if (value.length > 4) {
      maksedValue += `) ${value.substring(4, 7)}`;
    }
    if (value.length > 7) {
      maksedValue += `-${value.substring(7, 9)}`;
    }
    if (value.length > 9) {
      maksedValue += `-${value.substring(9, 11)}`;
    }
  } else {
    maksedValue = `+${value}`;
  }

  return maksedValue;
}

type PhoneMaskProps = any;

export default function PhoneMask({ ref, onChange, ...other }: PhoneMaskProps) {
  const [normalizeValue, setNormalizeValue] = useState('');

  const handleChange = (event: any) => {
    // Оставляем только числовые значения
    const parseValue = event.target.value.replace(/\D/g, '');
    // Если ввод содержит нечисловые данные, оставляем значение без изменений
    if (!parseValue) {
      const value = '';
      setNormalizeValue(value);
      onChange?.({ ...event, target: { ...event.target, value } });
      return;
    }

    // Проверяем, находится ли курсор в середине поля
    if (event.target.value.length !== event.target.selectionStart) {
      // Если введенные символ является нечисловым, оставляем значение без изменений
      // При "Backspace" event.data принимает значение `null`
      if (event.data && /\D/g.test(event.data)) {
        const value = parseValue;
        setNormalizeValue(value);
        onChange?.({ ...event, target: { ...event.target, value } });
      }
      return;
    }

    // Определяем по первому символу к какой стране принадлежит номер
    const country = ['7', '8', '9'].includes(parseValue[0]) ? 'ru' : undefined;
    const value = normalize(parseValue[0] === '9' ? `7${parseValue}` : parseValue, country);
    setNormalizeValue(value);
    onChange?.({ ...event, target: { ...event.target, value } });
  };

  return <input {...other} value={normalizeValue} onChange={handleChange} />;
}
