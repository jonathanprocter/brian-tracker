CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`badgeIcon` varchar(10) NOT NULL,
	`unlockCriteria` text NOT NULL,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int NOT NULL,
	`completedAt` timestamp NOT NULL,
	`anxietyBefore` int NOT NULL,
	`anxietyDuring` int NOT NULL,
	`usedKlonopin` boolean NOT NULL DEFAULT false,
	`winNote` text,
	`xpEarned` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loginActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loggedInAt` timestamp NOT NULL DEFAULT (now()),
	`deviceInfo` text,
	CONSTRAINT `loginActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekNumber` int NOT NULL,
	`taskName` varchar(255) NOT NULL,
	`taskDescription` text NOT NULL,
	`questDescription` text NOT NULL,
	`goalDays` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userAchievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('client','admin') NOT NULL DEFAULT 'client';--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeek` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalXp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentLevel` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `longestStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastCompletionDate` timestamp;