'use client';
import {useEffect,useState,useRef} from 'react';
import {Leaf,ShoppingBag,Search,Plus,Minus,X,Truck,ShieldCheck,HandCoins,SlidersHorizontal,Check,CreditCard} from 'lucide-react';
import {products,Product,EXCHANGE_RATE,number} from './products';

type Cart = Record<string,number>;
type Receipt = {
 id:string;
 total:number;
 currency:string;
 status?:string;
 paymentMethod?:string;
 items:{name:string,qty:number}[];
};

function Price({value}:{value:number}) {
 return <div className="price"><strong>{number(value*EXCHANGE_RATE)} <small>ج.م</small></strong><span>{number(value)} ر.س</span></div>;
}

export default function Home(){
 const [cart,setCart]=useState<Cart>({});
 const [ready,setReady]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('الكل');
 const [sort,setSort]=useState('featured');
 const [panel,setPanel]=useState<'cart'|'checkout'|'success'|null>(null);
 const [selected,setSelected]=useState<Product|null>(null);
 const [toast,setToast]=useState('');
 const [country,setCountry]=useState('EG');
 const [paymentMethod,setPaymentMethod]=useState<'kashier'|'cash_on_delivery'>('kashier');
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const orderKey=useRef('');
 const dialog=useRef<HTMLDialogElement>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

 useEffect(()=>{
  try {
   const c=JSON.parse(localStorage.getItem('green-line-cart')||'{}');
   const safe:Cart={};
   for(const p of products){
    const n=c?.[p.id];
    if(Number.isInteger(n)&&n>0)safe[p.id]=Math.min(n,99);
   }
   setCart(safe);
  }catch{}
  setReady(true);
 },[]);

 useEffect(()=>{
  if(ready)try{localStorage.setItem('green-line-cart',JSON.stringify(cart))}catch{}
 },[cart,ready]);

 useEffect(()=>{
  if(panel||selected){
   dialog.current?.showModal();
   document.body.style.overflow='hidden';
  }else{
   dialog.current?.close();
   document.body.style.overflow='';
  }
  return()=>{document.body.style.overflow=''};
 },[panel,selected]);

 // Handle return from Kashier redirect or payment status
 useEffect(()=>{
  if(typeof window==='undefined')return;
  const p=new URLSearchParams(window.location.search);
  const status=(p.get('paymentStatus')||p.get('status')||'').toUpperCase();
  const orderId=p.get('orderId')||p.get('order');
  if((status==='SUCCESS'||status==='PAID')&&orderId){
   fetch(`/api/orders/status?id=${encodeURIComponent(orderId)}`)
    .then(res=>res.json())
    .then(data=>{
     if(data&&data.id){
      setReceipt(data);
      setCart({});
      setPanel('success');
      try{window.history.replaceState({},'',window.location.pathname)}catch{}
     }
    })
    .catch(()=>{});
  }
 },[]);

 // Listen to message events from Kashier iFrame modal
 useEffect(()=>{
  function handleMessage(e:MessageEvent){
   if(!e.data)return;
   const msg=String(e.data.message||e.data.status||e.data.kashierPaymentStatus||'').toUpperCase();
   if(msg==='SUCCESS'||msg==='PAID'){
    const orderId=e.data.orderReference||e.data.orderId;
    if(orderId){
     fetch(`/api/orders/status?id=${encodeURIComponent(orderId)}`)
      .then(res=>res.json())
      .then(data=>{
       if(data&&data.id)setReceipt(data);
       setCart({});
       setPanel('success');
       setSaving(false);
      })
      .catch(()=>{
       setCart({});
       setPanel('success');
       setSaving(false);
      });
    }else{
     setCart({});
     setPanel('success');
     setSaving(false);
    }
   }else if(msg==='FAILURE'||msg==='FAILED'){
    setError('تعذر إتمام الدفع عبر كاشير. يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.');
    setSaving(false);
   }
  }
  window.addEventListener('message',handleMessage);
  return()=>window.removeEventListener('message',handleMessage);
 },[]);

 function notify(message:string){
  setToast(message);
  if(timer.current)clearTimeout(timer.current);
  timer.current=setTimeout(()=>setToast(''),3500);
 }

 function add(p:Product){
  setCart(c=>({...c,[p.id]:Math.min((c[p.id]||0)+1,99)}));
  notify('تمت إضافة '+p.name+' إلى السلة');
 }

 function quantity(id:number,delta:number){
  setCart(c=>{
   const next={...c};
   const n=(next[id]||0)+delta;
   if(n<=0)delete next[id];
   else next[id]=Math.min(n,99);
   return next;
  });
 }

 function close(){
  setPanel(null);
  setSelected(null);
  setError('');
 }

 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const total=products.reduce((s,p)=>s+p.price*(cart[p.id]||0),0);
 const filtered=products
  .filter(p=>(category==='الكل'||p.category===category)&&(`${p.name} ${p.formula} ${p.category}`).toLowerCase().includes(query.toLowerCase()))
  .sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:0);

 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:unknown)=>Promise<void>|void}}).modelContext;
  if(!context)return;
  const controller=new AbortController();
  try{
   Promise.resolve(context.registerTool({
    name:'search_green_line_products',
    description:'Search the fertilizer catalog and update the visible search results.',
    inputSchema:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false},
    annotations:{readOnlyHint:false},
    execute:(input:unknown)=>{
     const q=(input as {query?:unknown})?.query;
     if(typeof q!=='string'||q.length>100)throw new Error('Invalid search query');
     setQuery(q);
     setCategory('الكل');
     document.getElementById('products')?.scrollIntoView();
     return products.filter(p=>(p.name+' '+p.formula+' '+p.category).toLowerCase().includes(q.toLowerCase()));
    }
   },{signal:controller.signal})).catch(()=>{});
  }catch{}
  return()=>controller.abort();
 },[]);

 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(saving)return;
  const data=new FormData(event.currentTarget);
  const phone=String(data.get('phone')||'').replace(/[\s()+-]/g,'');
  if(!/^\d{9,15}$/.test(phone)){
   setError('اكتب رقم هاتف صحيح من 9 إلى 15 رقمًا.');
   return;
  }
  if(!count)return;
  setSaving(true);
  setError('');
  if(!orderKey.current)orderKey.current=crypto.randomUUID();

  try{
   const response=await fetch('/api/orders',{
    method:'POST',
    headers:{'Content-Type':'application/json','Idempotency-Key':orderKey.current},
    body:JSON.stringify({
     name:data.get('name'),
     phone,
     city:data.get('city'),
     address:data.get('address'),
     country,
     paymentMethod,
     items:products.filter(p=>cart[p.id]).map(p=>({id:p.id,qty:cart[p.id]}))
    })
   });
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'تعذر حفظ الطلب. حاول مرة أخرى.');

   if(paymentMethod==='kashier'&&result.kashier){
    // Check if placeholder credentials
    if(!result.kashier.merchantId||result.kashier.merchantId.includes('YOUR_KASHIER')){
     notify('تنبيه: بوابة كاشير جاهزة، بانتظار إدخال بيانات حساب كاشير في ملف .env لإتمام الدفع الفعلي.');
     setReceipt(result);
     setCart({});
     setPanel('success');
     orderKey.current='';
     setSaving(false);
     return;
    }

    // Dynamic loading of Kashier Checkout Script
    const existingScript=document.getElementById('kashier-iFrame');
    if(existingScript)existingScript.remove();

    const script=document.createElement('script');
    script.id='kashier-iFrame';
    script.src=`${result.kashier.baseUrl}/kashier-checkout.js`;
    script.setAttribute('data-amount',result.kashier.amount);
    script.setAttribute('data-hash',result.kashier.hash);
    script.setAttribute('data-currency',result.kashier.currency);
    script.setAttribute('data-orderId',result.kashier.orderId);
    script.setAttribute('data-merchantId',result.kashier.merchantId);
    script.setAttribute('data-merchantRedirect',`${window.location.origin}/?paymentStatus=SUCCESS&orderId=${result.kashier.orderId}`);
    script.setAttribute('data-mode',result.kashier.mode);
    script.setAttribute('data-display','ar');
    script.setAttribute('data-type','external');
    script.setAttribute('data-allowedMethods','card,wallet');
    script.setAttribute('data-store','جرين لاين');
    document.body.appendChild(script);

    setReceipt(result);
    orderKey.current='';
   }else{
    setReceipt(result);
    setCart({});
    setPanel('success');
    orderKey.current='';
    setSaving(false);
   }
  }catch(e){
   setError(e instanceof Error?e.message:'تعذر الاتصال بالخادم. بياناتك ما زالت موجودة، حاول مرة أخرى.');
   setSaving(false);
  }
 }

 return (
  <>
   <div className="announcement"><Leaf size={14}/><span>من أجل أرض أغنى… ومحصول أفضل</span></div>
   <header className="header wrap">
    <a className="brand" href="#" aria-label="جرين لاين الرئيسية">
     <span className="brand-icon"><Leaf/></span>
     <span><b>جرين لاين</b><small>GREEN LINE</small></span>
    </a>
    <nav aria-label="القائمة الرئيسية">
     <a className="active" href="#">الرئيسية</a>
     <a href="#products">جميع المنتجات</a>
     <a href="#about">عن جرين لاين</a>
     <a href="/about">من نحن</a>
     <a href="/contact">اتصل بنا</a>
    </nav>
    <button className="cart-button" onClick={()=>setPanel('cart')}>
     <ShoppingBag size={20}/>
     <span>سلة المشتريات</span>
     <b>{count}</b>
    </button>
   </header>

   <main>
    <section className="hero wrap">
     <div className="hero-content">
      <span className="eyebrow"><span/> نزرع اليوم… لنحصد الغد</span>
      <h1>خير الأرض<br/>يبدأ <em>من هنا.</em></h1>
      <p>لكل أرض احتياج، ولكل محصول عناية.<br/>اكتشف مجموعة جرين لاين لتغذية أرضك، من الجذور إلى الثمار.</p>
      <a href="#products" className="primary">اكتشف منتجاتنا <Leaf size={18}/></a>
      <div className="hero-note"><span className="line"/> عناية بالأرض. ثقة في كل موسم.</div>
     </div>
     <div className="hero-photo">
      <img src="/farm.jpg" alt="حقول زراعية خضراء من الأعلى"/>
      <div className="photo-caption">
       <span>GROW WITH CARE</span>
       <b>كل بداية خضراء،<br/>وراءها أرض تستحق العناية.</b>
       <Leaf size={32}/>
      </div>
      <span className="photo-number">01 / GREEN LINE</span>
     </div>
    </section>

    <section className="benefits wrap" aria-label="مميزات المتجر">
     <div><Truck/><span><b>توصيل إلى باب مزرعتك</b><small>شحن مجاني على جميع المنتجات</small></span></div>
     <div><CreditCard/><span><b>دفع إلكتروني آمن</b><small>كاشير: فيزا، ماستركارد، ميزة، ومحافظ</small></span></div>
     <div><ShieldCheck/><span><b>أسعار واضحة بالجنيه المصري</b></span></div>
    </section>

    <section id="products" className="catalog wrap">
     <div className="section-heading">
      <div><span className="overline">تغذية أفضل، نمو أجمل</span><h2>اختيارك لأرض أكثر عطاءً</h2></div>
      <p>من الأسمدة العضوية إلى التركيبات المتخصصة،<br/>كل ما تحتاجه أرضك في مكان واحد.</p>
     </div>
     <div className="toolbar">
      <div className="tabs" role="group" aria-label="تصنيفات المنتجات">
       {['الكل','أسمدة مركبة','أسمدة عضوية','محسنات تربة','عناصر صغرى'].map(c=>(
        <button key={c} onClick={()=>setCategory(c)} className={category===c?'chosen':''}>{c}</button>
       ))}
      </div>
      <label className="search">
       <Search size={18}/>
       <input aria-label="ابحث عن منتج" placeholder="ابحث عن منتج…" value={query} onChange={e=>setQuery(e.target.value)}/>
      </label>
     </div>
     <div className="results-bar">
      <span>{filtered.length} منتجات <span className="muted">مختارة لأرضك</span></span>
      <label>
       <SlidersHorizontal size={16}/>
       <select aria-label="ترتيب المنتجات" value={sort} onChange={e=>setSort(e.target.value)}>
        <option value="featured">الترتيب الافتراضي</option>
        <option value="low">السعر: من الأقل للأعلى</option>
        <option value="high">السعر: من الأعلى للأقل</option>
       </select>
      </label>
     </div>
     <div className="grid">
      {filtered.map(p=>(
       <article className="product" key={p.id}>
        <button className="product-image" onClick={()=>setSelected(p)} aria-label={'عرض تفاصيل '+p.name}>
         <span className="tag">{p.tag}</span>
         <img src={p.image} alt={'عبوة توضيحية لمنتجات جرين لاين'} loading="lazy"/>
         <span className="weight">{p.weight}</span>
        </button>
        <div className="product-info">
         <span className="category">{p.category} <span>•</span> <span dir="ltr">{p.formula}</span></span>
         <button className="product-title" onClick={()=>setSelected(p)}><h3>{p.name}</h3></button>
         <p>{p.description}</p>
         <div className="product-bottom">
          <Price value={p.price}/>
          <button className="add" aria-label={'أضف '+p.name+' للسلة'} onClick={()=>add(p)}><Plus size={19}/></button>
         </div>
        </div>
       </article>
      ))}
     </div>
     {!filtered.length&&(
      <div className="empty">
       <Search/>
       <h3>لم نجد منتجات مطابقة</h3>
       <p>جرّب اسمًا آخر أو تصنيفًا مختلفًا.</p>
       <button className="secondary" onClick={()=>{setQuery('');setCategory('الكل')}}>عرض جميع المنتجات</button>
      </div>
     )}
     <p className="exchange-note">سعر التحويل المعتمد: 1 ريال سعودي = {EXCHANGE_RATE} جنيه مصري · آخر تحديث: 8 أكتوبر 2026</p>
    </section>

    <section id="about" className="about wrap">
     <div className="about-mark"><Leaf size={58}/><span>ROOTED IN CARE</span></div>
     <div><span className="overline">عن جرين لاين</span><h2>نهتم بالبدايات،<br/>لأن الحصاد يستحق.</h2></div>
     <p>جرين لاين فكرة تجمع العناية بالأرض وسهولة التسوق. اختر ما يناسب مزرعتك، راجع أسعارك بوضوح، وأكمل طلبك في خطوات بسيطة.<br/><small>اختر السماد المناسب لطبيعة التربة والمحصول، واتبع إرشادات الاستخدام على عبوة المنتج.</small></p>
    </section>
   </main>

   <footer className="site-footer">
    <div className="wrap">
     <div className="footer-inner">
      <div className="footer-brand">
       <a className="brand" href="#" aria-label="جرين لاين الرئيسية">
        <span className="brand-icon"><Leaf/></span>
        <span><b>جرين لاين</b><small>GREEN LINE</small></span>
       </a>
       <p className="tagline">نزرع الثقة، ونحرص على جودة كل منتج نوفره لأرضك.</p>
      </div>
      <nav className="footer-nav" aria-label="روابط الموقع">
       <h4>الموقع</h4>
       <ul>
        <li><a href="#">الرئيسية</a></li>
        <li><a href="#products">جميع المنتجات</a></li>
        <li><a href="/about">من نحن</a></li>
        <li><a href="/contact">اتصل بنا</a></li>
        <li><a href="/return-policy">سياسة الاستبدال والاسترجاع</a></li>
        <li><a href="/terms">الشروط والأحكام</a></li>
        <li><a href="/privacy">سياسة الخصوصية</a></li>
        <li><a href="/shipping">سياسة الشحن والتوصيل</a></li>
       </ul>
      </nav>
      <div className="footer-contact">
       <h4 style={{fontSize:'12px',fontWeight:600,letterSpacing:'1px',color:'var(--muted)',margin:'0 0 12px',textTransform:'uppercase'}}>تواصل معنا</h4>
       <a href="tel:+201552456445">📞 01552456445</a>
       <a href="mailto:loutfallaasfora@gmail.com">✉️ loutfallaasfora@gmail.com</a>
       <address>المنصورة، الدقهلية، جمهورية مصر العربية</address>
      </div>
     </div>
     <div className="footer-bottom">
      <small>© {new Date().getFullYear()} جرين لاين. جميع الحقوق محفوظة.</small>
      <small><a href="/terms">الشروط والأحكام</a> · <a href="/privacy">سياسة الخصوصية</a></small>
     </div>
    </div>
   </footer>

   <div className={'toast '+(toast?'visible':'')} role="status"><Check size={18}/>{toast}</div>

   <dialog ref={dialog} onCancel={close} onClick={e=>{if(e.target===dialog.current)close()}} aria-labelledby="dialog-title">
    <button className="close" onClick={close} aria-label="إغلاق"><X/></button>
    {selected ? (
     <div className="detail">
      <img src={selected.image} alt="عبوة جرين لاين التوضيحية"/>
      <span className="overline">{selected.category} · {selected.weight}</span>
      <h2 id="dialog-title">{selected.name}</h2>
      <p>{selected.description}</p>
      <div className="spec" dir="auto">{selected.spec}</div>
      <Price value={selected.price}/>
      <p className="muted">راجع التركيبة والوزن قبل إضافة المنتج إلى سلتك.</p>
      <button className="primary full" onClick={()=>add(selected)}>أضف إلى السلة <Plus size={18}/></button>
     </div>
    ) : panel==='success'&&receipt ? (
     <div className="success">
      <span className="success-icon"><Check size={40}/></span>
      <h2 id="dialog-title">تم استلام طلبك بنجاح!</h2>
      <p>شكرًا لاختيارك جرين لاين.</p>
      <strong className="order-id" dir="ltr">{receipt.id}</strong>
      <div className="receipt">
       {receipt.items.map(i=><div key={i.name}><span>{i.name}</span><b>× {i.qty}</b></div>)}
       <hr/>
       <div>
        <span>طريقة الدفع</span>
        <b>{receipt.paymentMethod==='kashier'?'إلكتروني (كاشير)':'عند الاستلام'}</b>
       </div>
       <div>
        <span>حالة الدفع</span>
        <b style={{color:receipt.status==='paid'?'#2e7d32':receipt.status==='pending_payment'?'#c27803':'inherit'}}>
         {receipt.status==='paid'?'تم الدفع بنجاح':receipt.status==='pending_payment'?'بانتظار التأكيد':'طلب مؤكد'}
        </b>
       </div>
       <hr/>
       <div>
        <span>المبلغ الإجمالي</span>
        <b>{number(receipt.total*(receipt.currency==='جنيه مصري'?EXCHANGE_RATE:1))} {receipt.currency}</b>
       </div>
      </div>
      <p className="demo-warning">احتفظ برقم الطلب للمتابعة في أي وقت.</p>
      <button className="primary full" onClick={close}>متابعة التسوق</button>
     </div>
    ) : (
     <>
      <h2 id="dialog-title">{panel==='checkout'?'إتمام الطلب':'سلة مشترياتك'}</h2>
      <p className="muted">{panel==='checkout'?'خطوة أخيرة، ونكون جاهزين.':'اختياراتك لبداية أكثر اخضرارًا'}</p>
      {!count ? (
       <div className="empty">
        <ShoppingBag size={45}/>
        <h3>سلتك لسه فاضية</h3>
        <p>اكتشف منتجاتنا وأضف ما يناسب أرضك.</p>
        <button className="primary" onClick={close}>ابدأ التسوق</button>
       </div>
      ) : (
       <>
        {panel==='cart' && (
         <div className="cart-items">
          {products.filter(p=>cart[p.id]).map(p=>(
           <div className="cart-item" key={p.id}>
            <img src={p.image} alt=""/>
            <div><b>{p.name}</b><small>{p.weight}</small><Price value={p.price}/></div>
            <div className="qty">
             <button aria-label={'زيادة كمية '+p.name} onClick={()=>quantity(p.id,1)} disabled={cart[p.id]>=99}><Plus size={15}/></button>
             <span>{cart[p.id]}</span>
             <button aria-label={'تقليل كمية '+p.name} onClick={()=>quantity(p.id,-1)}><Minus size={15}/></button>
            </div>
            <button className="remove" aria-label={'حذف '+p.name} onClick={()=>setCart(c=>{const n={...c};delete n[p.id];return n})}><X size={16}/></button>
           </div>
          ))}
         </div>
        )}

        <div className="summary">
         <div><span>المنتجات ({count})</span><Price value={total}/></div>
         <div><span>الشحن</span><b>مجاني</b></div>
         <div className="summary-total"><b>الإجمالي</b><Price value={total}/></div>
         <small>المبلغان لنفس الطلب بعملتين؛ لا يتم جمعهما.</small>
        </div>

        {panel==='cart' ? (
         <>
          <button className="primary full" onClick={()=>setPanel('checkout')}>إتمام الطلب <ShoppingBag size={18}/></button>
         </>
        ) : (
         <form onSubmit={submit}>
          <div className="fields">
           <label>الاسم بالكامل<input name="name" autoComplete="name" required minLength={3} maxLength={80} placeholder="مثال: أحمد محمد"/></label>
           <label>رقم الهاتف<input name="phone" type="tel" autoComplete="tel" dir="ltr" required maxLength={22} placeholder="01xxxxxxxxx"/></label>
           <label>الدولة
            <select value={country} onChange={e=>setCountry(e.target.value)}>
             <option value="EG">مصر — الدفع بالجنيه المصري</option>
             <option value="SA">السعودية — الدفع بالريال السعودي</option>
            </select>
           </label>
           <label>المدينة<input name="city" autoComplete="address-level2" required minLength={2} maxLength={80} placeholder="اكتب اسم المدينة"/></label>
           <label className="wide">العنوان بالتفصيل<textarea name="address" autoComplete="street-address" required minLength={8} maxLength={300} placeholder="الحي، الشارع، رقم المبنى أو موقع المزرعة"/></label>
          </div>

          <div className="payment-methods" role="radiogroup" aria-label="اختر طريقة الدفع">
           <label className={`payment-option ${paymentMethod==='kashier'?'selected':''}`}>
            <input
             type="radio"
             name="payment_choice"
             className="payment-option-radio"
             checked={paymentMethod==='kashier'}
             onChange={()=>setPaymentMethod('kashier')}
            />
            <CreditCard size={22} className="payment-option-icon"/>
            <div className="payment-option-info">
             <div className="payment-option-title">
              <span>دفع إلكتروني آمن (كاشير)</span>
              <div className="payment-badges">
               <span className="badge">فيزا / ماستركارد</span>
               <span className="badge">ميزة</span>
               <span className="badge">محافظ إلكترونية</span>
              </div>
             </div>
             <small className="payment-option-desc">
              الدفع الفوري بالجنيه المصري — المبلغ: {number(total*EXCHANGE_RATE)} ج.م
             </small>
            </div>
           </label>

           <label className={`payment-option ${paymentMethod==='cash_on_delivery'?'selected':''}`}>
            <input
             type="radio"
             name="payment_choice"
             className="payment-option-radio"
             checked={paymentMethod==='cash_on_delivery'}
             onChange={()=>setPaymentMethod('cash_on_delivery')}
            />
            <HandCoins size={22} className="payment-option-icon"/>
            <div className="payment-option-info">
             <div className="payment-option-title">
              <span>الدفع عند الاستلام</span>
             </div>
             <small className="payment-option-desc">
              المبلغ المستحق عند التسليم: {number(total*(country==='EG'?EXCHANGE_RATE:1))} {country==='EG'?'جنيه مصري':'ريال سعودي'}
             </small>
            </div>
           </label>
          </div>

          <label className="consent">
           <input type="checkbox" required/>
           أوافق على <a href="/terms">الشروط والأحكام</a> و<a href="/privacy">سياسة الخصوصية</a> وعلى استخدام بياناتي لتجهيز الطلب وتوصيله.
          </label>
          {error&&<p className="error" role="alert">{error}</p>}
          <button className="primary full" type="submit" disabled={saving}>
           {saving?'جارٍ معالجة الطلب…':paymentMethod==='kashier'?'الانتقال للدفع عبر كاشير':'تأكيد الطلب'}
          </button>
          <button className="back" type="button" onClick={()=>setPanel('cart')}>العودة للسلة</button>
         </form>
        )}
       </>
      )}
     </>
    )}
   </dialog>
  </>
 );
}
