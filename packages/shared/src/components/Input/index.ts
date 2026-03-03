import { InputRoot } from './Input';
import InputSelect from './InputSelect';
import { Text } from './Text';
import { TextArea } from './TextArea';

export const Input = Object.assign(InputRoot, {
  Text,
  TextArea,
  InputSelect,
});

export { InputRoot, InputSelect, Text, TextArea };
