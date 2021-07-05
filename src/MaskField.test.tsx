import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaskField from './MaskField';

const maskField = <MaskField mask="+7 (___) ___-__-__" char="_" />;

function getInputElement() {
  return screen.getByRole('textbox') as HTMLInputElement;
}

test('type', () => {
  render(maskField);

  const input = getInputElement();
  userEvent.type(input, '9123456789');
  expect(input).toHaveValue('+7 (912) 345-67-89');
});
