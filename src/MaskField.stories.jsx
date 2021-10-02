import { useState } from 'react';
import MaskFieldComponent from '.';

export default {
  title: 'Example Test',
  component: MaskFieldComponent,
};

/**
 *
 * Неконтролируемый компонент
 *
 */
export const TestProps = (args) => {
  const [mask, setMask] = useState('+_ (___) ___-__-__');

  return (
    <>
      <MaskFieldComponent
        {...args}
        mask={mask}
        replacement={{ _: /\d/ }}
        showMask
        break
        onChange={(event) => {
          // console.log(event.target.value);
        }}
      />

      <input />
    </>
  );
};

TestProps.args = {};
