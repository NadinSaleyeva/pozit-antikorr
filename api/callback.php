<?php
// ============================================================
//  POZIT — Обработчик формы заявки (CSV-версия)
//  Endpoint: POST /api/callback.php
// ============================================================

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/config.php';

// ── Только POST ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

// ── Honeypot ────────────────────────────────────────────────
if (!empty($_POST['hp'])) {
    exit(json_encode(['success' => true]));
}

// ── Таймер заполнения ───────────────────────────────────────
$loadedAtMs = (int)($_POST['loaded_at'] ?? 0);
if ($loadedAtMs > 0) {
    $elapsed = (microtime(true) * 1000 - $loadedAtMs) / 1000;
    if ($elapsed < MIN_FILL_SECONDS) {
        exit(json_encode(['success' => true]));
    }
}

// ── Очистка и валидация данных ──────────────────────────────
$name    = mb_substr(trim(strip_tags($_POST['name']    ?? '')), 0, 100);
$phone   = mb_substr(trim(preg_replace('/[^\d+\-\(\)\s]/', '', $_POST['phone'] ?? '')), 0, 25);
$message = mb_substr(trim(strip_tags($_POST['message'] ?? '')), 0, 500);
$consent = ($_POST['consent'] ?? '') === 'yes';

if (empty($phone)) {
    http_response_code(422);
    exit(json_encode(['success' => false, 'error' => 'Укажите номер телефона']));
}

if (!$consent) {
    http_response_code(422);
    exit(json_encode(['success' => false, 'error' => 'Необходимо согласие на обработку данных']));
}

// ── Авто-удаление просроченных записей ─────────────────────
cleanupCsv(DATA_FILE);

// ── Сохранение заявки в CSV ─────────────────────────────────
$appId    = date('ymd-His') . '-' . substr(uniqid(), -3);
$now      = date('Y-m-d H:i:s');
$deleteAt = date('Y-m-d H:i:s', strtotime('+' . DATA_RETENTION_DAYS . ' days'));

$row = [
    'id'         => $appId,
    'created_at' => $now,
    'name'       => $name,
    'phone'      => $phone,
    'message'    => $message,
    'delete_at'  => $deleteAt,
    'ip'         => $_SERVER['REMOTE_ADDR'] ?? '',
];

try {
    appendToCsv(DATA_FILE, $row);
} catch (RuntimeException $e) {
    error_log('[POZIT] CSV write error: ' . $e->getMessage());
    http_response_code(500);
    exit(json_encode([
        'success' => false,
        'error'   => 'Ошибка сервера. Позвоните: +375 (29) 687-78-78',
    ]));
}

// ── Лог согласия (хранится 3 года отдельно) ────────────────
appendToCsv(CONSENT_LOG_FILE, [
    'app_id'              => $appId,
    'phone_masked'        => mb_substr($phone, 0, -2) . '**',
    'consent_given_at'    => $now,
    'delete_scheduled_at' => $deleteAt,
    'deleted_at'          => '',
    'ip'                  => $_SERVER['REMOTE_ADDR'] ?? '',
]);

// ── Telegram ────────────────────────────────────────────────
sendTelegram(implode("\n", array_filter([
    "🔔 *Новая заявка*",
    "👤 " . ($name ?: '—'),
    "📞 `{$phone}`",
    $message ? "💬 {$message}" : '',
    "🕐 {$now}",
])));

// ── Email ───────────────────────────────────────────────────
sendEmail(
    "=?UTF-8?B?" . base64_encode("Новая заявка — Антикор Pozit") . "?=",
    "Имя: " . ($name ?: '—') . "\nТелефон: {$phone}\nКомментарий: " . ($message ?: '—') . "\nВремя: {$now}"
);

exit(json_encode(['success' => true, 'id' => $appId]));


// ── Функции ─────────────────────────────────────────────────

/**
 * Добавляет строку в CSV-файл. При первой записи создаёт файл с заголовками.
 * Разделитель — точка с запятой (Excel RU открывает без настроек).
 * UTF-8 BOM добавляется для корректного отображения кириллицы в Excel.
 */
function appendToCsv(string $file, array $row): void
{
    $dir = dirname($file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $isNew = !file_exists($file) || filesize($file) === 0;
    $fp    = fopen($file, 'a');

    if ($fp === false) {
        throw new RuntimeException("Не удалось открыть файл: {$file}");
    }

    flock($fp, LOCK_EX);

    if ($isNew) {
        fwrite($fp, "\xEF\xBB\xBF");               // UTF-8 BOM для Excel
        fputcsv($fp, array_keys($row), ';');         // заголовки
    }
    fputcsv($fp, array_values($row), ';');

    flock($fp, LOCK_UN);
    fclose($fp);
}

/**
 * Удаляет из CSV строки с истёкшим delete_at.
 * Вызывается при каждой новой заявке — cron не обязателен.
 */
function cleanupCsv(string $file): int
{
    if (!file_exists($file) || filesize($file) === 0) {
        return 0;
    }

    $fp = fopen($file, 'r+');
    if ($fp === false) {
        return 0;
    }

    flock($fp, LOCK_EX);

    $headers  = null;
    $keep     = [];
    $deleted  = 0;
    $now      = time();

    while (($row = fgetcsv($fp, 0, ';')) !== false) {
        if ($headers === null) {
            // Убираем BOM из первого поля
            if (isset($row[0])) {
                $row[0] = ltrim($row[0], "\xEF\xBB\xBF");
            }
            $headers = $row;
            continue;
        }

        if (count($row) !== count($headers)) {
            continue;
        }

        $data = array_combine($headers, $row);

        if (!empty($data['delete_at']) && strtotime($data['delete_at']) > $now) {
            $keep[] = $row;
        } else {
            $deleted++;
        }
    }

    if ($deleted > 0) {
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, "\xEF\xBB\xBF");
        fputcsv($fp, $headers, ';');
        foreach ($keep as $line) {
            fputcsv($fp, $line, ';');
        }
    }

    flock($fp, LOCK_UN);
    fclose($fp);

    return $deleted;
}

function sendTelegram(string $text): void
{
    if (TELEGRAM_BOT_TOKEN === '') {
        return;
    }

    $ch = curl_init('https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'chat_id'    => TELEGRAM_CHAT_ID,
            'text'       => $text,
            'parse_mode' => 'Markdown',
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
    ]);
    $result = curl_exec($ch);
    if ($result === false) {
        error_log('[POZIT] Telegram error: ' . curl_error($ch));
    }
    curl_close($ch);
}

function sendEmail(string $subject, string $body): void
{
    if (EMAIL_TO === '') {
        return;
    }

    $headers = implode("\r\n", [
        'From: Pozit.by <' . EMAIL_FROM . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ]);

    @mail(EMAIL_TO, $subject, base64_encode($body), $headers);
}
