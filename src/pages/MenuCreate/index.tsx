import { useCallback, useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { postPresignedUrl } from '@/api/store';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { useCreateMenu } from '@/pages/MenuCreate/hooks/useCreateMenu';
import type { MenuCreateForm } from '@/pages/MenuCreate/types';
import styles from './MenuCreate.module.scss';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;

export default function MenuCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { mutateAsync: createMenu } = useCreateMenu();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MenuCreateForm>({
    mode: 'onBlur',
    defaultValues: {
      categoryId: CATEGORY_MAIN,
    },
  });
  const categoryId = watch('categoryId');
  const menuImage = watch('menuImage');
  const numberPatternMessage = '숫자만 입력해 주세요.';
  const isPriceFormatError = errors.price?.message === numberPatternMessage;
  const isStockFormatError = errors.stock?.message === numberPatternMessage;
  const priceMessageState =
    isPriceFormatError ? 'warning' : errors.price ? 'error' : undefined;
  const stockMessageState =
    isStockFormatError ? 'warning' : errors.stock ? 'error' : undefined;

  const handleCancel = () => {
    if (id) {
      navigate(`/store/operate/${id}`);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (!menuImage?.length) {
      setPreviewUrl(null);
      return;
    }

    const file = menuImage[0];
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [menuImage]);

  const uploadMenuImage = useCallback(async (menuImage?: FileList) => {
    if (!menuImage?.length) {
      return '';
    }

    const file = menuImage[0];
    const { presignedUrl, imageUrl } = await postPresignedUrl({
      directory: 'menus',
      fileName: file.name,
    });
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload menu image.');
    }

    return imageUrl;
  }, []);

  const handleSubmitMenu = useCallback<SubmitHandler<MenuCreateForm>>(
    async (data) => {
      if (!storeId) return;
      setSubmitError(null);
      try {
        const imageUrl = await uploadMenuImage(data.menuImage);
        await createMenu({
          storeId,
          categoryId: data.categoryId,
          name: data.name,
          price: Number(data.price),
          description: data.description ?? '',
          imageUrl,
          stock: Number(data.stock),
        });
        navigate(`/store/operate/${storeId}`);
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status === 400) {
          setSubmitError('잘못된 요청입니다.');
        } else if (status === 401) {
          setSubmitError('인증이 필요합니다.');
        } else if (status === 403) {
          setSubmitError('본인 매장이 아닙니다.');
        } else {
          setSubmitError('메뉴 생성에 실패했습니다.');
        }
        console.error('Failed to create menu', error);
      }
    },
    [createMenu, navigate, storeId, uploadMenuImage],
  );

  return (
    <section className={styles.menuCreate}>
      <header className={styles.header}>
        <h2 className={styles.title}>메뉴 추가</h2>
      </header>
      <div className={styles.divider} />

      <form className={styles.form} onSubmit={handleSubmit(handleSubmitMenu)}>
        <div className={styles.formBody}>
          <div className={styles.photoSection}>
            <div className={styles.photoLabel}>메뉴 사진</div>
            <p className={styles.photoHelp}>메뉴 사진이 없으면 기본 사진으로 대체됩니다.</p>
            <label className={styles.photoUpload}>
              <input type="file" accept="image/*" hidden {...register('menuImage')} />
              {previewUrl ? (
                <img className={styles.photoPreview} src={previewUrl} alt="메뉴 이미지 미리보기" />
              ) : (
                <PlusIcon className={styles.photoIcon} aria-hidden="true" />
              )}
            </label>
          </div>

          <div className={styles.fields}>
            <Input label="메뉴명" required message={errors.name?.message} messageState={errors.name ? 'error' : undefined}>
              <Input.Text
                placeholder="내용을 입력해 주세요."
                {...register('name', {
                  required: '메뉴명을 입력해 주세요.',
                })}
              />
            </Input>

            <div className={styles.row}>
              <Input
                label="메뉴 가격"
                required
                message={errors.price?.message}
                messageState={priceMessageState}
              >
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="내용을 입력해 주세요."
                  {...register('price', {
                    required: '메뉴 가격을 입력해 주세요.',
                    pattern: {
                      value: /^\d+$/,
                      message: numberPatternMessage,
                    },
                  })}
                />
              </Input>
              <Input label="재고" required message={errors.stock?.message} messageState={stockMessageState}>
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="수량을 입력해 주세요."
                  {...register('stock', {
                    required: '재고 수량을 입력해 주세요.',
                    pattern: {
                      value: /^\d+$/,
                      message: numberPatternMessage,
                    },
                  })}
                />
              </Input>
            </div>

            <div className={styles.category}>
              <div className={styles.categoryLabel}>
                카테고리 <span className={styles.required}>*</span>
              </div>
              <input
                type="hidden"
                {...register('categoryId', {
                  valueAsNumber: true,
                  required: '카테고리를 선택해 주세요.',
                })}
              />
              <div className={styles.categoryButtons}>
                <button
                  type="button"
                  className={`${styles.categoryButton} ${
                    categoryId === CATEGORY_MAIN ? styles.categoryButtonActive : ''
                  }`}
                  onClick={() =>
                    setValue('categoryId', CATEGORY_MAIN, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  메인 메뉴
                </button>
                <button
                  type="button"
                  className={`${styles.categoryButton} ${
                    categoryId === CATEGORY_SIDE ? styles.categoryButtonActive : ''
                  }`}
                  onClick={() =>
                    setValue('categoryId', CATEGORY_SIDE, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  사이드 메뉴
                </button>
              </div>
              {errors.categoryId?.message && <span className={styles.categoryError}>{errors.categoryId.message}</span>}
            </div>

            <Input label="메뉴 설명 (선택)">
              <Input.TextArea
                placeholder={`예시) 사랑의 티니핑 월드에 빠져버린 맛,\n둘이 먹다 죽어도 난 몰라요.\n저는 그저 티니핑 월드에 갈 것이에요.`}
                {...register('description')}
              />
            </Input>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" className={styles.cancelButton} onClick={handleCancel}>
            취소
          </Button>
          <Button type="submit" size="md" className={styles.submitButton} disabled={!storeId || isSubmitting}>
            메뉴 추가
          </Button>
        </div>
        {submitError && <p className={styles.submitError}>{submitError}</p>}
      </form>
    </section>
  );
}
