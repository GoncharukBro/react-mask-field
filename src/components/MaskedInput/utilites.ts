// Генерирует дерево синтаксического анализа
export function generateAST(value: string, mask: string) {
  return value.split('').map((symbol, index) => {
    const own = symbol === mask[index] ? ('mask' as const) : ('user' as const);
    return { symbol, index, own };
  });
}
