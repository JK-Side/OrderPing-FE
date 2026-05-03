export const normalizeAccountNumber = (value: string) => {
  return value
    .replace(/[\uFF10-\uFF19]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, '');
};
