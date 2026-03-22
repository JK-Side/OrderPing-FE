import styles from './HomeState.module.scss';

export default function HomeLoading() {
  return (
    <section className={styles.stateSection}>
      <div className={styles.stateCard}>
        <h2 className={styles.title}>홈 화면을 불러오는 중입니다</h2>
        <p className={styles.description}>작업 공간을 준비하고 있어요.</p>
      </div>
    </section>
  );
}