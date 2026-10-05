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
} from 'lucide-react';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storage';

interface AddBookPageProps {
  onSuccess: (book: Book) => void;
  onCancel: () => void;
}

export const AddBookPage: React.FC<AddBookPageProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();

  // Load existing draft if available
  const savedDraft = storageService.getAddBookDraft<any>();

  const [bookName, setBookName] = useState(savedDraft?.bookName || '');
  const [author, setAuthor] = useState(savedDraft?.author || '');
  const [pages, setPages] = useState(savedDraft?.pages || '');
  const [isbn, setIsbn] = useState(savedDraft?.isbn || '');
  const [publishedYear, setPublishedYear] = useState(
    savedDraft?.publishedYear || new Date().getFullYear() + 543 + ''
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

  const [hasRestoredDraft, setHasRestoredDraft] = useState(Boolean(savedDraft && (savedDraft.bookName || savedDraft.author)));
  const [draftSavedTime, setDraftSavedTime] = useState<string>('');

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [bookName, author, pages, isbn, publishedYear, price, stockQuantity, coverImage, category, description, isBestseller, salesCount]);

  const handleClearDraft = () => {
    if (window.confirm('ท่านต้องการล้างข้อมูลแบบร่างที่กรอกไว้ทั้งหมดใช่หรือไม่?')) {
      storageService.clearAddBookDraft();
      setBookName('');
      setAuthor('');
      setPages('');
      setIsbn('');
      setPublishedYear(new Date().getFullYear() + 543 + '');
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result as string);
        setErrorMessages([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!bookName.trim()) {
      errors.push('กรุณากรอกชื่อหนังสือ (ชื่อหนังสือต้องไม่ว่าง)');
    }

    if (!author.trim()) {
      errors.push('กรุณากรอกชื่อผู้แต่ง');
    }

    const parsedPages = parseInt(pages, 10);
    if (!pages || isNaN(parsedPages) || parsedPages <= 0) {
      errors.push('จำนวนหน้าต้องเป็นตัวเลขที่มากกว่า 0');
    }

    const parsedYear = parseInt(publishedYear, 10);
    if (!publishedYear || isNaN(parsedYear) || parsedYear < 2400 || parsedYear > 2700) {
      errors.push('ปีที่พิมพ์ต้องเป็นตัวเลข พ.ศ. ที่ถูกต้อง (เช่น 2567)');
    }

    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push('ราคาต้องเป็นตัวเลข (ไม่น้อยกว่า 0)');
    }

    const parsedStock = parseInt(stockQuantity, 10);
    if (stockQuantity === '' || isNaN(parsedStock) || parsedStock < 0) {
      errors.push('จำนวนคงเหลือต้องเป็นตัวเลข (ไม่น้อยกว่า 0)');
    }

    if (!coverImage.trim()) {
      errors.push('กรุณาอัปโหลดรูปปกหนังสือ หรือเลือกภาพตัวอย่าง');
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrorMessages([]);

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
            cover_image: coverImage,
            stock_quantity: parsedStock,
            created_by: currentUser?.name || 'เจ้าหน้าที่สำนักพิมพ์',
            category,
            description: description.trim(),
            is_bestseller: isBestseller,
            sales_count: parseInt(salesCount, 10) || 0,
          },
          currentUser?.name || 'เจ้าหน้าที่สำนักพิมพ์'
        );

        setSuccessMessage('บันทึกข้อมูลหนังสือเรียบร้อยแล้ว');
        storageService.clearAddBookDraft();
        setIsSubmitting(false);

        setTimeout(() => {
          onSuccess(newBook);
        }, 500);
      } catch (err) {
        console.error('Failed to add book:', err);
        setIsSubmitting(false);
        setErrorMessages(['เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง']);
      }
    })();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 pb-8 sm:pb-12">
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
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981] flex-shrink-0" />
          <div>
            <div className="font-bold text-xs sm:text-sm">{successMessage}</div>
            <div className="text-[11px] sm:text-xs text-[#059669]">กำลังนำท่านไปยังรายละเอียดหนังสือ...</div>
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
            <span>ล้าง</span>
          </button>
        </div>
      )}

      {/* Error Messages Banner */}
      {errorMessages.length > 0 && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-[16px] bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#EF4444]" />
            <span>กรุณาตรวจสอบข้อมูลและแก้ไขข้อผิดพลาดดังต่อไปนี้:</span>
          </div>
          <ul className="list-disc list-inside text-[11px] sm:text-xs space-y-0.5 pl-4 sm:pl-6 font-medium">
            {errorMessages.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
        {/* Card 1: Book Info */}
        <div className="bg-white p-3.5 sm:p-7 rounded-xl sm:rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-3 sm:space-y-4">
          <h3 className="text-sm sm:text-base font-extrabold text-[#111827] border-b border-[#F3DDE7]/60 pb-2 sm:pb-3">
            ข้อมูลทางวิชาการและสิ่งพิมพ์
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Book Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ชื่อหนังสือ (Book Name) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="เช่น พระไตรปิฎกฉบับภาษาไทย มหาจุฬาลงกรณราชวิทยาลัย"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ผู้แต่ง / บรรณาธิการ (Author) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="เช่น คณะกรรมการการตรวจชำระพระไตรปิฎก มจร"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                รหัส ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-616-300-xxx-x"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
              />
            </div>

            {/* Published Year */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ปีที่พิมพ์ (พ.ศ.) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="number"
                value={publishedYear}
                onChange={(e) => setPublishedYear(e.target.value)}
                placeholder="2567"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* Pages */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                จำนวนหน้า <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="เช่น 350"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                ราคาปก (บาท) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="เช่น 320"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* Initial Stock Quantity */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                จำนวนสต๊อกแรกเริ่ม (เล่ม) <span className="text-[#ED1760]">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="เช่น 50"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#F3DDE7] bg-[#FCF8FA] text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ED1760]/20 focus:border-[#ED1760]"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#111827] mb-1.5">
                เนื้อหาย่อ / คำอธิบายหนังสือ
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
                  <div className="w-8 h-8 rounded-[10px] bg-[#ED1760] text-white flex items-center justify-center">
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

        {/* Card 2: Cover Image */}
        <div className="bg-white p-6 sm:p-7 rounded-[20px] border border-[#F3DDE7] shadow-[0_4px_16px_rgba(237,23,96,0.03)] space-y-4">
          <h3 className="text-base font-extrabold text-[#111827] border-b border-[#F3DDE7]/60 pb-3">
            รูปปกหนังสือ <span className="text-[#ED1760]">*</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Upload Zone */}
            <div className="md:col-span-7 space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#F3DDE7] hover:border-[#ED1760] rounded-[16px] p-6 text-center bg-[#FCF8FA] hover:bg-[#FCE7F3]/30 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#FCE7F3] text-[#ED1760] flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
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
                  หรือวาง URL รูปภาพโดยตรง
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
              <span className="text-xs font-bold text-[#64748B] mb-2">ภาพตัวอย่าง (Preview)</span>
              <div className="w-36 h-48 rounded-[12px] overflow-hidden bg-slate-100 border border-[#F3DDE7] shadow-sm flex items-center justify-center relative">
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
                      title="ลบรูป"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span className="text-[11px]">ยังไม่มีรูปปก</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
            className="px-6 py-2.5 rounded-[12px] bg-[#ED1760] hover:bg-[#D41456] text-white font-bold text-xs sm:text-sm shadow-sm shadow-[#ED1760]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหนังสือ'}
          </button>
        </div>
      </form>
    </div>
  );
};
