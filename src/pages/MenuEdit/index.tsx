import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import PlusIcon from '@/assets/icons/plus.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useDeleteMenu } from '@/pages/MenuEdit/hooks/useDeleteMenu';
import { useMenuById } from '@/pages/MenuEdit/hooks/useMenuById';
import { useUpdateMenu } from '@/pages/MenuEdit/hooks/useUpdateMenu';
import { MESSAGES, REGEX } from '@/static/validation';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './MenuEdit.module.scss';

const CATEGORY_MAIN = 1;
const CATEGORY_SIDE = 2;

export interface MenuEditForm {
  name: string;
  price: string;
  stock: string;
  categoryId: number;
  description?: string;
  menuImage?: FileList;
}

export default function MenuEdit() {
  const navigate = useNavigate();
  const { id, menuId } = useParams();
  const parsedStoreId = id ? Number(id) : undefined;
  const parsedMenuId = menuId ? Number(menuId) : undefined;
  const storeId = Number.isFinite(parsedStoreId) ? parsedStoreId : undefined;
  const resolvedMenuId = Number.isFinite(parsedMenuId) ? parsedMenuId : undefined;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { data: menuDetail, isError: isMenuError } = useMenuById(resolvedMenuId);
  const { mutateAsync: updateMenu } = useUpdateMenu();
  const { mutateAsync: deleteMenu, isPending: isDeleting } = useDeleteMenu();
  const { toast } = useToast();
  const { upload } = usePresignedUploader();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MenuEditForm>({
    mode: 'onBlur',
    defaultValues: {
      categoryId: CATEGORY_MAIN,
    },
  });

  useEffect(() => {
    if (!menuDetail) return;
    reset({
      name: menuDetail.name,
      price: String(menuDetail.price),
      stock: String(menuDetail.stock),
      categoryId: menuDetail.categoryId,
      description: menuDetail.description ?? '',
    });
  }, [menuDetail, reset]);

  const menuName = useWatch({ control, name: 'name' });
  const menuPrice = useWatch({ control, name: 'price' });
  const menuStock = useWatch({ control, name: 'stock' });
  const categoryId = useWatch({ control, name: 'categoryId' });

  const isPriceFormatError = errors.price?.message === MESSAGES.MENU.NUMBER_ONLY;
  const isStockFormatError = errors.stock?.message === MESSAGES.MENU.NUMBER_ONLY;

  const priceMessageState = isPriceFormatError ? 'warning' : errors.price ? 'error' : undefined;
  const stockMessageState = isStockFormatError ? 'warning' : errors.stock ? 'error' : undefined;

  const isPriceValid = typeof menuPrice === 'string' && REGEX.NUMBER_ONLY.test(menuPrice);
  const isStockValid = typeof menuStock === 'string' && REGEX.NUMBER_ONLY.test(menuStock);

  const isNameValid = typeof menuName === 'string' && menuName.trim().length > 0;
  const isCategoryValid = typeof categoryId === 'number' && categoryId > 0;
  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit =
    !!storeId &&
    !!resolvedMenuId &&
    !!menuDetail &&
    isNameValid &&
    isPriceValid &&
    isStockValid &&
    isCategoryValid &&
    !hasErrors;

  const handleCancel = () => {
    if (storeId) {
      navigate(`/store/operate/${storeId}`);
    } else {
      navigate(-1);
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (isDeleting) return;
    setIsDeleteOpen(open);
  };

  const handleConfirmDelete = async () => {
    if (!storeId || !resolvedMenuId) return;
    try {
      await deleteMenu(resolvedMenuId);
      toast({
        message: '메뉴가 삭제되었습니다.',
        variant: 'success',
      });
      navigate(`/store/operate/${storeId}`);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const errorMessage =
        status === 401
          ? '로그인이 필요합니다.'
          : status === 403
            ? '내 주점과 일치하지 않습니다.'
            : status === 404
              ? '메뉴를 찾을 수 없습니다.'
              : '메뉴 삭제에 실패했습니다.';

      toast({
        message: errorMessage,
        variant: 'error',
      });
      console.error('Failed to delete menu', error);
    } finally {
      setIsDeleteOpen(false);
    }
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
        return menuDetail?.imageUrl ?? '';
      }

      const file = menuImage[0];
      return await upload({
        directory: 'menus',
        fileName: file.name,
        file,
        errorMessage: 'Failed to upload menu image.',
      });
    },
    [menuDetail?.imageUrl, upload],
  );

  const handleSubmitMenu = useCallback<SubmitHandler<MenuEditForm>>(
    async (data) => {
      if (!storeId || !resolvedMenuId || !menuDetail) return;
      try {
        const imageUrl = await uploadMenuImage(data.menuImage);
        await updateMenu({
          menuId: resolvedMenuId,
          body: {
            categoryId: data.categoryId,
            name: data.name,
            price: Number(data.price),
            description: data.description ?? '',
            imageUrl,
            initialStock: menuDetail.initialStock,
            stock: Number(data.stock),
            isSoldOut: Number(data.stock) === 0,
          },
        });
        toast({
          message: '메뉴가 수정되었습니다.',
          variant: 'info',
        });
        navigate(`/store/operate/${storeId}`);
      } catch (error) {
        const status = (error as { status?: number })?.status;
        const errorMessage =
          status === 401
            ? '인증이 필요합니다.'
            : status === 403
              ? '본인 매장이 아닙니다.'
              : status === 404
                ? '메뉴를 찾을 수 없습니다.'
                : '메뉴 수정에 실패했습니다.';

        toast({
          message: errorMessage,
          variant: 'error',
        });
        console.error('Failed to update menu', error);
      }
    },
    [storeId, resolvedMenuId, menuDetail, uploadMenuImage, updateMenu, navigate, toast],
  );

  const previewImage = previewUrl ?? menuDetail?.imageUrl;
  console.log('previewImage:', previewImage);

  return (
    <section className={styles.menuEdit}>
      <header className={styles.header}>
        <h2 className={styles.title}>메뉴 수정</h2>
        <Button
          type="button"
          variant="danger"
          onClick={() => setIsDeleteOpen(true)}
          disabled={!resolvedMenuId || !storeId || isDeleting}
        >
          메뉴 삭제
        </Button>
      </header>
      <div className={styles.divider} />

      {isMenuError && <p className={styles.loadError}>메뉴 정보를 불러오지 못했어요.</p>}

      <form className={styles.form} onSubmit={handleSubmit(handleSubmitMenu)}>
        <div className={styles.formBody}>
          <div className={styles.photoSection}>
            <div className={styles.photoLabel}>메뉴 사진</div>
            <p className={styles.photoHelp}>메뉴 사진이 없으면 기본 사진으로 대체됩니다.</p>
            <label className={styles.photoUpload}>
              <input
                type="file"
                accept="image/*"
                hidden
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
              {previewImage ? (
                <img className={styles.photoPreview} src={previewImage} alt="메뉴 이미지 미리보기" />
              ) : (
                <PlusIcon className={styles.photoIcon} aria-hidden="true" />
              )}
            </label>
          </div>

          <div className={styles.fields}>
            <Input
              label="메뉴명"
              required
              message={errors.name?.message}
              messageState={errors.name ? 'error' : undefined}
            >
              <Input.Text
                placeholder="내용을 입력해 주세요."
                {...register('name', {
                  required: '메뉴명을 입력해 주세요.',
                })}
              />
            </Input>

            <div className={styles.row}>
              <Input label="메뉴 가격" required message={errors.price?.message} messageState={priceMessageState}>
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="내용을 입력해 주세요."
                  {...register('price', {
                    required: MESSAGES.MENU.PRICE_REQUIRED,
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
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
          <Button type="submit" size="md" className={styles.submitButton} disabled={!canSubmit || isSubmitting}>
            수정 완료
          </Button>
        </div>
      </form>

      <Modal open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
        <ModalContent className={styles.deleteModalContent}>
          <ModalBody className={styles.deleteModalBody}>
            <p className={styles.deleteModalMessage}>해당 메뉴를 정말로 삭제하시겠습니까?</p>
          </ModalBody>
          <ModalFooter className={styles.deleteModalFooter}>
            <Button
              type="button"
              variant="danger"
              className={styles.deleteModalButton}
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={styles.deleteModalButton}
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
              loadingText="삭제 중..."
            >
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
