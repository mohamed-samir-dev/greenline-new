import PageLayout from '../page-layout';

export const metadata = {
  title: 'سياسة الشحن والتوصيل | جرين لاين',
  description: 'سياسة الشحن والتوصيل لدى جرين لاين للأسمدة الزراعية.',
};

export default function ShippingPage() {
  return (
    <PageLayout title="سياسة الشحن والتوصيل">
      <h1>سياسة الشحن والتوصيل</h1>
      <p className="page-subtitle">آخر تحديث: 2025</p>

      <div className="page-section">
        <h2>1. تكلفة الشحن</h2>
        <p>
          الشحن مجاني على جميع الطلبات دون حد أدنى للقيمة.
        </p>
      </div>

      <div className="page-section">
        <h2>2. التعامل مع الشحنات التالفة أو المفقودة</h2>
        <p>
          في حالة وصول شحنة تالفة أو الإبلاغ عن شحنة مفقودة، يُرجى التواصل مع خدمة العملاء
          فور اكتشاف المشكلة وتقديم رقم الطلب وصور للتلف إن وجدت. سنعمل على معالجة الأمر
          وتوفير الحل المناسب وفقًا لسياسة الاسترجاع وحقوق المستهلك القانونية.
        </p>
      </div>

      <div className="page-section">
        <h2>3. تغليف الأسمدة الزراعية</h2>
        <p>
          تُغلَّف منتجاتنا الزراعية بعناية لضمان سلامتها أثناء النقل. يتم استخدام مواد تغليف
          مناسبة لطبيعة الأسمدة والمتطلبات القانونية المعمول بها، بما يضمن وصول المنتج بحالة
          جيدة.
        </p>
      </div>

      <div className="page-section">
        <h2>4. التواصل عند وجود مشكلة في التوصيل</h2>
        <p>في حالة أي استفسار أو مشكلة تتعلق بشحنتك:</p>
        <ul>
          <li>
            <strong>الهاتف:</strong>{' '}
            <a href="tel:+201552456445">01552456445</a>
          </li>
          <li>
            <strong>واتساب:</strong>{' '}
            <a href="https://wa.me/201552456445" target="_blank" rel="noopener noreferrer">
              01552456445
            </a>
          </li>
          <li>
            <strong>البريد الإلكتروني:</strong>{' '}
            <a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>
          </li>
        </ul>
      </div>
    </PageLayout>
  );
}
