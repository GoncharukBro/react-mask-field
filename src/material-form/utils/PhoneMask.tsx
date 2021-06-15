import { useState } from 'react';

// Нормализуем значение подставляя маску
function normalize(value: string, country?: 'ru' | 'other') {
  let maksedValue = '';

  if (country === 'ru') {
    maksedValue = `${value[0] === '8' ? '8' : '+7'} `;

    if (value.length > 1) {
      maksedValue += `(${value.substring(1, 4)}`;
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

  const handleInput = (event: any) => {
    // Оставляем только числовые значения
    let parseValue = event.target.value.replace(/\D/g, '');
    // Если первый символ - "9", добавляем к значению "7"
    parseValue = parseValue[0] === '9' ? `7${parseValue}` : parseValue;

    // Если ввод содержит нечисловые данные, оставляем значение без изменений
    if (!parseValue) {
      const value = '';
      setNormalizeValue(value);
      onChange?.({ ...event, target: { ...event.target, value } });
    } else if (event.target.value.length !== event.target.selectionStart) {
      // Если курсор находится в середине поля и введенные символ является нечисловым,
      // оставляем значение без изменений
      if (event.data && /\D/g.test(event.data)) {
        const value = parseValue;
        setNormalizeValue(value);
        onChange?.({ ...event, target: { ...event.target, value } });
      }
    } else {
      // Определяем по первому символу к какой стране принадлежит номер
      const country = ['7', '8', '9'].includes(parseValue[0]) ? 'ru' : undefined;
      const value = normalize(parseValue, country);
      setNormalizeValue(value);
      onChange?.({ ...event, target: { ...event.target, value } });
    }
  };

  const handleKeyDown = (event: any) => {
    // Оставляем только числовые значения
    const parseValue = event.target.value.replace(/\D/g, '');
    // Очищаем поле после удаления последнего символа
    if (parseValue?.length === 1 && event.key === 'Backspace') {
      const value = '';
      setNormalizeValue(value);
      onChange?.({ ...event, target: { ...event.target, value } });
    }
  };

  const handlePaste = (event: any) => {
    // Достаем данные из буфера
    const clipboardData = event.clipboardData.getData('Text');
    // Присваиваем только числовые значения,
    // на случай если в буфере присутсвуют нечисловые значения
    const value = clipboardData.replace(/\D/g, '');
    setNormalizeValue(value);
    onChange?.({ ...event, target: { ...event.target, value } });
  };

  return (
    <input
      {...other}
      value={normalizeValue}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
    />
  );
}
