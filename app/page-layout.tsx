import type { ReactNode } from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <>
      <header className="page-header">
        <div className="wrap">
          <Link href="/" className="brand page-header-brand">
            <span className="brand-icon"><Leaf size={20} /></span>
            <span>
              <b>Green Line</b>
              <small>جرين لاين</small>
            </span>
          </Link>
          <Link href="/" className="back-link">
            → العودة للمتجر
          </Link>
        </div>
      </header>

      <main className="page-main">
        <div className="wrap">
          {children}
        </div>
      </main>

      <footer className="page-footer-mini">
        <div className="wrap">
          <span>© {new Date().getFullYear()} Green Line — جرين لاين · جميع الحقوق محفوظة</span>
        </div>
      </footer>
    </>
  );
}
