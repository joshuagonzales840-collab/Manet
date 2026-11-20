<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_method('GET');

$user = $_SESSION['user'] ?? null;
if (!is_array($user) || !isset($user['id'], $user['email'])) {
    respond(401, ['error' => 'Sign in to view reports.']);
}

function report_date(string $value): ?DateTimeImmutable
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    $errors = DateTimeImmutable::getLastErrors();
    if (!$date || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))
        || $date->format('Y-m-d') !== $value) {
        return null;
    }

    return $date;
}

$today = new DateTimeImmutable('today');
$fromValue = (string)($_GET['from'] ?? $today->modify('first day of this month')->format('Y-m-d'));
$toValue = (string)($_GET['to'] ?? $today->format('Y-m-d'));
$from = report_date($fromValue);
$to = report_date($toValue);
if (!$from || !$to || $from > $to) {
    respond(422, ['error' => 'Choose a valid date range with the start date on or before the end date.']);
}

$configuredAdminEmail = getenv('SHOP_ADMIN_EMAIL');
$isAdmin = is_string($configuredAdminEmail)
    && $configuredAdminEmail !== ''
    && strtolower(trim($configuredAdminEmail)) === strtolower((string)$user['email']);

$conditions = ['created_at >= :from_date', 'created_at < :to_date'];
$parameters = [
    'from_date' => $from->format('Y-m-d') . ' 00:00:00',
    'to_date' => $to->modify('+1 day')->format('Y-m-d') . ' 00:00:00',
];
if (!$isAdmin) {
    $conditions[] = 'user_id = :user_id';
    $parameters['user_id'] = (int)$user['id'];
}
$where = implode(' AND ', $conditions);

try {
    $pdo = database();
    $summary = $pdo->prepare(
        "SELECT COUNT(*) AS order_count,
                COALESCE(SUM(CASE WHEN order_status <> 'cancelled' THEN total ELSE 0 END), 0) AS sales_total,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status <> 'cancelled'
                                  THEN total ELSE 0 END), 0) AS paid_sales_total
         FROM orders
         WHERE {$where}"
    );
    $summary->execute($parameters);
    $totals = $summary->fetch();

    $orders = $pdo->prepare(
        "SELECT id, created_at, order_status, payment_status, payment_method, total
         FROM orders
         WHERE {$where}
         ORDER BY created_at DESC, id DESC"
    );
    $orders->execute($parameters);

    respond(200, [
        'from' => $from->format('Y-m-d'),
        'to' => $to->format('Y-m-d'),
        'scope' => $isAdmin ? 'all' : 'personal',
        'summary' => [
            'orderCount' => (int)$totals['order_count'],
            'salesTotal' => (float)$totals['sales_total'],
            'paidSalesTotal' => (float)$totals['paid_sales_total'],
        ],
        'orders' => array_map(
            static fn(array $order): array => [
                'id' => (int)$order['id'],
                'createdAt' => $order['created_at'],
                'orderStatus' => $order['order_status'],
                'paymentStatus' => $order['payment_status'],
                'paymentMethod' => $order['payment_method'],
                'total' => (float)$order['total'],
            ],
            $orders->fetchAll()
        ),
    ]);
} catch (PDOException $exception) {
    error_log('Reports database error: ' . $exception->getMessage());
    respond(500, ['error' => 'Reports are unavailable. Check the database setup.']);
}
