export const normalizeAccountNumber = (value: string) => {
  return value
    .replace(/[0-9]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, '');
};
