CREATE TABLE `app_waitlist` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_encrypted` text NOT NULL,
	`phone_fingerprint` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_waitlist_phone_fingerprint` ON `app_waitlist` (`phone_fingerprint`);--> statement-breakpoint
CREATE TABLE `business_claims` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`business_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`phone_encrypted` text NOT NULL,
	`proof_object_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewer_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_business_claims_status_created` ON `business_claims` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_business_claims_user` ON `business_claims` (`user_id`);--> statement-breakpoint
CREATE TABLE `customer_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`business_id` text NOT NULL,
	`business_name` text NOT NULL,
	`requirement` text NOT NULL,
	`preferred_date` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone_encrypted` text NOT NULL,
	`phone_fingerprint` text NOT NULL,
	`contact_preference` text NOT NULL,
	`consent_granted` integer NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`approximate_latitude` real,
	`approximate_longitude` real,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customer_enquiries_business_created` ON `customer_enquiries` (`business_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_enquiries_status_expires` ON `customer_enquiries` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_customer_enquiries_fingerprint_created` ON `customer_enquiries` (`phone_fingerprint`,`created_at`);--> statement-breakpoint
CREATE TABLE `saved_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`business_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_saved_businesses_user_business` ON `saved_businesses` (`user_id`,`business_id`);--> statement-breakpoint
CREATE INDEX `idx_saved_businesses_user` ON `saved_businesses` (`user_id`);--> statement-breakpoint
CREATE TABLE `site_users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_site_users_auth_user_id` ON `site_users` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `idx_site_users_email` ON `site_users` (`email`);