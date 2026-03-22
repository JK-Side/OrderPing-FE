import styles from './HomeState.module.scss';

interface HomeErrorProps {
  error: unknown;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return '홈 화면 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function HomeError({ error }: HomeErrorProps) {
  return (
    <section className={styles.stateSection}>
      <div className={styles.stateCard}>
        <h2 className={styles.title}>홈 화면을 불러오지 못했습니다</h2>
        <p className={styles.description}>{getErrorMessage(error)}</p>
      </div>
    </section>
  );
}
