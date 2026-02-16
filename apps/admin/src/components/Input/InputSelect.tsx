import * as Select from '@radix-ui/react-select';
import { useState } from 'react';
import styles from './Input.module.scss';

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type InputSelectProps = {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
};

export default function InputSelect({
  value,
  onValueChange,
  options,
  placeholder = '선택해 주세요.',
  disabled,
  name,
  required,
  className,
  triggerClassName,
}: InputSelectProps) {
  const [open, setOpen] = useState(false);
  const hasValue = value != null && value !== '';

  return (
    <div className={[styles.selectWrapper, open ? styles.selectWrapperOpen : '', className ?? ''].join(' ')}>
      {name ? <input type="hidden" name={name} value={value ?? ''} required={required} /> : null}

      <Select.Root
        value={hasValue ? value : undefined}
        onValueChange={onValueChange}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
      >
        <Select.Trigger className={[styles.selectTrigger, triggerClassName ?? ''].join(' ')} aria-label={name}>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>

        <Select.Portal>
          <Select.Content className={styles.selectContent} position="popper" sideOffset={6}>
            <Select.Viewport className={styles.selectViewport}>
              {options.map((opt) => (
                <Select.Item key={opt.value} value={opt.value} disabled={opt.disabled} className={styles.selectItem}>
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
