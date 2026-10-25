# إعداد بوابة الدفع كاشير

## الحصول على المفاتيح من لوحة تحكم كاشير

### 1. تسجيل الدخول
- اذهب إلى: https://merchant.kashier.io/
- سجل دخولك بحسابك

### 2. احصل على Merchant ID
- ستجده أعلى الصفحة تحت اسم المستخدم
- مثال: `MID-51995-388`

### 3. احصل على Payment API Key و Secret Key
- من القائمة الجانبية، اذهب إلى: **Integrate now** > **Payment API Keys**
- ستجد:
  - **Payment API Key** (يستخدم في header: `api-key`)
  - **Secret Key** (يستخدم في header: `Authorization`)

⚠️ **مهم جداً:**
- `KASHIER_API_KEY` = Payment API Key (مفتاح مختلف، عادة UUID قصير)
- `KASHIER_SECRET_KEY` = Secret Key (مفتاح طويل، يستخدم للـ HMAC)

### 4. اختبر المفاتيح

للتأكد من المفاتيح صحيحة، جرب هذا الأمر:

```bash
curl -X POST https://test-api.kashier.io/v3/payment/sessions \
  -H "Authorization: YOUR_SECRET_KEY" \
  -H "api-key: YOUR_PAYMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "MID-XXXX-XXX",
    "amount": "10.00",
    "currency": "EGP",
    "order": "TEST-001",
    "merchantRedirect": "https://example.com",
    "display": "ar",
    "type": "one-time"
  }'
```

إذا حصلت على `sessionUrl` في الاستجابة، المفاتيح صحيحة! ✅

إذا حصلت على "Invalid token"، المفاتيح خاطئة! ❌

---

## تحديث ملف .env

بعد الحصول على المفاتيح الصحيحة، حدث ملف `.env`:

```env
KASHIER_MERCHANT_ID=MID-51995-388

# Payment API Key (UUID قصير)
KASHIER_API_KEY=a019fca6-f3ba-4eba-aab7-84995481dc7d

# Secret Key (مفتاح طويل للتوقيع الرقمي)
KASHIER_SECRET_KEY=38130367e4218e7561fc534d377261f2$03e013f3c681a3d2b466ebca90a1f47dcb369c6e30a31186e9206db01fc0d157eae8069b96a29a08e14bbfaa52061ddf

# الوضع: test أو live
KASHIER_MODE=live

# رابط الموقع
APP_URL=https://www.lamsa-smartt.com
```

---

## استكشاف الأخطاء

### خطأ "Invalid token"
- **السبب:** المفاتيح غير صحيحة أو في المكان الخطأ
- **الحل:** تأكد من:
  - `KASHIER_API_KEY` هو Payment API Key
  - `KASHIER_SECRET_KEY` هو Secret Key (وليس نفس قيمة API Key)
  - المفاتيح من نفس البيئة (test أو live)

### خطأ "Merchant not live"
- **السبب:** حساب كاشير لم يتم تفعيله لوضع Live
- **الحل:** غير `KASHIER_MODE=test` أو تواصل مع كاشير لتفعيل الحساب

### خطأ "Order already exists"
- **السبب:** تم استخدام نفس Order ID من قبل
- **الحل:** كل طلب له Order ID فريد، تأكد من عدم تكرار الطلبات

---

## روابط مفيدة

- لوحة التحكم: https://merchant.kashier.io/
- التوثيق: https://developers.kashier.io/
- الدعم الفني: support@kashier.io
