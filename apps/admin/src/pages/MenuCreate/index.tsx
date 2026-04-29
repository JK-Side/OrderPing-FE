import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useCreateMenu } from '@/pages/MenuCreate/hooks/useCreateMenu';
import { useMenusByCategory } from '@/pages/StoreOperate/hooks/useMenus';
import { MESSAGES, REGEX } from '@/static/validation';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './MenuCreate.module.scss';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;
const CATEGORY_TABLE_FEE = 3;

const TABLE_FEE_LIMIT_MESSAGE = '테이블비 메뉴는 주점당 하나만 등록할 수 있어요.';
const TABLE_FEE_NAME = '인원수';
const TABLE_FEE_STOCK = '1000';
const TABLE_FEE_DESCRIPTION = '첫 주문 시 테이블 이용 인원수만큼 선택해 주세요.';

export interface MenuCreateForm {
  name: string;
  price: string;
  stock: string;
  categoryId: number;
  isTableFee: boolean;
  description?: string;
  menuImage?: FileList;
}

export default function MenuCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isTableFeeConfirmOpen, setIsTableFeeConfirmOpen] = useState(false);
  const { mutateAsync: createMenu } = useCreateMenu();
  const { data: tableFeeMenus = [] } = useMenusByCategory(storeId, CATEGORY_TABLE_FEE);
  const { toast } = useToast();
  const { upload } = usePresignedUploader();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MenuCreateForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      categoryId: CATEGORY_MAIN,
      isTableFee: false,
    },
  });

  const menuName = useWatch({ control, name: 'name' });
  const menuPrice = useWatch({ control, name: 'price' });
  const menuStock = useWatch({ control, name: 'stock' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const menuDescription = useWatch({ control, name: 'description' });
  const menuImage = useWatch({ control, name: 'menuImage' });

  const isPriceFormatError = errors.price?.message === MESSAGES.MENU.NUMBER_ONLY;
  const isStockFormatError = errors.stock?.message === MESSAGES.MENU.NUMBER_ONLY;

  const priceMessageState = isPriceFormatError ? 'warning' : errors.price ? 'error' : undefined;
  const stockMessageState = isStockFormatError ? 'warning' : errors.stock ? 'error' : undefined;

  const isPriceValid = typeof menuPrice === 'string' && REGEX.NUMBER_ONLY.test(menuPrice);
  const isStockValid = typeof menuStock === 'string' && REGEX.NUMBER_ONLY.test(menuStock);

  const isNameValid = typeof menuName === 'string' && menuName.trim().length > 0;
  const isCategoryValid = typeof categoryId === 'number' && categoryId > 0;
  const hasErrors = Object.keys(errors).length > 0;
  const isTableFeeCategory = categoryId === CATEGORY_TABLE_FEE;
  const hasTableFeeMenu = tableFeeMenus.length > 0;
  const isTableFeeLimitExceeded = isTableFeeCategory && hasTableFeeMenu;
  const hasTableFeeResetTarget =
    (menuName ?? '').trim().length > 0 ||
    (menuStock ?? '').trim().length > 0 ||
    (menuDescription ?? '').trim().length > 0 ||
    !!menuImage?.length ||
    !!previewUrl;

  const canSubmit =
    !!storeId &&
    isNameValid &&
    isPriceValid &&
    isStockValid &&
    isCategoryValid &&
    !hasErrors &&
    !isTableFeeLimitExceeded;

  const handleCancel = () => {
    if (id) {
      navigate(`/store/operate/${id}`);
    } else {
      navigate(-1);
    }
  };

  const setMenuCategory = (nextCategoryId: number) => {
    setValue('categoryId', nextCategoryId, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('isTableFee', nextCategoryId === CATEGORY_TABLE_FEE, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const applyTableFeeCategory = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setMenuCategory(CATEGORY_TABLE_FEE);
    setValue('name', TABLE_FEE_NAME, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('stock', TABLE_FEE_STOCK, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('description', TABLE_FEE_DESCRIPTION, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setValue('menuImage', undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setIsTableFeeConfirmOpen(false);
  };

  const handleTableFeeCategoryClick = () => {
    if (hasTableFeeMenu || isTableFeeCategory) return;

    if (hasTableFeeResetTarget) {
      setIsTableFeeConfirmOpen(true);
      return;
    }

    applyTableFeeCategory();
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const uploadMenuImage = useCallback(
    async (menuImage?: FileList) => {
      if (!menuImage?.length) {
        return '';
      }

      const file = menuImage[0];
      return await upload({
        directory: 'menus',
        fileName: file.name,
        file,
        errorMessage: 'Failed to upload menu image.',
      });
    },
    [upload],
  );

  const handleSubmitMenu = useCallback<SubmitHandler<MenuCreateForm>>(
    async (data) => {
      if (!storeId) return;
      const isTableFee = data.categoryId === CATEGORY_TABLE_FEE;

      if (isTableFee && hasTableFeeMenu) {
        toast({
          message: TABLE_FEE_LIMIT_MESSAGE,
          variant: 'error',
        });
        return;
      }

      try {
        const imageUrl = isTableFee ? '' : await uploadMenuImage(data.menuImage);
        await createMenu({
          storeId,
          categoryId: data.categoryId,
          name: isTableFee ? TABLE_FEE_NAME : data.name,
          price: Number(data.price),
          description: isTableFee ? TABLE_FEE_DESCRIPTION : (data.description ?? ''),
          imageUrl,
          stock: isTableFee ? Number(TABLE_FEE_STOCK) : Number(data.stock),
          isTableFee,
        });
        toast({
          message: '메뉴 추가가 완료되었습니다.',
          variant: 'info',
        });
        navigate(`/store/operate/${storeId}`);
      } catch (error) {
        const status = (error as { status?: number })?.status;
        toast({
          message: status === 409 ? TABLE_FEE_LIMIT_MESSAGE : '메뉴 추가에 실패했습니다.',
          variant: 'error',
        });
        console.error('Failed to create menu', error);
      }
    },
    [createMenu, hasTableFeeMenu, navigate, storeId, toast, uploadMenuImage],
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
              <input
                type='file'
                accept='image/*'
                hidden
                disabled={isTableFeeCategory}
                {...register('menuImage', {
                  onChange: (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
                    setPreviewUrl((previous) => {
                      if (previous) {
                        URL.revokeObjectURL(previous);
                      }
                      return file ? URL.createObjectURL(file) : null;
                    });
                  },
                })}
              />
              {previewUrl ? (
                <img className={styles.photoPreview} src={previewUrl} alt='메뉴 이미지 미리보기' />
              ) : (
                <PlusIcon className={styles.photoIcon} aria-hidden='true' />
              )}
            </label>
          </div>

          <div className={styles.fields}>
            <Input
              label='메뉴명'
              required
              message={errors.name?.message}
              messageState={errors.name ? 'error' : undefined}
            >
              <Input.Text
                placeholder='내용을 입력해 주세요.'
                disabled={isTableFeeCategory}
                {...register('name', {
                  required: '메뉴명을 입력해 주세요.',
                  maxLength: { value: 20, message: '메뉴명은 최대 20자입니다.' },
                })}
              />
            </Input>

            <div className={styles.row}>
              <Input label='메뉴 가격' required message={errors.price?.message} messageState={priceMessageState}>
                <Input.Text
                  type='text'
                  inputMode='numeric'
                  placeholder='내용을 입력해 주세요.'
                  {...register('price', {
                    required: MESSAGES.MENU.PRICE_REQUIRED,
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
                    },
                  })}
                />
              </Input>
              <Input label='재고' required message={errors.stock?.message} messageState={stockMessageState}>
                <Input.Text
                  type='text'
                  inputMode='numeric'
                  placeholder='수량을 입력해 주세요.'
                  disabled={isTableFeeCategory}
                  {...register('stock', {
                    required: MESSAGES.MENU.STOCK_REQUIRED,
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
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
                type='hidden'
                {...register('categoryId', {
                  valueAsNumber: true,
                  required: '카테고리를 선택해 주세요.',
                })}
              />
              <div className={styles.categoryButtons}>
                <button
                  type='button'
                  className={`${styles.categoryButton} ${
                    categoryId === CATEGORY_MAIN ? styles.categoryButtonActive : ''
                  }`}
                  onClick={() => setMenuCategory(CATEGORY_MAIN)}
                >
                  메인 메뉴
                </button>
                <button
                  type='button'
                  className={`${styles.categoryButton} ${
                    categoryId === CATEGORY_SIDE ? styles.categoryButtonActive : ''
                  }`}
                  onClick={() => setMenuCategory(CATEGORY_SIDE)}
                >
                  사이드 메뉴
                </button>
                <button
                  type='button'
                  className={`${styles.categoryButton} ${
                    categoryId === CATEGORY_TABLE_FEE ? styles.categoryButtonActive : ''
                  }`}
                  disabled={hasTableFeeMenu}
                  onClick={handleTableFeeCategoryClick}
                >
                  테이블비
                </button>
              </div>
              {errors.categoryId?.message && <span className={styles.categoryError}>{errors.categoryId.message}</span>}
              {isTableFeeLimitExceeded && <span className={styles.categoryError}>{TABLE_FEE_LIMIT_MESSAGE}</span>}
            </div>

            <Input
              label='메뉴 설명 (선택)'
              message={errors.description?.message}
              messageState={errors.description ? 'error' : undefined}
            >
              <Input.TextArea
                placeholder={'예시) 우리 주점 최고의 안주,\n둘이 먹다 죽어도 몰라요.\n극강의 매운맛에 도전해 보세요!'}
                disabled={isTableFeeCategory}
                {...register('description', {
                  maxLength: { value: 30, message: '메뉴 설명은 최대 30자입니다.' },
                })}
              />
            </Input>
          </div>
        </div>
        <div className={styles.actions}>
          <Button type='button' variant='ghost' className={styles.cancelButton} onClick={handleCancel}>
            취소
          </Button>
          <Button type='submit' size='md' className={styles.submitButton} disabled={!canSubmit || isSubmitting}>
            메뉴 추가
          </Button>
        </div>{' '}
      </form>

      <Modal open={isTableFeeConfirmOpen} onOpenChange={setIsTableFeeConfirmOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>경고</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className={styles.confirmMessage}>테이블비 카테고리로 변경시</p>
            <p className={styles.confirmMessage}>기존에 입력된 정보는 모두 삭제됩니다.</p>
          </ModalBody>
          <ModalFooter>
            <Button type='button' variant='ghost' fullWidth onClick={() => setIsTableFeeConfirmOpen(false)}>
              취소
            </Button>
            <Button type='button' variant='danger' fullWidth onClick={applyTableFeeCategory}>
              변경
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
