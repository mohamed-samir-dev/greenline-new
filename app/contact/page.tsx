import PageLayout from '../page-layout';

export const metadata = {
  title: 'اتصل بنا | جرين لاين',
  description: 'تواصل مع فريق جرين لاين عبر الهاتف أو البريد الإلكتروني أو واتساب.',
};

export default function ContactPage() {
  return (
    <PageLayout title="اتصل بنا">
      <h1>اتصل بنا</h1>
      <p className="page-subtitle">نسعد بتواصلكم — فريقنا جاهز للإجابة على استفساراتكم.</p>

      <div className="contact-grid">
        <div className="contact-info-block">
          <div className="contact-info-item">
            <span className="label">الاسم التجاري</span>
            <span>Green Line — جرين لاين</span>
          </div>

          <div className="contact-info-item">
            <span className="label">الهاتف</span>
            <a href="tel:+201552456445">01552456445</a>
          </div>

          <div className="contact-info-item">
            <span className="label">واتساب</span>
            <a href="https://wa.me/201552456445" target="_blank" rel="noopener noreferrer">
              01552456445 (واتساب)
            </a>
          </div>

          <div className="contact-info-item">
            <span className="label">البريد الإلكتروني</span>
            <a href="mailto:loutfallaasfora@gmail.com">loutfallaasfora@gmail.com</a>
          </div>

          <div className="contact-info-item">
            <span className="label">العنوان</span>
            <address>المنصورة، الدقهلية، جمهورية مصر العربية</address>
          </div>
        </div>

        <div className="contact-form">
          <h2>أرسل رسالة</h2>
          {/* mailto: form — static export; opens the user's email client */}
          <form action="mailto:loutfallaasfora@gmail.com" method="GET">
            <input type="hidden" name="subject" value="رسالة من موقع جرين لاين" />

            <label>
              الاسم
              <input type="text" name="name" autoComplete="name" />
            </label>

            <label>
              رقم الهاتف
              <input type="tel" name="phone" autoComplete="tel" />
            </label>

            <label>
              البريد الإلكتروني
              <input type="email" name="email" autoComplete="email" />
            </label>

            <label>
              الرسالة
              <textarea name="body" rows={4} />
            </label>

            <button type="submit" className="submit-btn">إرسال الرسالة</button>
          </form>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px', marginBottom: 0 }}>
            سيفتح هذا النموذج تطبيق البريد الإلكتروني لديك.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
