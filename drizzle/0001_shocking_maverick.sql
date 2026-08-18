CREATE TABLE `business_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`application_type` text NOT NULL,
	`business_name` text NOT NULL,
	`owner_name` text NOT NULL,
	`category` text NOT NULL,
	`city` text NOT NULL,
	`locality` text NOT NULL,
	`phone_encrypted` text NOT NULL,
	`phone_fingerprint` text NOT NULL,
	`proof_object_key` text,
	`requested_plan` text DEFAULT 'free' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`consent_granted` integer NOT NULL,
	`reviewer_notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_business_applications_status_created` ON `business_applications` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_business_applications_fingerprint` ON `business_applications` (`phone_fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_business_applications_user` ON `business_applications` (`user_id`);