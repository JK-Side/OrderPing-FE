import styles from './WaitingMain.module.scss';

export default function WaitingMain() {
  return (
    <section className={styles.waitingMain}>
      <div className={styles.panel}>
        <div className={styles.spinner} aria-hidden='true' />
        <h2 className={styles.title}>메인화면을 불러오고 있어요</h2>
        <div className={styles.description}>잠시만 기다려주세요.</div>
      </div>
    </section>
  );
}
