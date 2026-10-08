import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'جرين لاين | خير الأرض يبدأ من هنا', description: 'متجر جرين لاين للأسمدة الزراعية. أسعار بالريال السعودي والجنيه المصري والدفع عند الاستلام.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="ar" dir="rtl"><body>{children}</body></html>; }
