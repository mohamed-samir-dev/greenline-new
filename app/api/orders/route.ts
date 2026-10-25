import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { products, EXCHANGE_RATE } from '../../products';

// Type definitions
interface OrderItem {
  id: number;
  qty: number;
}

interface OrderRequest {
  name: string;
  phone: string;
  city: string;
  address: string;
  country: string;
  paymentMethod: 'cash_on_delivery' | 'kashier';
  items: OrderItem[];
}

// In-memory duplicate detection (replace with Redis/KV in production)
const processedRequests = new Map<string, { timestamp: number; orderId: string }>();

// Clean up old entries periodically (older than 1 hour)
function cleanupOldRequests() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of processedRequests.entries()) {
    if (value.timestamp < oneHourAgo) {
      processedRequests.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get idempotency key from header
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'مفتاح الطلب مفقود' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: OrderRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.phone || !body.city || !body.address || !body.country) {
      return NextResponse.json(
        { error: 'بيانات الطلب غير مكتملة' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'الطلب فارغ، أضف منتجات إلى السلة' },
        { status: 400 }
      );
    }

    // Create payload hash for duplicate detection
    const payloadString = JSON.stringify({
      name: body.name,
      phone: body.phone,
      city: body.city,
      address: body.address,
      country: body.country,
      items: body.items,
    });
    const payloadHash = createHash('sha256').update(payloadString).digest('hex');

    // Check for duplicate request
    cleanupOldRequests();
    const existing = processedRequests.get(idempotencyKey);
    if (existing) {
      console.log('Duplicate request detected, returning existing order:', existing.orderId);
      return NextResponse.json({
        orderId: existing.orderId,
        status: 'duplicate',
        message: 'تم معالجة هذا الطلب مسبقاً',
      });
    }

    // Calculate totals
    let totalSarHalalas = 0;
    const itemsWithDetails = body.items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        throw new Error(`منتج غير موجود: ${item.id}`);
      }
      const itemTotal = product.price * item.qty * 100; // Convert to halalas
      totalSarHalalas += itemTotal;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: item.qty,
      };
    });

    // Calculate local currency (assuming EGP based on EXCHANGE_RATE)
    const totalLocalCents = Math.round(totalSarHalalas * EXCHANGE_RATE);
    const currency = body.country === 'EG' ? 'EGP' : 'SAR';

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Store the order (in production, save to database)
    // For now, we'll just track the request
    processedRequests.set(idempotencyKey, {
      timestamp: Date.now(),
      orderId,
    });

    // Prepare order data
    const orderData = {
      id: orderId,
      requestKey: idempotencyKey,
      payloadHash,
      name: body.name,
      phone: body.phone,
      city: body.city,
      address: body.address,
      country: body.country,
      items: JSON.stringify(itemsWithDetails),
      totalSarHalalas,
      totalLocalCents,
      currency,
      exchangeRate: EXCHANGE_RATE.toString(),
      status: 'new',
      paymentMethod: body.paymentMethod || 'cash_on_delivery',
      createdAt: new Date().toISOString(),
    };

    console.log('Order created:', orderId);

    // Handle Kashier payment
    if (body.paymentMethod === 'kashier') {
      const kashierData = await initializeKashierPayment(orderData);
      return NextResponse.json({
        orderId,
        status: 'pending_payment',
        kashier: kashierData,
        order: orderData,
      });
    }

    // Cash on delivery
    return NextResponse.json({
      orderId,
      status: 'confirmed',
      order: orderData,
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

async function initializeKashierPayment(orderData: any) {
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const mode = process.env.KASHIER_MODE || 'test';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  // Check if credentials are configured
  if (!merchantId || !apiKey || merchantId.includes('YOUR_KASHIER')) {
    return {
      merchantId: merchantId || 'YOUR_KASHIER_MERCHANT_ID',
      mode: mode,
      configured: false,
      message: 'يرجى تكوين بيانات كاشير في ملف .env',
    };
  }

  // Calculate amount (in local currency)
  const amount = (orderData.totalLocalCents / 100).toFixed(2);

  // Kashier API endpoint
  const baseUrl = mode === 'live' 
    ? 'https://checkout.kashier.io'
    : 'https://checkout-sandbox.kashier.io';

  // Generate hash for security (order_id + amount + currency + secret_key)
  const hashString = `${orderData.id}${amount}${orderData.currency}${secretKey}`;
  const hash = createHash('sha256').update(hashString).digest('hex');

  return {
    baseUrl,
    merchantId,
    orderId: orderData.id,
    amount,
    currency: orderData.currency,
    hash,
    mode,
    iframe: true,
    display: 'ar',
    redirectUrl: `${appUrl}/?status=SUCCESS&orderId=${orderData.id}`,
    failureUrl: `${appUrl}/?status=FAILURE&orderId=${orderData.id}`,
    checkoutUrl: `${baseUrl}/?merchantId=${merchantId}&orderId=${orderData.id}&amount=${amount}&currency=${orderData.currency}&hash=${hash}&mode=${mode}&metaData=${encodeURIComponent(JSON.stringify({ customer: orderData.name, phone: orderData.phone }))}`,
    configured: true,
  };
}
