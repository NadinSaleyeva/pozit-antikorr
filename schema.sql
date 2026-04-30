-- ============================================================
--  POZIT — Схема базы данных
--  Запустить один раз в phpMyAdmin или через mysql CLI:
--  mysql -u user -p database_name < schema.sql
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+03:00';

-- Таблица заявок (хранится 30 дней, затем физически удаляется)
CREATE TABLE IF NOT EXISTS `applications` (
    `id`                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `name`              VARCHAR(100)    NOT NULL DEFAULT '',
    `phone`             VARCHAR(25)     NOT NULL,
    `message`           TEXT,
    `consent_given_at`  DATETIME        NOT NULL,
    `ip_address`        VARCHAR(45)     DEFAULT NULL,
    `user_agent`        VARCHAR(500)    DEFAULT NULL,
    `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `delete_at`         DATETIME        NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_delete_at`   (`delete_at`),
    INDEX `idx_created_at`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Заявки. Удаляются автоматически по delete_at (30 дней).';


-- Журнал согласий (хранится 3 года — требование ч. 8 ст. 5 Закона № 99-З)
-- Здесь нет персданных: телефон замаскирован, имя не хранится
CREATE TABLE IF NOT EXISTS `consent_log` (
    `id`                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `application_id`      INT UNSIGNED  NOT NULL,
    `phone_masked`        VARCHAR(25)   NOT NULL COMMENT 'Последние 2 цифры заменены на **',
    `consent_given_at`    DATETIME      NOT NULL,
    `delete_scheduled_at` DATETIME      NOT NULL COMMENT 'Когда персданные должны быть удалены',
    `deleted_at`          DATETIME      DEFAULT NULL COMMENT 'Факт удаления персданных',
    `ip_address`          VARCHAR(45)   DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_delete_scheduled` (`delete_scheduled_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Журнал согласий. Хранится 3 года.';
