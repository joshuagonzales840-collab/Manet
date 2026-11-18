<?php
/**
 * K-Tix Assist - Configuration (MySQL storage)
 */
session_start();

define('APP_NAME', 'K-Tix Assist');
define('APP_ROOT', dirname(__DIR__, 2));  // project root (so /lib is found on Vercel)
define('DATA_DIR', '/tmp/ktix-data');
define('USERS_FILE', DATA_DIR . '/users.json');
define('UPLOAD_DIR', '/tmp/ktix-uploads');
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'ktix_assist');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');

// Create folders if they don't exist (used for uploads and local mail debugging)
if (!is_dir(DATA_DIR))  @mkdir(DATA_DIR, 0755, true);
if (!is_dir(UPLOAD_DIR)) @mkdir(UPLOAD_DIR, 0755, true);
// ─── EMAIL / SMTP (edit these for real verification emails) ───
// For Gmail: enable 2FA → create App Password, use smtp.gmail.com port 587
// Configure SMTP with environment variables; credentials must not be committed.
define('SMTP_ENABLED', getenv('SMTP_ENABLED') === '1');
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_SECURE', getenv('SMTP_SECURE') ?: 'tls');
define('SMTP_USER', getenv('SMTP_USER') ?: '');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL') ?: '');
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: APP_NAME);

// Face matching threshold (Euclidean distance). 0.58 = moderate
define('FACE_MATCH_THRESHOLD', 0.58);

