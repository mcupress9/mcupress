export interface FontThemeOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  fontFamily: string;
}

export const FONT_THEMES: FontThemeOption[] = [
  {
    id: 'line-seed',
    name: 'LINE Seed Sans TH',
    badge: 'โมเดิร์น สไตล์ MCU Esports (แนะนำ)',
    description: 'ฟอนต์เอกลักษณ์สำหรับ UI ยุคใหม่ สะอาด ทันสมัย คมชัดทุกขนาดหน้าจอ',
    fontFamily: "'LINE Seed Sans TH', 'Noto Sans Thai', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'noto-sans-thai',
    name: 'Noto Sans Thai',
    badge: 'คลีน มินิมอล ระดับพรีเมียม',
    description: 'ฟอนต์สากลระดับมาตรฐานโลก รองรับความละเอียดหน้าจอสูง อ่านง่ายเป็นพิเศษ',
    fontFamily: "'Noto Sans Thai', 'LINE Seed Sans TH', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'prompt',
    name: 'Prompt',
    badge: 'ฟอนต์ยอดนิยม',
    description: 'ตัวอักษรไร้หัว สะอาดตา สไตล์โมเดิร์นแอปพลิเคชัน',
    fontFamily: "'Prompt', 'Noto Sans Thai', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
];

const STORAGE_KEY = 'mcu_press_font_theme';

export const themeService = {
  getCurrentFontTheme(): string {
    if (typeof window === 'undefined') return 'line-seed';
    return localStorage.getItem(STORAGE_KEY) || 'line-seed';
  },

  applyFontTheme(themeId: string): void {
    if (typeof window === 'undefined') return;
    const option = FONT_THEMES.find((f) => f.id === themeId) || FONT_THEMES[0];
    localStorage.setItem(STORAGE_KEY, option.id);
    document.documentElement.style.setProperty('--app-font-family', option.fontFamily);
    document.body.style.fontFamily = option.fontFamily;
  },

  initFontTheme(): void {
    if (typeof window === 'undefined') return;
    const current = this.getCurrentFontTheme();
    this.applyFontTheme(current);
  },
};
