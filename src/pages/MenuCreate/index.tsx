import { useNavigate, useParams } from 'react-router-dom';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './MenuCreate.module.scss';

export default function MenuCreate() {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleCancel = () => {
    if (id) {
      navigate(`/store/operate/${id}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <section className={styles.menuCreate}>
      <header className={styles.header}>
        <h2 className={styles.title}>메뉴 추가</h2>
      </header>
      <div className={styles.divider} />

      <div className={styles.form}>
        <div className={styles.photoSection}>
          <div className={styles.photoLabel}>메뉴 사진</div>
          <p className={styles.photoHelp}>메뉴 사진이 없으면 기본 사진으로 대체됩니다.</p>
          <label className={styles.photoUpload}>
            <input type="file" accept="image/*" hidden />
            <PlusIcon className={styles.photoIcon} aria-hidden="true" />
          </label>
        </div>

        <div className={styles.fields}>
          <Input label="메뉴명" required>
            <Input.Text placeholder="내용을 입력해 주세요." />
          </Input>

          <div className={styles.row}>
            <Input label="메뉴 가격" required>
              <Input.Text type="number" placeholder="내용을 입력해 주세요." />
            </Input>
            <Input label="재고" required>
              <Input.Text type="number" placeholder="수량을 입력해 주세요." />
            </Input>
          </div>

          <div className={styles.category}>
            <div className={styles.categoryLabel}>
              카테고리 <span className={styles.required}>*</span>
            </div>
            <div className={styles.categoryButtons}>
              <button type="button" className={styles.categoryButton}>
                메인 메뉴
              </button>
              <button type="button" className={styles.categoryButton}>
                사이드 메뉴
              </button>
            </div>
          </div>

          <Input label="메뉴 설명 (선택)">
            <Input.TextArea
              placeholder={`예시) 사랑의 티니핑 월드에 빠져버린 맛,\n둘이 먹다 죽어도 난 몰라요.\n저는 그저 티니핑 월드에 갈 것이에요.`}
            />
          </Input>
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" className={styles.cancelButton} onClick={handleCancel}>
          취소
        </Button>
        <Button type="button" size="md" className={styles.submitButton}>
          메뉴 추가
        </Button>
      </div>
    </section>
  );
}
