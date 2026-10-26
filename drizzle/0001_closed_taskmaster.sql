CREATE TABLE `table_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer NOT NULL,
	`listed` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
