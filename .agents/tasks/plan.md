# Implementation Plan — Green Line Site Update

## Project Context
- Next.js 16.4 with `output: 'export'` (static HTML export) — **no server actions**, no API routes in page files
- TypeScript + React 19, RTL Arabic site
- Build: `npm run build` | Type-check: `npm run typecheck`
- No test framework
- Business: Green Line — جرين لاين, phone: 01552456445, email: loutfallaasfora@gmail.com, address: المنصورة، الدقهلية، جمهورية مصر العربية
- **Data rule**: رقم التسجيل الضريبي, رقم السجل التجاري, working hours, delivery areas, shipping times → **omit entirely**, no placeholders

---

## FEAT-001 — Modify existing files (page.tsx, layout.tsx, globals.css)

- [ ] 1. **Fix Price component in `app/page.tsx`** — swap EGP/SAR display order.
      Current: `<strong>{number(value)} ر.س</strong><span>{number(value*EXCHANGE_RATE)} ج.م</span>`
      New: `<strong>{number(value*EXCHANGE_RATE)} <small>ج.م</small></strong><span>{number(value)} ر.س</span>`
      The `.price strong` CSS (22px bold) now shows EGP; `.price>span` (12px muted) shows SAR.
      Files: `app/page.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 2. **Update benefits section text in `app/page.tsx`** — remove dual-currency claim.
      Change ShieldCheck benefit: title from `'أسعار واضحة بعملتين'` → `'أسعار واضحة بالجنيه المصري'`, remove the `<small>بالريال السعودي والجنيه المصري</small>` subtitle entirely.
      Files: `app/page.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 3. **Add nav links to header in `app/page.tsx`**.
      In the `<nav aria-label="القائمة الرئيسية">`, add after the existing links:
      `<a href="/about">من نحن</a><a href="/contact">اتصل بنا</a>`
      Plain `<a>` tags (not Next.js Link) are fine here since it's a 'use client' component and these are full-page navigations.
      Files: `app/page.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 4. **Update checkout consent checkbox in `app/page.tsx`**.
      Replace the consent label text with:
      `أوافق على <a href="/terms">الشروط والأحكام</a> و<a href="/privacy">سياسة الخصوصية</a> وعلى استخدام بياناتي لتجهيز الطلب وتوصيله.`
      Keep `<input type="checkbox" required/>` unchanged (no defaultChecked → stays unchecked by default).
      Files: `app/page.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 5. **Replace footer in `app/page.tsx`** with comprehensive footer.
      Replace the current `<footer className="wrap">...</footer>` with a new `<footer className="site-footer"><div className="wrap">...</div></footer>` containing:
      - Brand section (Leaf icon + brand name + tagline "نزرع الثقة، ونموّ معًا.")
      - Nav links grid (two columns): 
        Column 1 — "صفحات": من نحن (/about), اتصل بنا (/contact)
        Column 2 — "سياسات": سياسة الاستبدال والاسترجاع (/return-policy), الشروط والأحكام (/terms), سياسة الخصوصية (/privacy), سياسة الشحن والتوصيل (/shipping)
      - Contact info: phone `<a href="tel:+201552456445">01552456445</a>`, email `<a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>`, address `<address>المنصورة، الدقهلية، جمهورية مصر العربية</address>`
      - Bottom bar: copyright `© {new Date().getFullYear()} جرين لاين. جميع الحقوق محفوظة.`
      Files: `app/page.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 6. **Update metadata in `app/layout.tsx`**.
      Change description to: `'متجر جرين لاين للأسمدة الزراعية. أسعار بالجنيه المصري. الدفع عند الاستلام. التوصيل لجميع المحافظات.'`
      Files: `app/layout.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 7. **Add CSS for new footer and consent links to `app/globals.css`**.
      Append at end of file:
      ```css
      /* Site footer */
      .site-footer{border-top:1px solid var(--line);padding:40px 0 28px;margin-top:60px}
      .site-footer .footer-inner{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px;align-items:start}
      .site-footer .footer-brand{display:flex;flex-direction:column;gap:12px}
      .site-footer .footer-brand .tagline{font-size:13px;color:var(--muted);margin:0}
      .site-footer .footer-nav h4{font-size:11px;font-weight:600;letter-spacing:1px;color:var(--muted);margin:0 0 12px;text-transform:uppercase}
      .site-footer .footer-nav ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
      .site-footer .footer-nav ul a{font-size:13px;color:var(--ink);transition:color .15s}
      .site-footer .footer-nav ul a:hover{color:var(--green)}
      .site-footer .footer-contact{display:flex;flex-direction:column;gap:8px}
      .site-footer .footer-contact a{font-size:13px;color:var(--ink)}
      .site-footer .footer-contact address{font-style:normal;font-size:13px;color:var(--muted)}
      .site-footer .footer-bottom{border-top:1px solid var(--line);margin-top:28px;padding-top:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
      .site-footer .footer-bottom small{font-size:12px;color:var(--muted)}
      .consent a{color:var(--green);text-decoration:underline}
      @media(max-width:760px){
        .site-footer .footer-inner{grid-template-columns:1fr;gap:28px}
        .site-footer .footer-bottom{flex-direction:column;align-items:flex-start}
      }
      ```
      Files: `app/globals.css`
      Verify: `npm run build` — completes with no errors.

