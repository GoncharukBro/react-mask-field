import { FormState, ValidationValues } from './types';

/**
 * Валидирует поле по условиям к определенному полю или указанным в props
 * @param value значение валидируемого поля
 * @param props своства компонента валидируемого поля
 * @returns `undefined` при успешной валидации, если поле не валидно вернёт сообщение об ошибке
 */
export function validateField(
  value: string | number | boolean | undefined,
  props: ValidationValues
) {
  const { required, minLength, email, phone, match } = props;
  // Обязательное поле
  if (required) {
    const rule = value;
    const message = 'Обязательное поле';
    if (!rule) return message;
  }
  // Минимальная длина символов
  if (minLength && value && typeof value === 'string') {
    const rule = value.length >= minLength;
    const message = `Минимум ${minLength} символов`;
    if (!rule) return message;
  }
  // Проверка на совподение
  if (match && value && typeof value === 'string') {
    const rule = value === match;
    const message = 'Введенные данные не совпадают';
    if (!rule) return message;
  }
  // Валидация электронной почты
  if (email && value && typeof value === 'string') {
    const rule = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value);
    const message = 'Адрес электронной почты указан неверно';
    if (!rule) return message;
  }
  // Валидация номера телефона
  if (phone && value && typeof value === 'string') {
    const rule = /^(8|\+*7)?(9)([0-9]{2})([0-9]{3})([0-9]{4})$/i.test(value);
    const message = 'Номер телефона указан неверно';
    if (!rule) return message;
  }

  return '';
}

/**
 * Валидирует всю форму по условиям для отправки
 * @param values значения полей из state
 * @param errors значения ошибок из state
 * @param dependencies зависимости из state
 * @returns `true` если валидна, `false` если не валидна
 */
export function validateForm(
  values: FormState['values'],
  errors: FormState['errors'],
  dependencies: FormState['dependencies']
) {
  // Проверяем наличие незаполненных полей
  const hasValues = Object.values(values).find((value) => value);
  if (!hasValues) {
    return false;
  }
  // Проверяем наличие ошибок
  const hasErrors = Object.values(errors).find((error) => error);
  if (hasErrors) {
    return false;
  }
  // Проверяем наличие невалидных значений с зависимостью
  const hasInvalidValueWithDependence = Object.keys(dependencies).find((dependence) => {
    return values[dependence] && dependencies[dependence]?.find((value) => !values[value]);
  });
  if (hasInvalidValueWithDependence) {
    return false;
  }
  // Если не найдено не одной ошибки возвращаем `true`
  return true;
}
