import type { AST } from '../types';

/**
 * Находит последний символ в пользовательском значении
 * @param ast
 * @returns
 */
export default function getLastChangedSymbol(ast: AST) {
  const reversedAST = [...ast].reverse();
  return reversedAST.find(({ own }) => own === 'change');
}
