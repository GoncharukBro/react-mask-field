let input: HTMLInputElement | null = null;

// Формируем значение
function masked(value: string, country?: 'ru' | 'other') {
  let maksedValue = '';

  if (country === 'ru') {
    maksedValue = `${value[0] === '8' ? '8' : '+7'} `;

    if (value.length > 1) {
      maksedValue += `(${value.substring(1, 4)}`;
    }
    if (value.length >= 5) {
      maksedValue += `) ${value.substring(4, 7)}`;
    }
    if (value.length >= 8) {
      maksedValue += `-${value.substring(7, 9)}`;
    }
    if (value.length >= 10) {
      maksedValue += `-${value.substring(9, 11)}`;
    }
  } else {
    maksedValue = `+${value}`;
  }

  return maksedValue;
}

const handleInput = (event: any) => {
  if (input) {
    // Оставляем только числовые значения
    let parseValue = event.target.value.replace(/\D/g, '');
    // Если первый символ - "9", добавляем к значению "7"
    parseValue = parseValue[0] === '9' ? `7${parseValue}` : parseValue;

    // Если ввод содержит нечисловые данные, оставляем значение без изменений
    if (!parseValue) {
      input.value = '';
      return;
    }

    // Если курсор находится в середине поля
    if (event.target.value.length !== event.target.selectionStart) {
      // Если введенные символ является нечисловым, оставляем значение без изменений
      if (event.data && /\D/g.test(event.data)) {
        input.value = parseValue;
      }
      // Завершаем выполнение функции если введенный символ отсутствует (при "Backspace")
      return;
    }

    // Определяем по первому символу к какой стране принадлежит номер
    const country = ['7', '8', '9'].includes(parseValue[0]) ? 'ru' : undefined;

    input.value = masked(parseValue, country);
  }
};

function handleKeyDown(event: any) {
  if (input) {
    // Оставляем только числовые значения
    const parseValue = input.value.replace(/\D/g, '');
    // Очищаем поле после удаления последнего символа
    if (parseValue.length === 1 && event.key === 'Backspace') {
      input.value = '';
    }
  }
}

function handlePaste(event: any) {
  // Достаем данные из буфера
  const clipboardData = event.clipboardData.getData('Text');
  // Присваиваем только числовые значения,
  // на случай если в буфере присутсвуют нечисловые значения
  if (input) {
    input.value = clipboardData.replace(/\D/g, '');
  }
}

export default function phoneMask(ref: HTMLInputElement | null) {
  input = ref;

  input?.addEventListener('input', handleInput, false);
  input?.addEventListener('keydown', handleKeyDown);
  input?.addEventListener('paste', handlePaste, false);
}
