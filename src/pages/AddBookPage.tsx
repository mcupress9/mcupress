import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  X,
  RotateCcw,
  Save,
  Flame,
  CornerDownRight,
} from 'lucide-react';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';
import { compressImageFile } from '../utils/imageCompressor';

interface AddBookPageProps {
  onSuccess: (book: Book) => void;
  onCancel: () => void;
}

const COVER_PRESETS = [
  {
    name: 'พระไตรปิฎก / คัมภีร์',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    desc: 'โทนคลาสสิกสีทองทอง-น้ำตาล',
  },
  {
    name: 'งานวิจัย / วารสาร มจร',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    desc: 'โทนวิชาการห้องสมุด',
  },
  {
    name: 'ปรัชญา / ธรรมประยุกต์',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    desc: 'โทนวรรณกรรมพุทธศาสน์',
  },
  {
    name: 'ตำราเรียน / คู่มือศึกษา',
    url: 'https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=600&auto=format&fit=crop&q=80',
    desc: 'โทนตำราการศึกษา',
  },
];

const DEFAULT_FALLBACK_COVER = COVER_PRESETS[0].url;

export const AddBookPage: React.FC<AddBookPageProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();

  // Load existing draft if available
  const savedDraft = storageService.getAddBookDraft<any>();

  const [bookName, setBookName] = useState(savedDraft?.bookName || '');
  const [author, setAuthor] = useState(savedDraft?.author || '');
  const [pages, setPages] = useState(savedDraft?.pages || '');
  const [isbn, setIsbn] = useState(savedDraft?.isbn || '');
  const [publishedYear, setPublishedYear] = useState(
    savedDraft?.publishedYear || (new Date().getFullYear() + 543).toString()
  );
  const [price, setPrice] = useState(savedDraft?.price || '');
  const [stockQuantity, setStockQuantity] = useState(savedDraft?.stockQuantity || '10');
  const [coverImage, setCoverImage] = useState(savedDraft?.coverImage || '');
  const [category, setCategory] = useState(
    savedDraft?.category || 'พระไตรปิฎกและคัมภีร์ศึกษา'
  );
  const [description, setDescription] = useState(savedDraft?.description || '');
  const [isBestseller, setIsBestseller] = useState(savedDraft?.isBestseller || false);
  const [salesCount, setSalesCount] = useState(savedDraft?.salesCount || '0');

  const [hasRestoredDraft, setHasRestoredDraft] = useState(
    Boolean(savedDraft && (savedDraft.bookName || savedDraft.author))
  );
  const [draftSavedTime, setDraftSavedTime] = useState<string>('');

  // Field-level error validation mapping
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field references for smooth auto-scrolling to errors
  const bookNameRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  const publishedYearRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockQuantityRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomErrorRef = useRef<HTMLDivElement>(null);

  // Clear specific field error on user input
  const handleFieldChange = (field: string, setter: (val: any) => void, val: any) => {
    setter(val);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Auto-save form progress to localStorage in real-time
  useEffect(() => {
    const hasContent =
      bookName.trim() ||
      author.trim() ||
      pages.trim() ||
      isbn.trim() ||
      price.trim() ||
      description.trim() ||
      coverImage.trim();

    if (hasContent) {
      storageService.saveAddBookDraft({
        bookName,
        author,
        pages,
        isbn,
        publishedYear,
        price,
        stockQuantity,
        coverImage,
        category,
        description,
        isBestseller,
        salesCount,
        savedAt: new Date().toISOString(),
      });
      const now = new Date();
      setDraftSavedTime(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
  }, [
    bookName,
    author,
    pages,
    isbn,
    publishedYear,
    price,
    stockQuantity,
    coverImage,
    category,
    description,
    isBestseller,
    salesCount,
  ]);

  const handleClearDraft = () => {
    if (window.confirm('ท่านต้องการล้างข้อมูลแบบร่างที่กรอกไว้ทั้งหมดใช่หรือไม่?')) {
      storageService.clearAddBookDraft();
      setBookName('');
      setAuthor('');
      setPages('');
      setIsbn('');
      setPublishedYear((new Date().getFullYear() + 543).toString());
      setPrice('');
      setStockQuantity('10');
      setCoverImage('');
      setCategory('พระไตรปิฎกและคัมภีร์ศึกษา');
      setDescription('');
      setIsBestseller(false);
      setSalesCount('0');
      setHasRestoredDraft(false);
      setDraftSavedTime('');
      setErrorMessages([]);
      setFieldErrors({});
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setCoverImage(compressed);
        setErrorMessages([]);
        if (fieldErrors['coverImage']) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.coverImage;
            return next;
          });
        }
      } catch (err) {
        console.warn('Failed to compress image:', err);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file);
        setCoverImage(compressed);
        setErrorMessages([]);
      } catch (err) {
        console.warn('Failed to compress dropped image:', err);
      }
    }
  };

  const scrollToField = (fieldName: string) => {
    let targetEl: HTMLElement | null = null;
    if (fieldName === 'bookName') targetEl = bookNameRef.current;
    else if (fieldName === 'author') targetEl = authorRef.current;
    else if (fieldName === 'publishedYear') targetEl = publishedYearRef.current;
    else if (fieldName === 'pages') targetEl = pagesRef.current;
    else if (fieldName === 'price') targetEl = priceRef.current;
    else if (fieldName === 'stockQuantity') targetEl = stockQuantityRef.current;

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    const newFieldErrors: Record<string, string> = {};

    // 1. Validate Book Name
    if (!bookName.trim()) {
      newFieldErrors.bookName = 'กรุณากรอกชื่อหนังสือ (จำเป็น)';
      errors.push('ชื่อหนังสือ: ต้องระบุชื่อหนังสือ');
    }

    // 2. Validate Author
    if (!author.trim()) {
      newFieldErrors.author = 'กรุณากรอกชื่อผู้แต่ง / บรรณาธิการ (จำเป็น)';
      errors.push('ผู้แต่ง: ต้องระบุชื่อผู้แต่งหรือบรรณาธิการ');
    }

    // 3. Validate Published Year
    const parsedYear = parseInt(publishedYear, 10);
    if (!publishedYear.toString().trim() || isNaN(parsedYear) || parsedYear < 2400 || parsedYear > 2700) {
      newFieldErrors.publishedYear = 'กรุณากรอกปีที่พิมพ์เป็น พ.ศ. ให้ถูกต้อง (เช่น 2567)';
      errors.push('ปีที่พิมพ์: ต้องเป็นตัวเลข พ.ศ. (ระหว่าง 2400 - 2700)');
    }

    // 4. Validate Pages
    const parsedPages = parseInt(pages, 10);
    if (!pages.toString().trim() || isNaN(parsedPages) || parsedPages <= 0) {
      newFieldErrors.pages = 'กรุณากรอกจำนวนหน้าเป็นตัวเลขที่มากกว่า 0';
      errors.push('จำนวนหน้า: ต้องเป็นตัวเลขที่มากกว่า 0');
    }

    // 5. Validate Price
    const parsedPrice = parseFloat(price);
    if (price.toString().trim() === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      newFieldErrors.price = 'กรุณากรอกราคาปกเป็นตัวเลข 0 ขึ้นไป';
      errors.push('ราคา: ต้องเป็นตัวเลข (ไม่น้อยกว่า 0 บาท)');
    }

    // 6. Validate Initial Stock Quantity
    const parsedStock = parseInt(stockQuantity, 10);
    if (stockQuantity.toString().trim() === '' || isNaN(parsedStock) || parsedStock < 0) {
      newFieldErrors.stockQuantity = 'กรุณากรอกจำนวนสต๊อกเริ่มต้นเป็นตัวเลข 0 ขึ้นไป';
      errors.push('จำนวนคงเหลือสต๊อก: ต้องเป็นตัวเลข (ไม่น้อยกว่า 0 เล่ม)');
    }

    // Set errors and handle auto-focus
    setFieldErrors(newFieldErrors);

    if (errors.length > 0) {
      setErrorMessages(errors);

      // Auto focus and scroll to the first invalid field
      if (newFieldErrors.bookName) {
        bookNameRef.current?.focus();
        bookNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.author) {
        authorRef.current?.focus();
        authorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.publishedYear) {
        publishedYearRef.current?.focus();
        publishedYearRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.pages) {
        pagesRef.current?.focus();
        pagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.price) {
        priceRef.current?.focus();
        priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newFieldErrors.stockQuantity) {
        stockQuantityRef.current?.focus();
        stockQuantityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // If coverImage is not provided, use a default fallback
    const finalCoverImage = coverImage.trim() ? coverImage.trim() : DEFAULT_FALLBACK_COVER;

    setIsSubmitting(true);
    setErrorMessages([]);
    setFieldErrors({});

    (async () => {
      try {
        const newBook = await storageService.addBook(
          {
            book_name: bookName.trim(),
            author: author.trim(),
            pages: parsedPages,
            isbn: isbn.trim(),
            published_year: parsedYear,
            price: parsedPrice,
            cover_image: finalCoverImage,
            stock_quantity: parsedStock,
            created_by: currentUser?.name || 'เจ้าหน้าที่สำนักพิมพ์',
            category,
            description: description.trim(),
            is_bestseller: isBestseller,
            sales_count: parseInt(salesCount, 10) || 0,
          },
          currentUser?.name || 'เจ้าหน้าที่สำนักพิมพ์'
        );

        setSuccessMessage('บันทึกข้อมูลหนังสือใหม่เรียบร้อยแล้ว');
        storageService.clearAddBookDraft();
        setIsSubmitting(false);

        setTimeout(() => {
          onSuccess(newBook);
        }, 500);
      } catch (err: any) {
        console.error('Failed to add book:', err);
        setIsSubmitting(false);
        const serverError = err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง';
        setErrorMessages([serverError]);
        bottomErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    })();
  };

  const hasErrors = Object.keys(fieldErrors).length > 0 || errorMessages.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-12 sm:pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-[12px] text-[#64748B] hover:text-[#ED1760] hover:bg-[#FCE7F3] border border-[#F3DDE7] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#111827] tracking-tight">
              ลงทะเบียนเพิ่มหนังสือใหม่
            </h2>
            <p className="text-[11px] sm:text-sm text-[#64748B] mt-0.5">
              สำนักพิมพ์มหาวิทยาลัยมหาจุฬาลงกรณราชวิทยาลัย
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-[16px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center gap-2.5 sm:gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
          <div>
            <div className="font-bold text-xs sm:text-sm">{successMessage}</div>
            <div className="text-[11px] sm:text-xs text-[#059669]">
              กำลังนำท่านไปยังรายละเอียดหนังสือ...
            </div>
          </div>
        </div>
      )}

      {/* Draft Notification Banner */}
      {hasRestoredDraft && !successMessage && (
        <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-[16px] bg-[#FCE7F3] border border-[#F3DDE7] text-[#ED1760] flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ED1760] flex-shrink-0" />
            <span className="text-[11px] sm:text-xs">
              ระบบได้กู้คืนข้อมูลแบบร่างอัตโนมัติล่าสุดให้คุณแล้ว
              {draftSavedTime && ` (${draftSavedTime} น.)`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-[11px] sm:text-xs font-bold text-[#ED1760] hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างร่าง</span>
          </button>
        </div>
      )}

      {/* Top Error Alert Banner if any errors */}
      {hasErrors && (
        <div className="p-4 rounded-xl sm:rounded-[16px] bg-[#FEF2F2] border-2 border-[#FECACA] text-[#991B1B] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
            <span>กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง (พบ {Object.keys(fieldErrors).length || errorMessages.length} จุดที่ต้องแก้ไข):</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <button
                type="button"
                key={field}
                onClick={() => scrollToField(field)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#F87171] text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer shadow-2xs"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>{msg}</span>
              </button>
            ))}
            {errorMessages.filter((m) => !Object.values(fieldErrors).some((fe) => m.includes(fe))).map((err, i) => (
              <span key={i} className="text-xs font-semibold text-red-700 bg-white px-2.5 py-1 rounded-md border border-red-200">
                {err}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Form - noValidate prevents silent browser blocking */}
      <form noValidate onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Card 1: Book Info */}
        <div className="bg-white p-4 sm:p-7 rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-4">
          <div className="border-b border-[#F3DDE7]/60 pb-3 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-[#111827]">
              ข้อมูลทางวิชาการและสิ่งพิมพ์
            </h3>
            <span className="text-[11px] text-[#64748B]">
              ช่องที่มีเครื่องหมาย <span className="text-[#ED1760] font-bold">*</span> จำเป็นต้องกรอก
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Book Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ชื่อหนังสือ (Book Name) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={bookNameRef}
                type="text"
                value={bookName}
                onChange={(e) => handleFieldChange('bookName', setBookName, e.target.value)}
                placeholder="เช่น พระไตรปิฎกฉบับภาษาไทย มหาจุฬาลงกรณราชวิทยาลัย"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.bookName
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.bookName && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.bookName}</span>
                </p>
              )}
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ผู้แต่ง / บรรณาธิการ (Author) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={authorRef}
                type="text"
                value={author}
                onChange={(e) => handleFieldChange('author', setAuthor, e.target.value)}
                placeholder="เช่น คณะกรรมการการตรวจชำระพระไตรปิฎก มจร"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.author
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.author && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.author}</span>
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                หมวดหมู่หนังสือ <span className="text-[#ED1760]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760] cursor-pointer"
              >
                <option value="พระไตรปิฎกและคัมภีร์ศึกษา">พระไตรปิฎกและคัมภีร์ศึกษา</option>
                <option value="พระพุทธศาสนากับปรัชญา">พระพุทธศาสนากับปรัชญา</option>
                <option value="ประวัติศาสตร์และการศึกษา">ประวัติศาสตร์และการศึกษา</option>
                <option value="ตำราเรียนและคู่มือวิชาการ">ตำราเรียนและคู่มือวิชาการ</option>
                <option value="การปฏิบัติวิปัสสนากรรมฐาน">การปฏิบัติวิปัสสนากรรมฐาน</option>
                <option value="วรรณกรรมทางพระพุทธศาสนา">วรรณกรรมทางพระพุทธศาสนา</option>
                <option value="ทั่วไป">ทั่วไป</option>
              </select>
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                รหัส ISBN <span className="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="เช่น 978-616-300-xxx-x"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
              />
            </div>

            {/* Published Year */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ปีที่พิมพ์ (พ.ศ.) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={publishedYearRef}
                type="number"
                value={publishedYear}
                onChange={(e) => handleFieldChange('publishedYear', setPublishedYear, e.target.value)}
                placeholder="เช่น 2567"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.publishedYear
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.publishedYear && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.publishedYear}</span>
                </p>
              )}
            </div>

            {/* Pages */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                จำนวนหน้า <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={pagesRef}
                type="number"
                min="1"
                value={pages}
                onChange={(e) => handleFieldChange('pages', setPages, e.target.value)}
                placeholder="เช่น 350"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.pages
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.pages && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.pages}</span>
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ราคาปก (บาท) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={priceRef}
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => handleFieldChange('price', setPrice, e.target.value)}
                placeholder="เช่น 320"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.price
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.price && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.price}</span>
                </p>
              )}
            </div>

            {/* Initial Stock Quantity */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                จำนวนสต๊อกแรกเริ่ม (เล่ม) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                ref={stockQuantityRef}
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => handleFieldChange('stockQuantity', setStockQuantity, e.target.value)}
                placeholder="เช่น 50"
                className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none transition-all ${
                  fieldErrors.stockQuantity
                    ? 'border-red-500 bg-red-50/30 ring-2 ring-red-400/30'
                    : 'border-[#F3DDE7] bg-[#FCF8FA] focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]'
                }`}
              />
              {fieldErrors.stockQuantity && (
                <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{fieldErrors.stockQuantity}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                เนื้อหาย่อ / คำอธิบายหนังสือ <span className="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="สรุปสังเขปเนื้อหา ประเด็นสำคัญ หรือวัตถุประสงค์ในการจัดพิมพ์..."
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
              />
            </div>

            {/* Bestseller Settings */}
            <div className="md:col-span-2 p-4 rounded-[16px] bg-gradient-to-r from-[#FFF1F7] via-white to-[#FCE7F3]/40 border border-[#F3DDE7] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[#ED1760] text-white flex items-center justify-center shadow-xs">
                    <Flame className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#111827]">
                      ตั้งเป็นหนังสือขายดี (Best Seller)
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      เปิดใช้งานเพื่อให้แสดงในส่วน &quot;หนังสือขายดี&quot; บนหน้าหลักและแคตตาล็อก
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
                <div className="pt-2 border-t border-[#F3DDE7]/60">
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    ยอดจำหน่ายสะสม (เล่ม)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={salesCount}
                    onChange={(e) => setSalesCount(e.target.value)}
                    placeholder="เช่น 1200"
                    className="w-full sm:w-60 px-3.5 py-2 rounded-[12px] border border-[#F3DDE7] bg-white text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                  />
                  <p className="text-[10px] text-[#64748B] mt-1">
                    ตัวเลขยอดจำหน่ายสำหรับจัดอันดับหนังสือขายดีประจำสำนักพิมพ์
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Cover Image (Optional with Presets & Auto Fallback) */}
        <div className="bg-white p-4 sm:p-7 rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-4">
          <div className="border-b border-[#F3DDE7]/60 pb-3 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-[#111827] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#ED1760]" />
              <span>รูปปกหนังสือ</span>
            </h3>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              ไม่บังคับ (หากไม่ใส่ ระบบจะใส่ภาพปกมาตรฐาน มจร ให้อัตโนมัติ)
            </span>
          </div>

          {/* Quick Presets Selection */}
          <div>
            <label className="block text-xs font-bold text-[#111827] mb-1.5">
              เลือกภาพปกสำเร็จรูปด่วน (คลิกเลือกได้ทันที):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCoverImage(preset.url)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    coverImage === preset.url
                      ? 'border-[#ED1760] bg-[#FFF1F7] ring-2 ring-[#ED1760]/30 shadow-xs'
                      : 'border-[#F3DDE7] bg-[#FCF8FA] hover:border-[#ED1760]/50 hover:bg-white'
                  }`}
                >
                  <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 mb-1.5 border border-[#F3DDE7]">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] font-bold text-[#111827] truncate">{preset.name}</div>
                  <div className="text-[9px] text-[#64748B] truncate">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start pt-2">
            {/* Upload Zone */}
            <div className="md:col-span-7 space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#F3DDE7] hover:border-[#ED1760] rounded-[16px] p-5 text-center bg-[#FCF8FA] hover:bg-[#FCE7F3]/30 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#111827]">
                  คลิกเพื่อเลือกไฟล์ หรือ ลากรูปปกมาวางที่นี่
                </div>
                <p className="text-[11px] text-[#64748B]">รองรับ PNG, JPG, WebP</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Or manual URL */}
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                  หรือวาง URL รูปภาพปกออนไลน์
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-3.5 py-2 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#ED1760]"
                />
              </div>
            </div>

            {/* Cover Preview */}
            <div className="md:col-span-5 flex flex-col items-center">
              <span className="text-xs font-bold text-[#64748B] mb-2">ภาพตัวอย่างปกหนังสือ</span>
              <div className="w-32 h-44 rounded-[12px] overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-sm flex items-center justify-center relative">
                {coverImage ? (
                  <>
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={() => setErrorMessages(['ไม่สามารถโหลดรูปภาพจาก URL ที่ระบุได้'])}
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                      title="ล้างรูป"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400 flex flex-col items-center justify-center">
                    <ImageIcon className="w-7 h-7 mb-1 opacity-50" />
                    <span className="text-[10px] text-slate-500 font-medium">ใช้ภาพปกมาตรฐานอัตโนมัติ</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ERROR SUMMARY BANNER (Directly above Action Buttons) */}
        {hasErrors && (
          <div
            ref={bottomErrorRef}
            className="p-4 rounded-xl sm:rounded-[16px] bg-[#FEF2F2] border-2 border-[#FECACA] text-[#991B1B] shadow-sm animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[#DC2626]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                ยังไม่สามารถบันทึกได้ กรุณากรอกหรือแก้ไขข้อมูล {Object.keys(fieldErrors).length || errorMessages.length} จุดนี้:
              </span>
            </div>
            <ul className="mt-2.5 space-y-1.5 pl-2 text-xs">
              {Object.entries(fieldErrors).map(([field, msg]) => (
                <li key={field} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollToField(field)}
                    className="inline-flex items-center gap-1.5 text-left font-bold text-[#DC2626] hover:underline cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5 flex-shrink-0 text-[#EF4444]" />
                    <span>{msg}</span>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-normal">
                      คลิกเพื่อไปที่ช่องนี้
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-[12px] border border-[#F3DDE7] text-[#64748B] hover:bg-[#FCF8FA] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-2.5 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#ED1760]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลหนังสือ'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
