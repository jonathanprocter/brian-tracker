CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`reminderTime` varchar(5) NOT NULL DEFAULT '09:00',
	`lastNotifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_userId_unique` UNIQUE(`userId`)
);