---

## FEAT-002 — Create shared layout component and 6 new pages

Depends on FEAT-001 completing first (so globals.css already has footer CSS). The new pages are independent of each other and can be created in any order.

- [ ] 8. **Create `app/page-layout.tsx`** — shared Server Component wrapper for all policy pages.
      Props: `{ children: React.ReactNode, title: string, subtitle?: string }`
      Structure:
      ```tsx
      import { Leaf, ArrowRight } from 'lucide-react';
      export default function PageLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
        return (
          <>
            <header className="page-header">
              <div className="wrap">
                <a className="brand" href="/" aria-label="جرين لاين الرئيسية">
                  <span className="brand-icon"><Leaf /></span>
                  <span><b>جرين لاين</b><small>GREEN LINE</small></span>
                </a>
                <a className="back-link" href="/"><ArrowRight size={15} /> العودة للرئيسية</a>
              </div>
            </header>
            <main className="page-main">
              <div className="wrap">
                <h1>{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
                {children}
              </div>
            </main>
            <footer className="page-footer-mini">
              © {new Date().getFullYear()} جرين لاين — <a href="/">الرئيسية</a>
            </footer>
          </>
        );
      }
      ```
      Files: `app/page-layout.tsx`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 9. **Add CSS for policy pages to `app/globals.css`** (append after footer CSS from step 7):
      ```css
      /* Policy pages */
      .page-header{background:var(--green);color:white;padding:18px 0}
      .page-header .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
      .page-header .brand{color:white}
      .page-header .brand-icon{background:var(--lime);color:var(--green)}
      .page-header .back-link{font-size:13px;color:var(--lime);display:flex;align-items:center;gap:6px}
      .page-main{padding:48px 0 72px;min-height:60vh}
      .page-main h1{font-size:36px;font-weight:700;margin:0 0 8px;letter-spacing:-.5px}
      .page-main .page-subtitle{font-size:15px;color:var(--muted);margin:0 0 40px;border-bottom:1px solid var(--line);padding-bottom:24px}
      .page-section{margin-bottom:36px}
      .page-section h2{font-size:20px;font-weight:600;margin:0 0 12px;color:var(--green)}
      .page-section p,.page-section li{font-size:15px;color:#4a5545;line-height:1.85}
      .page-section ul,.page-section ol{padding-inline-start:1.4em;margin:8px 0}
      .page-section li{margin-bottom:6px}
      .page-footer-mini{border-top:1px solid var(--line);padding:20px 0;text-align:center;font-size:13px;color:var(--muted)}
      /* Contact page */
      .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}
      .contact-info-block{display:flex;flex-direction:column;gap:16px}
      .contact-info-item{display:flex;flex-direction:column;gap:4px}
      .contact-info-item .label{font-size:11px;font-weight:600;letter-spacing:1px;color:var(--muted);text-transform:uppercase}
      .contact-info-item a,.contact-info-item address{font-size:15px;color:var(--ink);font-style:normal}
      .contact-info-item a:hover{color:var(--green)}
      .contact-form{background:white;border:1px solid var(--line);border-radius:10px;padding:28px}
      .contact-form h2{font-size:20px;margin:0 0 20px;color:var(--green)}
      .contact-form label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:500;margin-bottom:14px}
      .contact-form input,.contact-form textarea{border:1px solid var(--line);border-radius:5px;padding:10px 12px;font-size:14px;font-family:inherit;background:var(--paper);color:var(--ink);width:100%}
      .contact-form textarea{resize:vertical;min-height:100px}
      .contact-form .submit-btn{background:var(--green);color:white;border:0;border-radius:6px;padding:11px 24px;font-size:14px;font-weight:500;cursor:pointer;width:100%;margin-top:6px}
      .contact-form .submit-btn:hover{background:#28583f}
      .mailto-note{font-size:12px;color:var(--muted);margin-top:8px;text-align:center}
      @media(max-width:760px){
        .contact-grid{grid-template-columns:1fr}
        .page-main h1{font-size:28px}
      }
      ```
      Files: `app/globals.css`
      Verify: `npm run typecheck` — 0 errors.

