CREATE TABLE `activityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` enum('login','logout','page_view','task_started','task_completed','settings_viewed','stats_viewed','achievements_viewed','session_start','session_end') NOT NULL,
	`pagePath` varchar(255),
	`ipAddress` varchar(45),
	`userAgent` text,
	`deviceType` varchar(50),
	`browser` varchar(100),
	`os` varchar(100),
	`sessionId` varchar(64),
	`sessionDuration` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityLogs_id` PRIMARY KEY(`id`)
);
