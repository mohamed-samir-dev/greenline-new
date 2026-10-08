import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const orders=sqliteTable('orders',{
 id:text('id').primaryKey(), requestKey:text('request_key').notNull().unique(), payloadHash:text('payload_hash').notNull(),
 name:text('name').notNull(),phone:text('phone').notNull(),city:text('city').notNull(),address:text('address').notNull(),country:text('country').notNull(),
 items:text('items').notNull(), totalSarHalalas:integer('total_sar_halalas').notNull(),totalLocalCents:integer('total_local_cents').notNull(),currency:text('currency').notNull(),exchangeRate:text('exchange_rate').notNull(),
 status:text('status').notNull().default('new'),paymentMethod:text('payment_method').notNull().default('cash_on_delivery'),createdAt:text('created_at').notNull()
});