- [ ] 10. **Create `app/about/page.tsx`** — "من نحن" page.
       Server Component, no 'use client'. Uses PageLayout with title="من نحن — جرين لاين".
       Content sections:
       - Section 1: "من نحن" — full Arabic business description (توفير وتسويق الأسمدة الزراعية، تجهيز وتعبئة وتغليف تحت العلامة التجارية، تجربة شراء إلكترونية واضحة)
       - Section 2: "بيانات التواصل" — shows: الاسم التجاري: Green Line — جرين لاين, العنوان: المنصورة، الدقهلية، جمهورية مصر العربية, الهاتف: `<a href="tel:+201552456445">01552456445</a>`, البريد: `<a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>`
       **Omit entirely**: رقم التسجيل الضريبي, رقم السجل التجاري (no data available)
       Files: `app/about/page.tsx`
       Verify: `npm run typecheck` — 0 errors.

- [ ] 11. **Create `app/contact/page.tsx`** — "اتصل بنا" page.
        Server Component. Uses PageLayout with title="اتصل بنا".
        Layout: two-column grid (.contact-grid) — left: contact info block, right: contact form.
        Contact info items:
        - الهاتف: `<a href="tel:+201552456445">01552456445</a>`
        - واتساب: `<a href="https://wa.me/201552456445" target="_blank" rel="noopener noreferrer">راسلنا على واتساب</a>`
        - البريد الإلكتروني: `<a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>`
        - العنوان: `<address>المنصورة، الدقهلية، جمهورية مصر العربية</address>`
        **Omit**: مواعيد خدمة العملاء (no data)
        Contact form: `<form action="mailto:loutfallaasfora@gmail.com" method="GET" encType="text/plain">` with:
        - `<input type="hidden" name="subject" value="رسالة من موقع جرين لاين"/>`
        - الاسم: `<input type="text" name="name" required/>`
        - رقم الهاتف: `<input type="tel" name="phone" dir="ltr"/>`
        - البريد الإلكتروني: `<input type="email" name="email"/>`
        - الرسالة: `<textarea name="body" required/>`
        - `<button type="submit" className="submit-btn">إرسال الرسالة</button>`
        - Below form: `<p className="mailto-note">سيفتح هذا النموذج تطبيق البريد الإلكتروني لديك.</p>`
        Files: `app/contact/page.tsx`
        Verify: `npm run typecheck` — 0 errors.

- [ ] 12. **Create `app/return-policy/page.tsx`** — "سياسة الاستبدال والاسترجاع" page.
         Server Component. Uses PageLayout with title="سياسة الاستبدال والاسترجاع".
         8 sections as `<section className="page-section">`:
         1. **مقدمة** — "في Green Line، نحرص على تقديم منتجات زراعية مطابقة للمواصفات المعلنة..."
         2. **مدة طلب الاسترجاع** — 14 يومًا من تاريخ الاستلام وفق قانون حماية المستهلك المصري. عند وجود عيب أو عدم مطابقة: 30 يومًا.
         3. **شروط الاسترجاع** — `<ul>` with 5 items (تقديم رقم الطلب، المحافظة على الحالة الأصلية، عدم الاستخدام، توضيح السبب مع صور، لا تؤثر هذه الشروط على الحقوق القانونية)
         4. **المنتجات المفتوحة أو المستخدمة** — paragraph about reviewing opened products case by case without waiving legal rights
         5. **المنتجات التالفة أو غير المطابقة** — Green Line تتحمل التكاليف القانونية في حالات العيب
         6. **خطوات طلب الاسترجاع** — `<ol>` with 6 numbered steps
         7. **استرداد الأموال** — يتم الرد بوسيلة السداد الأصلية، ضمن المدد القانونية
         8. **التواصل** — هاتف: `<a href="tel:+201552456445">01552456445</a>`, بريد: `<a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>`, عنوان: المنصورة، الدقهلية، جمهورية مصر العربية
         Files: `app/return-policy/page.tsx`
         Verify: `npm run typecheck` — 0 errors.

