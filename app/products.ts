export const EXCHANGE_RATE = 13.95;
export const products = [
 {id:1,name:'جرين جرو المتوازن',en:'BALANCED NUTRITION',formula:'NPK 20-20-20',category:'أسمدة مركبة',price:1000,weight:'25 كجم',tag:'اختيار الموسم',color:'#38694c',description:'تركيبة متوازنة تجمع العناصر الأساسية ضمن برنامج تغذية المحاصيل.',spec:'نيتروجين 20% · فوسفور 20% · بوتاسيوم 20%'},
 {id:2,name:'أورجانيك بلس',en:'ORGANIC MATTER',formula:'ORGANIC PLUS',category:'أسمدة عضوية',price:500,weight:'20 كجم',tag:'عضوي',color:'#876746',description:'سماد عضوي لإضافته إلى خطتك للعناية بالتربة والمحاصيل.',spec:'مادة عضوية'},
 {id:3,name:'بوتاسيوم باور',en:'FRUIT & FLOWER',formula:'NPK 12-12-36',category:'أسمدة مركبة',price:1800,weight:'25 كجم',tag:'تغذية متخصصة',color:'#a77b35',description:'تركيبة عالية البوتاسيوم ضمن مجموعة تغذية مرحلة الإثمار.',spec:'نيتروجين 12% · فوسفور 12% · بوتاسيوم 36%'},
 {id:4,name:'هيوميك روت',en:'ROOT CARE',formula:'HUMIC ACID',category:'محسنات تربة',price:1500,weight:'10 كجم',tag:'عناية بالجذور',color:'#624a37',description:'محسن تربة ضمن مجموعة جرين لاين للعناية بمنطقة الجذور.',spec:'أحماض هيوميك'},
 {id:5,name:'كالسيوم برو',en:'CALCIUM COMPLEX',formula:'CALCIUM + B',category:'عناصر صغرى',price:2500,weight:'20 لتر',tag:'تركيبة سائلة',color:'#476d87',description:'مزيج من الكالسيوم والبورون للتغذية الزراعية المتخصصة.',spec:'كالسيوم + بورون'},
 {id:6,name:'جرين ماكس الاحترافي',en:'PROFESSIONAL SERIES',formula:'NPK 15-5-30',category:'أسمدة مركبة',price:3500,weight:'50 كجم',tag:'عبوة المزارع',color:'#344b42',description:'عبوة كبيرة من الأسمدة المركبة لمتطلبات المزارع.',spec:'نيتروجين 15% · فوسفور 5% · بوتاسيوم 30%'}
];
export type Product = typeof products[number];
export const number = (value:number) => new Intl.NumberFormat('en-US').format(value);
