import type { Replacement } from '../types';

/**
 * Генерируем дерево синтаксического анализа (AST). AST представляет собой массив объектов, где
 * каждый объект содержит в себе всю необходимую информацию о каждом символе значения. AST
 * используется для точечного манипулирования символом или группой символов.
 * @returns
 */
export default function generateAST(maskedValue: string, mask: string, replacement: Replacement) {
  return maskedValue.split('').map((symbol, index) => {
    const isReplacementKey = Object.prototype.hasOwnProperty.call(replacement, symbol);
    const own = isReplacementKey
      ? ('replacement' as const)
      : symbol === mask[index]
      ? ('mask' as const)
      : ('change' as const);

    return { symbol, index, own };
  });
}