- [ ] 13. **Create `app/terms/page.tsx`** — "الشروط والأحكام" page.
          Server Component. Uses PageLayout with title="الشروط والأحكام".
          11 sections:
          1. التعريف بالموقع — بيع الأسمدة الزراعية عبر الإنترنت داخل مصر
          2. المنتجات — وصف واضح، تجهيز وتعبئة تحت علامة Green Line
          3. الأسعار — الجنيه المصري (EGP) كعملة أساسية، توضيح رسوم الشحن قبل التأكيد
          4. الطلبات والتوافر — استقبال إلكتروني، إخطار العميل عند عدم التوافر
          5. الدفع — الدفع عند الاستلام فقط حاليًا
          6. الشحن والتوصيل — توضيح رسوم الشحن قبل إتمام الطلب، إبلاغ العميل عند التأخير
          7. الاستخدام الصحيح للمنتجات — الالتزام بتعليمات العبوة
          8. حقوق الملكية الفكرية — اسم Green Line وشعارها
          9. حماية البيانات — وفق سياسة الخصوصية والقانون المصري
          10. القانون المنظم — قوانين جمهورية مصر العربية
          11. بيانات التواصل — هاتف: 01552456445 (tel link), بريد: loutfallaasfora@gmail.com (mailto link), عنوان: المنصورة، الدقهلية، جمهورية مصر العربية
          **Omit**: رقم السجل التجاري, رقم التسجيل الضريبي
          Files: `app/terms/page.tsx`
          Verify: `npm run typecheck` — 0 errors.

- [ ] 14. **Create `app/privacy/page.tsx`** — "سياسة الخصوصية" page.
          Server Component. Uses PageLayout with title="سياسة الخصوصية".
          Sections:
          1. البيانات التي نجمعها — الاسم، رقم الهاتف، العنوان، البريد الإلكتروني عند إتمام الطلب أو التواصل
          2. أغراض الاستخدام — معالجة الطلبات، التواصل بشأن الطلب، التوصيل
          3. مشاركة البيانات — بيانات التوصيل مع شركات الشحن الضرورية فقط؛ بيانات الدفع مع مزود خدمة الدفع عند تفعيل الدفع الإلكتروني
          4. التخزين المحلي (Local Storage) — الموقع يستخدم localStorage لحفظ سلة التسوق في متصفح العميل فقط، لا يتم مشاركة هذه البيانات مع أي طرف ثالث (be accurate: NOT tracking cookies)
          5. حماية البيانات — إجراءات أمان مناسبة لحماية بيانات العملاء
          6. حقوق العملاء — وفق القانون المصري: الاطلاع، التصحيح، طلب حذف البيانات عبر التواصل مع خدمة العملاء
          7. التواصل لطلبات الخصوصية — هاتف: `<a href="tel:+201552456445">01552456445</a>`, بريد: `<a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>`
          **Omit**: مدة الاحتفاظ بالبيانات (no specific policy defined yet)
          Files: `app/privacy/page.tsx`
          Verify: `npm run typecheck` — 0 errors.

- [ ] 15. **Create `app/shipping/page.tsx`** — "سياسة الشحن والتوصيل" page.
          Server Component. Uses PageLayout with title="سياسة الشحن والتوصيل".
          Sections:
          1. تكلفة الشحن — **مجانية على جميع المنتجات** (the only confirmed fact)
          2. التواصل عند التأخير — في حالة تأخر الشحنة، يمكن التواصل على 01552456445 أو loutfallaasfora@gmail.com
          3. الشحنات التالفة أو المفقودة — يتم التعامل مع الشحنات التالفة أو المفقودة بالتنسيق مع شركة الشحن وفق الإجراءات المعمول بها. يُرجى التواصل خلال 48 ساعة من الاستلام
          4. تعليمات التغليف — يتم تعبئة الأسمدة وتغليفها بما يتناسب مع طبيعتها وضمان وصولها بحالة جيدة
          **Omit entirely**: المحافظات المتاحة, وقت التجهيز, مدة التوصيل, تكاليف الشحن التفصيلية
          Files: `app/shipping/page.tsx`
          Verify: `npm run typecheck` — 0 errors.

- [ ] 16. **Final build verification**.
          Run `npm run build` from the project root. Expected outcome: Next.js static export completes with all routes generated (/, /about, /contact, /return-policy, /terms, /privacy, /shipping), and the worker build script succeeds. Fix any remaining TypeScript or JSX errors before marking complete.
          Files: none (verification only)
          Verify: `npm run build` — exits 0 with no errors.
