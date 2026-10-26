CREATE TABLE `openboard_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer NOT NULL,
	`credentials` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
