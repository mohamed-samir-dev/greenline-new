import {products,EXCHANGE_RATE} from '../app/products';
interface Statement{bind(...v:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;run():Promise<unknown>}
interface Env{DB:{prepare(sql:string):Statement};ASSETS:{fetch(req:Request):Promise<Response>}}
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {async fetch(request:Request,env:Env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/orders')return env.ASSETS.fetch(request);
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'طلب غير مسموح.'},403);
 if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'بيانات غير صالحة.'},415);
 if(Number(request.headers.get('Content-Length')||0)>16000)return json({error:'حجم الطلب أكبر من المسموح.'},413);
 try{
  const raw=await request.text();if(raw.length>16000)return json({error:'حجم الطلب أكبر من المسموح.'},413);
  let b;try{b=JSON.parse(raw)}catch{return json({error:'بيانات الطلب غير صالحة.'},400)}
  const key=request.headers.get('Idempotency-Key')||'';
  if(!/^[a-f0-9-]{36}$/i.test(key))return json({error:'معرف الطلب غير صالح.'},400);
  for(const [field,min,max]of [['name',3,80],['phone',9,15],['city',2,80],['address',8,300]] as const){if(typeof b[field]!=='string'||b[field].trim().length<min||b[field].length>max)return json({error:'يرجى استكمال الاسم والهاتف والمدينة والعنوان بشكل صحيح.'},400);b[field]=b[field].trim()}
  if(!/^\d{9,15}$/.test(b.phone)||!['SA','EG'].includes(b.country)||!Array.isArray(b.items)||b.items.length<1||b.items.length>6)return json({error:'راجع بيانات الطلب والمنتجات.'},400);
  const seen=new Set();let total=0;const items=[];
  for(const item of b.items){const product=products.find(p=>p.id===item?.id);if(!product||!Number.isInteger(item.qty)||item.qty<1||item.qty>99||seen.has(item.id))return json({error:'كمية أو منتج غير صالح.'},400);seen.add(item.id);total+=product.price*item.qty;items.push({id:product.id,name:product.name,qty:item.qty,priceSar:product.price})}
  const canonical=JSON.stringify({name:b.name,phone:b.phone,city:b.city,address:b.address,country:b.country,items});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)))).map(n=>n.toString(16).padStart(2,'0')).join('');
  const currency=b.country==='SA'?'ريال سعودي':'جنيه مصري';
  const id='GL-'+crypto.randomUUID().toUpperCase();
  await env.DB.prepare('INSERT INTO orders (id,request_key,payload_hash,name,phone,city,address,country,items,total_sar_halalas,total_local_cents,currency,exchange_rate,status,payment_method,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(id,key,hash,b.name,b.phone,b.city,b.address,b.country,JSON.stringify(items),total*100,Math.round(total*(b.country==='EG'?EXCHANGE_RATE:1)*100),currency,String(EXCHANGE_RATE),'new','cash_on_delivery',new Date().toISOString()).run();
  const saved=await env.DB.prepare('SELECT id,payload_hash,items,total_sar_halalas,currency FROM orders WHERE request_key = ?').bind(key).first<{id:string,payload_hash:string,items:string,total_sar_halalas:number,currency:string}>();
  if(!saved)throw new Error('Order insert failed');
  if(saved.payload_hash!==hash)return json({error:'تغيرت بيانات طلب سابق. أغلق صفحة الطلب وأعد المحاولة.'},409);
  return json({id:saved.id,total:saved.total_sar_halalas/100,currency:saved.currency,items:JSON.parse(saved.items)},201);
 }catch(error){console.error('Order persistence failed',error instanceof Error?error.name:'unknown');return json({error:'تعذر تسجيل الطلب الآن. احتفظ ببياناتك وحاول مرة أخرى.'},503)}
}};
