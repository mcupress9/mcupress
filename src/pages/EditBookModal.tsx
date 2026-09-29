import React, { useState, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Save,
  BookOpen,
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
  const [coverImage, setCoverImage] = useState(book.cover_image);
  const [category, setCategory] = useState(book.category || 'พระไตรปิฎกและคัมภีร์ศึกษา');
  const [description, setDescription] = useState(book.description || '');

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!bookName.trim()) errors.push('ชื่อหนังสือต้องไม่ว่าง');
    if (!author.trim()) errors.push('ชื่อผู้แต่งต้องไม่ว่าง');

    const parsedPages = parseInt(pages, 10);
    if (!pages || isNaN(parsedPages) || parsedPages <= 0) {
      errors.push('จำนวนหน้าต้องเป็นตัวเลขมากกว่า 0');
    }

    const parsedYear = parseInt(publishedYear, 10);
    if (!publishedYear || isNaN(parsedYear) || parsedYear < 2400) {
      errors.push('ปีที่พิมพ์ต้องเป็นตัวเลข พ.ศ. ที่ถูกต้อง');
    }

    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push('ราคาต้องเป็นตัวเลข');
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (stockQuantity === '' || isNaN(parsedStock) || parsedStock < 0) {
      errors.push('จำนวนคงเหลือต้องเป็นตัวเลข');
    }

    if (!coverImage.trim()) {
      errors.push('ต้องมีรูปปกหนังสือ');
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      return;
    }

    setIsSubmitting(true);
    setErrorMessages([]);

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
            cover_image: coverImage,
            category,
            description: description.trim(),
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
      } catch (err) {
        console.error('Failed to update book:', err);
        setIsSubmitting(false);
        setErrorMessages(['เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง']);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-rose-100/90 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100 shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                แก้ไขข้อมูลสิ่งพิมพ์
              </h3>
              <p className="text-xs text-slate-400">รหัสสิ่งพิมพ์: {book.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="m-6 mb-0 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessages.length > 0 && (
          <div className="m-6 mb-0 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>โปรดแก้ไขข้อผิดพลาดต่อไปนี้:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {errorMessages.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cover thumbnail & upload */}
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/70 border border-slate-200/80">
            <img
              src={coverImage}
              alt="Cover Preview"
              className="w-16 h-22 object-cover rounded-md shadow-xs border border-slate-200 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200';
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-xs font-bold text-rose-800 transition-colors cursor-pointer shadow-xs"
              >
                เลือกรูปใหม่จากเครื่อง
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อหนังสือ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ผู้แต่ง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
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
                onChange={(e) => setPages(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ปีที่พิมพ์ (พ.ศ.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={publishedYear}
                onChange={(e) => setPublishedYear(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ราคา (บาท) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-bold transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวนคงเหลือ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 font-black text-rose-800 transition-all shadow-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมวดหมู่สิ่งพิมพ์
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer transition-all shadow-xs"
            >
              <option value="พระไตรปิฎกและคัมภีร์ศึกษา">พระไตรปิฎกและคัมภีร์ศึกษา</option>
              <option value="พุทธปรัชญาและสังคม">พุทธปรัชญาและสังคม</option>
              <option value="ประวัติศาสตร์พระพุทธศาสนา">ประวัติศาสตร์พระพุทธศาสนา</option>
              <option value="พุทธจิตวิทยา">พุทธจิตวิทยา</option>
              <option value="สันติศึกษา">สันติศึกษา</option>
              <option value="ภาษาบาลีและสันสกฤต">ภาษาบาลีและสันสกฤต</option>
              <option value="ระเบียบวิธีวิจัยและนวัตกรรม">ระเบียบวิธีวิจัยและนวัตกรรม</option>
              <option value="ตำราเรียนระดับอุดมศึกษา">ตำราเรียนระดับอุดมศึกษา</option>
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
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 focus:bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none transition-all shadow-xs"
            />
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-[#F3DDE7] flex items-center justify-end gap-3">
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
