<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$action = $_GET['action'] ?? '';

if ($action === 'csrf') {
    require_method('GET');
    respond(200, ['csrfToken' => csrf_token()]);
}

if ($action === 'current') {
    require_method('GET');
    $user = $_SESSION['user'] ?? null;
    respond(200, ['user' => $user, 'csrfToken' => csrf_token()]);
}

if ($action === 'logout') {
    require_method('POST');
    require_csrf();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => 'Lax',
        ]);
    }
    session_destroy();
    respond(200, ['message' => 'You have been signed out.']);
}

if ($action !== 'register' && $action !== 'login') {
    respond(404, ['error' => 'Unknown account action.']);
}

require_method('POST');
require_csrf();
$data = request_data();

$email = strtolower(trim((string)($data['email'] ?? '')));
$password = (string)($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    respond(422, ['error' => 'Enter a valid email address.']);
}
if (strlen($password) < 10 || strlen($password) > 4096) {
    respond(422, ['error' => 'Password must be at least 10 characters.']);
}

try {
    $pdo = database();

    if ($action === 'register') {
        $name = trim((string)($data['name'] ?? ''));
        if (strlen($name) < 2 || strlen($name) > 100) {
            respond(422, ['error' => 'Enter your name (2 to 100 characters).']);
        }

        $statement = $pdo->prepare(
            'INSERT INTO users (full_name, email, password_hash) VALUES (:name, :email, :password_hash)'
        );
        try {
            $statement->execute([
                'name' => $name,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                respond(409, ['error' => 'An account with that email already exists.']);
            }
            throw $exception;
        }

        $user = [
            'id' => (int)$pdo->lastInsertId(),
            'name' => $name,
            'email' => $email,
        ];
    } else {
        $statement = $pdo->prepare(
            'SELECT id, full_name, email, password_hash FROM users WHERE email = :email LIMIT 1'
        );
        $statement->execute(['email' => $email]);
        $row = $statement->fetch();
        if (!$row || !password_verify($password, $row['password_hash'])) {
            respond(401, ['error' => 'Email or password is incorrect.']);
        }

        $user = [
            'id' => (int)$row['id'],
            'name' => $row['full_name'],
            'email' => $row['email'],
        ];
    }

    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    respond(200, ['user' => $user, 'csrfToken' => csrf_token()]);
} catch (PDOException $exception) {
    error_log('Account database error: ' . $exception->getMessage());
    respond(500, ['error' => 'Account service is unavailable. Check the database setup.']);
}
