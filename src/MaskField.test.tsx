import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaskField from './MaskField';

const maskField = <MaskField mask="+7 (___) ___-__-__" pattern="_" />;

function getInputElement() {
  return screen.getByRole('textbox') as HTMLInputElement;
}

test('Type', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

test('Replace characters within the selected range', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  input.setSelectionRange(4, 5);
  userEvent.type(input, '0');
  expect(input).toHaveValue('+7 (012) 345-67-89');
});

test('Backspace after change character', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  input.setSelectionRange(5, 5);
  userEvent.type(input, '{backspace}');
  expect(input).toHaveValue('+7 (123) 456-78-9');
});

test('Backspace after mask character', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  input.setSelectionRange(8, 8);
  userEvent.type(input, '{backspace}');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});

test('Delete before change character', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  input.setSelectionRange(4, 4);
  userEvent.type(input, '{del}');
  expect(input).toHaveValue('+7 (123) 456-78-9');
});

test('Delete before mask character', () => {
  render(maskField);
  const input = getInputElement();
  userEvent.type(input, '9123456789');
  input.setSelectionRange(7, 7);
  userEvent.type(input, '{del}');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});
