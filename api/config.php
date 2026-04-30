<?php
// ============================================================
//  POZIT — Конфигурация (CSV-версия, без базы данных)
// ============================================================

// ── Часовой пояс ─────────────────────────────────────────────
date_default_timezone_set('Europe/Minsk');

// ── Файлы данных ─────────────────────────────────────────────
define('DATA_DIR',          dirname(__DIR__) . '/data');
define('DATA_FILE',         DATA_DIR . '/applications.csv');
define('CONSENT_LOG_FILE',  DATA_DIR . '/consent_log.csv');

// ── Telegram (опционально) ───────────────────────────────────
// Получить токен: написать @BotFather → /newbot
// Узнать chat_id: написать @userinfobot
define('TELEGRAM_BOT_TOKEN', '');   // вставить токен
define('TELEGRAM_CHAT_ID',   '');   // вставить числовой ID

// ── Email (опционально) ──────────────────────────────────────
define('EMAIL_TO',   '');                  // куда слать заявки
define('EMAIL_FROM', 'noreply@pozit.by');  // от кого

// ── Защита от спама ──────────────────────────────────────────
define('MIN_FILL_SECONDS',    3);   // меньше 3 сек — бот
define('DATA_RETENTION_DAYS', 30);  // дней хранения персданных
