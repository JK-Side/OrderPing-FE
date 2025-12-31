import { Image } from './Image';
import { InputRoot } from './Input';
import { Select } from './Select';
import { Text } from './Text';
import { TextArea } from './TextArea';

export const Input = Object.assign(InputRoot, {
  Text,
  TextArea,
  Select,
  Image,
});
