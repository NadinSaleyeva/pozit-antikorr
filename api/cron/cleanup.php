<?php
// ============================================================
//  POZIT — Ручная/cron-очистка CSV (необязательно)
//  callback.php уже чистит автоматически при каждой заявке.
//  Этот скрипт — для запуска вручную или раз в сутки через cron:
//  0 3 * * * php /home/.../api/cron/cleanup.php >> /home/.../logs/cleanup.log 2>&1
// ============================================================

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Forbidden');
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../callback.php'; // подключаем cleanupCsv()

$now = date('Y-m-d H:i:s');
echo "[{$now}] Запуск очистки\n";

$deleted = cleanupCsv(DATA_FILE);
echo "[{$now}] Удалено заявок: {$deleted}\n";

// Обновляем лог согласий — отмечаем удалённые
if ($deleted > 0 && file_exists(CONSENT_LOG_FILE) && filesize(CONSENT_LOG_FILE) > 0) {
    $rows    = [];
    $headers = null;
    $fp      = fopen(CONSENT_LOG_FILE, 'r');

    while (($row = fgetcsv($fp, 0, ';')) !== false) {
        if ($headers === null) {
            $row[0]  = ltrim($row[0], "\xEF\xBB\xBF");
            $headers = $row;
            continue;
        }
        $data = array_combine($headers, $row);
        if ($data['deleted_at'] === '' && strtotime($data['delete_scheduled_at']) <= time()) {
            $data['deleted_at'] = date('Y-m-d H:i:s');
        }
        $rows[] = array_values($data);
    }
    fclose($fp);

    $fp = fopen(CONSENT_LOG_FILE, 'w');
    fwrite($fp, "\xEF\xBB\xBF");
    fputcsv($fp, $headers, ';');
    foreach ($rows as $r) {
        fputcsv($fp, $r, ';');
    }
    fclose($fp);
    echo "[{$now}] Журнал согласий обновлён\n";
}

echo "[{$now}] Готово\n";
