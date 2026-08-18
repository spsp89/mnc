CREATE TABLE `contact_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`topic` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_contact_requests_status_created` ON `contact_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_contact_requests_email_created` ON `contact_requests` (`email`,`created_at`);