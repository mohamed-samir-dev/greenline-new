CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`request_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text NOT NULL,
	`address` text NOT NULL,
	`country` text NOT NULL,
	`items` text NOT NULL,
	`total_sar_halalas` integer NOT NULL,
	`total_local_cents` integer NOT NULL,
	`currency` text NOT NULL,
	`exchange_rate` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`payment_method` text DEFAULT 'cash_on_delivery' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);