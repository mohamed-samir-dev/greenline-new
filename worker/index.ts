import {products,EXCHANGE_RATE} from '../app/products';
interface Statement{bind(...v:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;run():Promise<unknown>}
interface Env{
 DB:{prepare(sql:string):Statement};
 ASSETS:{fetch(req:Request):Promise<Response>};
 KASHIER_MERCHANT_ID?:string;
 KASHIER_API_KEY?:string;
 KASHIER_SECRET_KEY?:string;
 KASHIER_MODE?:string;
 APP_URL?:string;
}

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

async function generateHmacSha256(secret:string,data:string):Promise<string>{
 const enc=new TextEncoder();
 const key=await crypto.subtle.importKey(
  'raw',
  enc.encode(secret),
  {name:'HMAC',hash:'SHA-256'},
  false,
  ['sign']
 );
 const sig=await crypto.subtle.sign('HMAC',key,enc.encode(data));
 return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export default {async fetch(request:Request,env:Env){
 const url=new URL(request.url);

 // 1. Kashier Webhook handler
 if(url.pathname==='/api/kashier/webhook'){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  try{
   const raw=await request.text();
   const secret=env.KASHIER_SECRET_KEY||env.KASHIER_API_KEY||'';
   const signature=request.headers.get('x-kashier-signature')||'';
   let body:Record<string,unknown>={};
   try{body=JSON.parse(raw)}catch{return json({error:'Invalid JSON'},400)}

   if(secret&&signature){
    const computed=await generateHmacSha256(secret,raw);
    if(computed.toLowerCase()!==signature.toLowerCase()){
     console.warn('Webhook signature mismatch');
     return json({error:'Invalid signature'},401);
    }
   }

   const data=(body.data||body) as Record<string,unknown>;
   const status=String(data.status||data.paymentStatus||body.status||'').toUpperCase();
   const orderId=String(data.orderReference||data.orderId||data.merchantOrderId||body.orderId||'');

   if(orderId){
    if(status==='SUCCESS'||status==='CAPTURED'){
     await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind('paid',orderId).run();
    }else if(status==='FAILED'||status==='DECLINED'){
     await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind('failed',orderId).run();
    }
   }
   return json({received:true});
  }catch(err){
   console.error('Webhook processing failed',err);
   return json({error:'Webhook processing failed'},500);
  }
 }

 // 2. Check Order Status
 if(url.pathname==='/api/orders/status'){
  const orderId=url.searchParams.get('id');
  if(!orderId)return json({error:'معرف الطلب مطلوب.'},400);
  const row=await env.DB.prepare('SELECT id, status, payment_method, total_sar_halalas, total_local_cents, currency, items FROM orders WHERE id = ?').bind(orderId).first<{id:string,status:string,payment_method:string,total_sar_halalas:number,total_local_cents:number,currency:string,items:string}>();
  if(!row)return json({error:'الطلب غير موجود.'},404);
  return json({
   id:row.id,
   status:row.status,
   paymentMethod:row.payment_method,
   currency:row.currency,
   total:row.total_sar_halalas/100,
   items:JSON.parse(row.items)
  });
 }

 // 3. Static assets or other paths
 if(url.pathname!=='/api/orders')return env.ASSETS.fetch(request);

 // 4. Create Order
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'طلب غير مسموح.'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'بيانات غير صالحة.'},415);
 if(Number(request.headers.get('Content-Length')||0)>16000)return json({error:'حجم الطلب أكبر من المسموح.'},413);

 try{
  const raw=await request.text();if(raw.length>16000)return json({error:'حجم الطلب أكبر من المسموح.'},413);
  let b;try{b=JSON.parse(raw)}catch{return json({error:'بيانات الطلب غير صالحة.'},400)}
  const key=request.headers.get('Idempotency-Key')||'';
  if(!/^[a-f0-9-]{36}$/i.test(key))return json({error:'معرف الطلب غير صالح.'},400);

  for(const [field,min,max]of [['name',3,80],['phone',9,15],['city',2,80],['address',8,300]] as const){
   if(typeof b[field]!=='string'||b[field].trim().length<min||b[field].length>max)return json({error:'يرجى استكمال الاسم والهاتف والمدينة والعنوان بشكل صحيح.'},400);
   b[field]=b[field].trim();
  }
  if(!/^\d{9,15}$/.test(b.phone)||!['SA','EG'].includes(b.country)||!Array.isArray(b.items)||b.items.length<1||b.items.length>6)return json({error:'راجع بيانات الطلب والمنتجات.'},400);

  const paymentMethod=b.paymentMethod==='kashier'?'kashier':'cash_on_delivery';
  const seen=new Set();let total=0;const items=[];
  for(const item of b.items){
   const product=products.find(p=>p.id===item?.id);
   if(!product||!Number.isInteger(item.qty)||item.qty<1||item.qty>99||seen.has(item.id))return json({error:'كمية أو منتج غير صالح.'},400);
   seen.add(item.id);
   total+=product.price*item.qty;
   items.push({id:product.id,name:product.name,qty:item.qty,priceSar:product.price});
  }

  const canonical=JSON.stringify({name:b.name,phone:b.phone,city:b.city,address:b.address,country:b.country,items,paymentMethod});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const currency=b.country==='SA'?'ريال سعودي':'جنيه مصري';
  const id='GL-'+crypto.randomUUID().toUpperCase();
  const initialStatus=paymentMethod==='kashier'?'pending_payment':'new';

  await env.DB.prepare('INSERT INTO orders (id,request_key,payload_hash,name,phone,city,address,country,items,total_sar_halalas,total_local_cents,currency,exchange_rate,status,payment_method,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING')
   .bind(id,key,hash,b.name,b.phone,b.city,b.address,b.country,JSON.stringify(items),total*100,Math.round(total*(b.country==='EG'?EXCHANGE_RATE:1)*100),currency,String(EXCHANGE_RATE),initialStatus,paymentMethod,new Date().toISOString()).run();

  const saved=await env.DB.prepare('SELECT id,payload_hash,items,total_sar_halalas,currency,status,payment_method FROM orders WHERE request_key = ?').bind(key).first<{id:string,payload_hash:string,items:string,total_sar_halalas:number,currency:string,status:string,payment_method:string}>();
  if(!saved)throw new Error('Order insert failed');
  if(saved.payload_hash!==hash)return json({error:'تغيرت بيانات طلب سابق. أغلق صفحة الطلب وأعد المحاولة.'},409);

  let kashierData=null;
  if(paymentMethod==='kashier'){
   const mid=env.KASHIER_MERCHANT_ID||'';
   const secret=env.KASHIER_SECRET_KEY||env.KASHIER_API_KEY||'';
   const mode=(env.KASHIER_MODE||'test').toLowerCase();
   const kashierCurrency=b.country==='SA'?'SAR':'EGP';
   const kashierAmountNum=b.country==='SA'?total:(total*EXCHANGE_RATE);
   const formattedAmount=(Math.round(kashierAmountNum*100)/100).toFixed(2);
   const kashierHash=(mid&&secret)?await generateHmacSha256(secret,`/?payment=${mid}.${saved.id}.${formattedAmount}.${kashierCurrency}`):'';
   const baseUrl=mode==='live'?'https://checkout.kashier.io':'https://test-iframe.kashier.io';
   kashierData={
    merchantId:mid,
    orderId:saved.id,
    amount:formattedAmount,
    currency:kashierCurrency,
    hash:kashierHash,
    mode,
    baseUrl
   };
  }

  return json({
   id:saved.id,
   total:saved.total_sar_halalas/100,
   currency:saved.currency,
   items:JSON.parse(saved.items),
   status:saved.status,
   paymentMethod:saved.payment_method,
   kashier:kashierData
  },201);
 }catch(error){
  console.error('Order persistence failed',error instanceof Error?error.name:'unknown');
  return json({error:'تعذر تسجيل الطلب الآن. احتفظ ببياناتك وحاول مرة أخرى.'},503);
 }
}};
