import type { AST } from '../types';

/**
 * Находит первый символ в пользовательском значении
 * @param ast
 * @returns
 */
export default function getFirstChangedSymbol(ast: AST) {
  return ast.find(({ own }) => own === 'change');
}