function dbConnection(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    if (!preg_match('/^[A-Za-z0-9_]+$/', DB_NAME)) {
        throw new RuntimeException('DB_NAME must contain only letters, numbers, and underscores.');
    }

    $server = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $server->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(254) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(32) NOT NULL DEFAULT "customer",
            verified TINYINT(1) NOT NULL DEFAULT 0,
            verify_code VARCHAR(6) NULL,
            verify_expires BIGINT NULL,
            id_filename VARCHAR(512) NULL,
            face_filename VARCHAR(512) NULL,
            face_embedding JSON NULL,
            id_number VARCHAR(255) NULL,
            id_type VARCHAR(100) NULL,
            id_face_quality INT NOT NULL DEFAULT 0,
            id_ocr_score INT NOT NULL DEFAULT 0,
            id_ocr_snippet TEXT NULL,
            face_verified TINYINT(1) NOT NULL DEFAULT 0,
            face_match_score DOUBLE NOT NULL DEFAULT 0,
            reset_token VARCHAR(6) NULL,
            reset_expires BIGINT NULL,
            created_at VARCHAR(32) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS app_migrations (
            migration VARCHAR(100) NOT NULL PRIMARY KEY,
            completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    migrateLegacyUsers($pdo);

    return $pdo;
}

function migrateLegacyUsers(PDO $pdo): void {
    $migration = 'import_json_users_v1';
    $check = $pdo->prepare('SELECT migration FROM app_migrations WHERE migration = ?');
    $check->execute([$migration]);
    if ($check->fetchColumn()) return;

    $pdo->beginTransaction();
    try {
        $check->execute([$migration]);
        if (!$check->fetchColumn() && is_file(USERS_FILE)) {
            $raw = file_get_contents(USERS_FILE);
            if ($raw === false) throw new RuntimeException('Could not read the previous user data file.');
            $users = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($users)) throw new RuntimeException('The previous user data file has an invalid format.');
            foreach ($users as $user) {
                if (is_array($user) && !empty($user['email']) && !empty($user['password'])) {
                    insertUser($pdo, $user, true);
                }
            }
        }
        $mark = $pdo->prepare('INSERT INTO app_migrations (migration) VALUES (?)');
        $mark->execute([$migration]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}

function userDatabaseValues(array $user): array {
    return [
        'name' => $user['name'] ?? '',
        'email' => strtolower(trim((string)($user['email'] ?? ''))),
        'password_hash' => $user['password'] ?? $user['password_hash'] ?? '',
        'role' => $user['role'] ?? 'customer',
        'verified' => (int)($user['verified'] ?? 0),
        'verify_code' => $user['verify_code'] ?? null,
        'verify_expires' => $user['verify_expires'] ?? null,
        'id_filename' => $user['id_filename'] ?? null,
        'face_filename' => $user['face_filename'] ?? null,
        'face_embedding' => isset($user['face_embedding'])
            ? json_encode($user['face_embedding'], JSON_THROW_ON_ERROR)
            : null,
        'id_number' => $user['id_number'] ?? null,
        'id_type' => $user['id_type'] ?? null,
        'id_face_quality' => (int)($user['id_face_quality'] ?? 0),
        'id_ocr_score' => (int)($user['id_ocr_score'] ?? 0),
        'id_ocr_snippet' => $user['id_ocr_snippet'] ?? null,
        'face_verified' => (int)($user['face_verified'] ?? 0),
        'face_match_score' => (float)($user['face_match_score'] ?? 0),
        'reset_token' => $user['reset_token'] ?? null,
        'reset_expires' => $user['reset_expires'] ?? null,
        'created_at' => $user['created_at'] ?? date('c'),
    ];
}

function insertUser(PDO $pdo, array $user, bool $preserveId = false): void {
    $values = userDatabaseValues($user);
    $columns = array_keys($values);
    if ($preserveId && isset($user['id'])) {
        array_unshift($columns, 'id');
        $values = ['id' => (int)$user['id']] + $values;
    }
    $columnSql = implode(', ', $columns);
    $placeholderSql = implode(', ', array_map(static fn(string $column): string => ':' . $column, $columns));
    $statement = $pdo->prepare('INSERT INTO users (' . $columnSql . ') VALUES (' . $placeholderSql . ')');
    $statement->execute($values);
}

function getUsers(): array {
    $users = dbConnection()->query('SELECT *, password_hash AS password FROM users ORDER BY id')->fetchAll();
    foreach ($users as &$user) {
        $user['face_embedding'] = $user['face_embedding'] !== null
            ? json_decode($user['face_embedding'], true, 512, JSON_THROW_ON_ERROR)
            : null;
    }
    return $users;
}

function findUserByEmail(string $email): ?array {
    $statement = dbConnection()->prepare('SELECT *, password_hash AS password FROM users WHERE email = ?');
    $statement->execute([strtolower(trim($email))]);
    $user = $statement->fetch();
    if (!$user) return null;
    $user['face_embedding'] = $user['face_embedding'] !== null
        ? json_decode($user['face_embedding'], true, 512, JSON_THROW_ON_ERROR)
        : null;
    return $user;
}

function findUserById(int $id): ?array {
    $statement = dbConnection()->prepare('SELECT *, password_hash AS password FROM users WHERE id = ?');
    $statement->execute([$id]);
    $user = $statement->fetch();
    if (!$user) return null;
    $user['face_embedding'] = $user['face_embedding'] !== null
        ? json_decode($user['face_embedding'], true, 512, JSON_THROW_ON_ERROR)
        : null;
    return $user;
}

function createUser(array $user): void {
    insertUser(dbConnection(), $user);
}

function updateUser(int $id, array $fields): bool {
    $columnMap = [
        'name' => 'name',
        'email' => 'email',
        'password' => 'password_hash',
        'role' => 'role',
        'verified' => 'verified',
        'verify_code' => 'verify_code',
        'verify_expires' => 'verify_expires',
        'id_filename' => 'id_filename',
        'face_filename' => 'face_filename',
        'face_embedding' => 'face_embedding',
        'id_number' => 'id_number',
        'id_type' => 'id_type',
        'id_face_quality' => 'id_face_quality',
        'id_ocr_score' => 'id_ocr_score',
        'id_ocr_snippet' => 'id_ocr_snippet',
        'face_verified' => 'face_verified',
        'face_match_score' => 'face_match_score',
        'reset_token' => 'reset_token',
        'reset_expires' => 'reset_expires',
    ];
    $assignments = [];
    $values = [];
    foreach ($fields as $field => $value) {
        if (!isset($columnMap[$field])) throw new InvalidArgumentException('Unsupported user field: ' . $field);
        $column = $columnMap[$field];
        $assignments[] = $column . ' = :' . $column;
        $values[$column] = $field === 'face_embedding' && $value !== null
            ? json_encode($value, JSON_THROW_ON_ERROR)
            : $value;
    }
    if (!$assignments) return false;
    $values['id'] = $id;
    $statement = dbConnection()->prepare('UPDATE users SET ' . implode(', ', $assignments) . ' WHERE id = :id');
    $statement->execute($values);
    return $statement->rowCount() > 0;
}

function jsonResponse(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function requireAuth(?string $requiredRole = null): array {
    if (empty($_SESSION['user_id'])) {
        header('Location: /');
        exit;
    }
    $user = findUserById((int)$_SESSION['user_id']);
    if (!$user) {
        session_destroy();
        header('Location: /');
        exit;
    }
    if ($requiredRole !== null && strtolower($user['role']) !== strtolower($requiredRole)) {
        header('Location: ' . roleDashboard($user['role']));
        exit;
    }
    return [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'verified' => $user['verified']
    ];
}

function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']);
}

function roleDashboard(string $role): string {
    return match (strtolower($role)) {
        'admin' => '/dashboard-admin.php',
        'staff' => '/dashboard-staff.php',
        default => '/dashboard-customer.php',
    };
}

/**
 * Log verification / reset codes to data/last_codes.log for local debugging
 * when SMTP is misconfigured. Never exposed in API responses.
 */
function logCode(string $email, string $type, string $code): void {
    $line = date('c') . " | {$type} | {$email} | {$code}\n";
    @file_put_contents(DATA_DIR . '/last_codes.log', $line, FILE_APPEND | LOCK_EX);
}
