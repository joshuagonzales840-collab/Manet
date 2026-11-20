<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/paymongo_helpers.php';
require_method('POST');
require_csrf();
$data = request_data();

$name = trim((string)($data['name'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$phone = trim((string)($data['phone'] ?? ''));
$address = trim((string)($data['address'] ?? ''));
$method = (string)($data['paymentMethod'] ?? '');
$token = (string)($data['requestToken'] ?? '');
$paymentReference = trim((string)($data['paymentReference'] ?? ''));

if (strlen($name) < 2 || strlen($name) > 100) {
    respond(422, ['error' => 'Enter your full name.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    respond(422, ['error' => 'Enter a valid email address.']);
}
if (strlen($phone) < 7 || strlen($phone) > 30) {
    respond(422, ['error' => 'Enter a valid phone number.']);
}
if (strlen($address) < 5 || strlen($address) > 500) {
    respond(422, ['error' => 'Enter your delivery address.']);
}
if (!in_array($method, ['cod', 'gcash'], true)) {
    respond(422, ['error' => 'Choose a supported payment method.']);
}
if (!preg_match('/^[A-Za-z0-9-]{20,64}$/', $token)) {
    respond(422, ['error' => 'Invalid order request. Please refresh checkout and try again.']);
}
if ($method === 'gcash' && ($paymentReference === '' || strlen($paymentReference) > 100)) {
    respond(422, ['error' => 'Missing PayMongo payment reference.']);
}
if (!isset($data['items']) || !is_array($data['items'])) {
    respond(422, ['error' => 'Your cart is empty or contains too many items.']);
}

$items = validated_cart($data['items']);
$totals = order_totals($items, (string)($data['couponCode'] ?? ''));
$subtotal = $totals['subtotal'];
$discount = $totals['discount'];
$total = $totals['total'];
$userId = isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : null;
$paymentStatus = 'unpaid';

if ($method === 'gcash') {
    try {
        $payment = paymongo_status($paymentReference);
    } catch (RuntimeException $exception) {
        error_log('PayMongo order verification error: ' . $exception->getMessage());
        respond(502, ['error' => 'Could not verify the payment with PayMongo.']);
    }

    if ($payment['status'] !== 'succeeded'
        || $payment['amount'] !== (int)round($total * 100)
        || $payment['currency'] !== 'PHP') {
        respond(422, ['error' => 'Payment is not confirmed or does not match this order total.']);
    }
    $paymentStatus = 'paid';
}

try {
    $pdo = database();
    $pdo->beginTransaction();

    $existing = $pdo->prepare('SELECT id FROM orders WHERE request_token = :token LIMIT 1');
    $existing->execute(['token' => $token]);
    $existingId = $existing->fetchColumn();
    if ($existingId !== false) {
        $pdo->commit();
        respond(200, ['orderId' => (int)$existingId, 'message' => 'Order already saved.']);
    }

    $insertOrder = $pdo->prepare(
        'INSERT INTO orders
            (user_id, request_token, customer_name, customer_email, customer_phone, delivery_address,
             payment_method, payment_status, payment_reference, subtotal, discount, total)
         VALUES
            (:user_id, :request_token, :customer_name, :customer_email, :customer_phone, :delivery_address,
             :payment_method, :payment_status, :payment_reference, :subtotal, :discount, :total)'
    );
    $insertOrder->execute([
        'user_id' => $userId,
        'request_token' => $token,
        'customer_name' => $name,
        'customer_email' => $email,
        'customer_phone' => $phone,
        'delivery_address' => $address,
        'payment_method' => $method,
        'payment_status' => $paymentStatus,
        'payment_reference' => $paymentReference !== '' ? $paymentReference : null,
        'subtotal' => number_format($subtotal, 2, '.', ''),
        'discount' => number_format($discount, 2, '.', ''),
        'total' => number_format($total, 2, '.', ''),
    ]);

    $orderId = (int)$pdo->lastInsertId();
    $insertItem = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
         VALUES (:order_id, :product_id, :product_name, :unit_price, :quantity)'
    );
    foreach ($items as $item) {
        $insertItem->execute([
            'order_id' => $orderId,
            'product_id' => $item['id'],
            'product_name' => $item['name'],
            'unit_price' => number_format($item['price'], 2, '.', ''),
            'quantity' => $item['quantity'],
        ]);
    }

    $pdo->commit();
    respond(201, ['orderId' => $orderId, 'message' => 'Order saved.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Order database error: ' . $exception->getMessage());
    respond(500, ['error' => 'Could not save your order. Please try again.']);
}
