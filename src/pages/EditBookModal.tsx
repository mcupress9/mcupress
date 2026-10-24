import React, { useState, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Flame,
  CornerDownRight,
} from 'lucide-react';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';

interface EditBookModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedBook: Book) => void;
}

const DEFAULT_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

export const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [bookName, setBookName] = useState(book.book_name);
  const [author, setAuthor] = useState(book.author);
  const [pages, setPages] = useState(book.pages.toString());
  const [isbn, setIsbn] = useState(book.isbn || '');
  const [publishedYear, setPublishedYear] = useState(book.published_year.toString());
  const [price, setPrice] = useState(book.price.toString());
  const [stockQuantity, setStockQuantity] = useState(book.stock_quantity.toString());
  const [coverImage, setCoverImage] = useState(book.cover_image || DEFAULT_FALLBACK_COVER);
  const [category, setCategory] = useState(book.category || 'พระไตรปิฎกและคัมภีร์ศึกษา');
  const [description, setDescription] = useState(book.description || '');
  const [isBestseller, setIsBestseller] = useState(book.is_bestseller || false);
  const [salesCount, setSalesCount] = useState((book.sales_count || 0).toString());

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFieldChange = (field: string, setter: (val: any) => void, val: any) => {
    setter(val);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errorMessages.length > 0) {
      setErrorMessages([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
        setErrorMessages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    if (!bookName.trim()) {
      newFieldErrors.bookName = 'กรุณาระบุชื่อหนังสือ';
      errors.push('ชื่อหนังสือต้องไม่ว่าง');
    }

    if (!author.trim()) {
      newFieldErrors.author = 'กรุณาระบุชื่อผู้แต่ง / บรรณาธิการ';
      errors.push('ชื่อผู้แต่งต้องไม่ว่าง');
    }

    const parsedPages = parseInt(pages, 10);
    if (!pages.toString().trim() || isNaN(parsedPages) || parsedPages <= 0) {
      newFieldErrors.pages = 'กรุณาระบุจำนวนหน้าเป็นตัวเลขมากกว่า 0';
      errors.push('จำนวนหน้าต้องเป็นตัวเลขมากกว่า 0');
    }

    const parsedYear = parseInt(publishedYear, 10);
    if (!publishedYear.toString().trim() || isNaN(parsedYear) || parsedYear < 2400 || parsedYear > 2700) {
      newFieldErrors.publishedYear = 'กรุณาระบุปีที่พิมพ์ พ.ศ. (ระหว่าง 2400-2700)';
      errors.push('ปีที่พิมพ์ต้องเป็นตัวเลข พ.ศ. ที่ถูกต้อง');
    }

    const parsedPrice = parseFloat(price);
    if (price.toString().trim() === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      newFieldErrors.price = 'กรุณาระบุราคาปกเป็นตัวเลข 0 ขึ้นไป';
      errors.push('ราคาต้องเป็นตัวเลข');
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (stockQuantity.toString().trim() === '' || isNaN(parsedStock) || parsedStock < 0) {
      newFieldErrors.stockQuantity = 'กรุณาระบุจำนวนคงเหลือสต๊อกเป็นตัวเลข 0 ขึ้นไป';
      errors.push('จำนวนคงเหลือต้องเป็นตัวเลข');
    }

    setFieldErrors(newFieldErrors);

    if (errors.length > 0) {
      setErrorMessages(errors);
      return;
    }

    const finalCover = coverImage.trim() ? coverImage.trim() : DEFAULT_FALLBACK_COVER;

    setIsSubmitting(true);
    setErrorMessages([]);
    setFieldErrors({});

    (async () => {
      try {
        const updated = await storageService.updateBook(
          book.id,
          {
            book_name: bookName.trim(),
            author: author.trim(),
            pages: parsedPages,
            isbn: isbn.trim(),
            published_year: parsedYear,
            price: parsedPrice,
            stock_quantity: parsedStock,
            cover_image: finalCover,
            category,
            description: description.trim(),
            is_bestseller: isBestseller,
            sales_count: parseInt(salesCount, 10) || 0,
          },
          currentUser?.name || 'เจ้าหน้าที่'
        );

        setIsSubmitting(false);

        if (updated) {
          setSuccessMessage('บันทึกการแก้ไขเรียบร้อยแล้ว');
          setTimeout(() => {
            onSaved(updated);
            onClose();
          }, 500);
        }
      } catch (err: any) {
        console.error('Failed to update book:', err);
        setIsSubmitting(false);
        setErrorMessages([err?.message || 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง']);
      }
    })();
  };

  const hasErrors = Object.keys(fieldErrors).length > 0 || errorMessages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl sm:rounded-3xl border border-rose-100/90 shadow-2xl overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-5 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                แก้ไขข้อมูลสิ่งพิมพ์
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">รหัสสิ่งพิมพ์: {book.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="m-4 sm:m-6 mb-0 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Form */}
        <form noValidate onSubmit={handleSave} className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Cover thumbnail & upload */}
          <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <img
              src={coverImage}
              alt="Cover Preview"
              className="w-12 h-16 sm:w-16 sm:h-22 object-cover rounded-md shadow-xs border border-slate-200 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_COVER;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 mb-1">เปลี่ยนรูปปกหนังสือ</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-xs font-bold text-rose-800 transition-colors cursor-pointer shadow-xs"
                >
                  เลือกรูปใหม่
                </button>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="URL รูปภาพ"
                  className="flex-1 min-w-[140px] px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อหนังสือ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => handleFieldChange('bookName', setBookName, e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none transition-all shadow-xs ${
                fieldErrors.bookName
                  ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                  : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
              }`}
            />
            {fieldErrors.bookName && (
              <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.bookName}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ผู้แต่ง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => handleFieldChange('author', setAuthor, e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none transition-all shadow-xs ${
                  fieldErrors.author
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
                }`}
              />
              {fieldErrors.author && (
                <p className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.author}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนหน้า <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => handleFieldChange('pages', setPages, e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 focus:outline-none transition-all shadow-xs ${
                  fieldErrors.pages
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
                }`}
              />
              {fieldErrors.pages && (
                <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.pages}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ปีพิมพ์ (พ.ศ.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={publishedYear}
                onChange={(e) => handleFieldChange('publishedYear', setPublishedYear, e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 focus:outline-none transition-all shadow-xs ${
                  fieldErrors.publishedYear
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
                }`}
              />
              {fieldErrors.publishedYear && (
                <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.publishedYear}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ราคา (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => handleFieldChange('price', setPrice, e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 focus:outline-none font-bold transition-all shadow-xs ${
                  fieldErrors.price
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
                }`}
              />
              {fieldErrors.price && (
                <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนคงเหลือ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => handleFieldChange('stockQuantity', setStockQuantity, e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-slate-900 focus:outline-none font-black text-rose-800 transition-all shadow-xs ${
                  fieldErrors.stockQuantity
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-slate-200/90 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-rose-400'
                }`}
              />
              {fieldErrors.stockQuantity && (
                <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors.stockQuantity}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมวดหมู่สิ่งพิมพ์
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer transition-all shadow-xs"
            >
              <option value="พระไตรปิฎกและคัมภีร์ศึกษา">พระไตรปิฎกและคัมภีร์ศึกษา</option>
              <option value="พุทธปรัชญาและสังคม">พุทธปรัชญาและสังคม</option>
              <option value="ประวัติศาสตร์พระพุทธศาสนา">ประวัติศาสตร์พระพุทธศาสนา</option>
              <option value="พุทธจิตวิทยา">พุทธจิตวิทยา</option>
              <option value="สันติศึกษา">สันติศึกษา</option>
              <option value="ภาษาบาลีและสันสกฤต">ภาษาบาลีและสันสกฤต</option>
              <option value="ระเบียบวิธีวิจัยและนวัตกรรม">ระเบียบวิธีวิจัยและนวัตกรรม</option>
              <option value="ตำราเรียนระดับอุดมศึกษา">ตำราเรียนระดับอุดมศึกษา</option>
              <option value="ทั่วไป">ทั่วไป</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              คำอธิบายสังเขป
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none transition-all shadow-xs"
            />
          </div>

          {/* Bestseller Settings */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50/50 via-white to-pink-50/40 border border-rose-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ED1760] text-white flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                    ตั้งเป็นหนังสือขายดี (Best Seller)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ติดป้าย &quot;ขายดี&quot; และแสดงในส่วนหนังสือยอดนิยม
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ED1760]"></div>
              </label>
            </div>

            {isBestseller && (
              <div className="pt-2 border-t border-rose-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ยอดจำหน่ายสะสม (เล่ม)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salesCount}
                  onChange={(e) => setSalesCount(e.target.value)}
                  placeholder="เช่น 1450"
                  className="w-full sm:w-60 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                />
              </div>
            )}
          </div>

          {/* Error Summary Banner if needed */}
          {hasErrors && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {Object.keys(fieldErrors).length > 0
                    ? 'ยังมีข้อมูลที่ไม่ถูกต้อง กรุณาตรวจสอบ:'
                    : 'ข้อความแจ้งเตือนจากระบบ:'}
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs pl-1">
                {Object.values(fieldErrors).map((msg, i) => (
                  <li key={`field-${i}`} className="text-red-700 font-medium">
                    {msg}
                  </li>
                ))}
                {errorMessages.map((msg, i) => (
                  <li key={`server-${i}`} className="text-red-700 font-medium">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-3 border-t border-[#F3DDE7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[12px] border border-[#F3DDE7] text-[#64748B] hover:bg-[#FCF8FA] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#ED1760]/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
