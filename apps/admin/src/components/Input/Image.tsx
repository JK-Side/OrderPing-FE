import styles from './Input.module.scss';

interface ImageProps {
  onChange?: (file: File | null) => void;
}

export function Image({ onChange }: ImageProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.files?.[0] ?? null);
  };

  return (
    <label className={styles.image}>
      <input type="file" hidden accept="image/*" onChange={handleChange} />
      <span>드래그 하여 이미지 삽입</span>
    </label>
  );
}
