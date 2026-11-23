CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`start_min` integer NOT NULL,
	`end_min` integer NOT NULL,
	`title` text NOT NULL,
	`category_id` text,
	`status` text NOT NULL,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `blocks_date_start_min_idx` ON `blocks` (`date`,`start_min`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
