import { Image } from './Image';
import { InputRoot } from './Input';
import { Select } from './Select';
import { Text } from './Text';
import { TextArea } from './TextArea';

/* ----------------------------------------------
  사용법 (컴파운드 컴포넌트 패턴)

  <Input label="Input Label" message="에러 문구 표시입니다" messageState="error" required>
    <Input.Text placeholder="내용을 입력하세요" />
  </Input>

  <Input label="테스트" required>
    <Input.Text placeholder="내용을 입력하세요" />
  </Input>

---------------------------------------------- */

export const Input = Object.assign(InputRoot, {
  Text,
  TextArea,
  Select,
  Image,
});
