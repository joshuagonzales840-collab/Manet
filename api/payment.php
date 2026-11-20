<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/paymongo_helpers.php';

$action = $_GET['action'] ?? '';
if ($action === 'create') {
    require_method('POST');
    require_csrf();
    $data = request_data();
    $name = trim((string)($data['name'] ?? ''));
    $email = strtolower(trim((string)($data['email'] ?? '')));
    if (strlen($name) < 2 || strlen($name) > 100) {
        respond(422, ['error' => 'Enter your name before paying.']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        respond(422, ['error' => 'Enter a valid email address before paying.']);
    }
    if (!isset($data['items']) || !is_array($data['items'])) {
        respond(422, ['error' => 'Your cart is empty.']);
    }

    $items = validated_cart($data['items']);
    $totals = order_totals($items, (string)($data['couponCode'] ?? ''));
    $amount = (int)round($totals['total'] * 100);
    if ($amount < 100) {
        respond(422, ['error' => 'Amount must be at least ₱1.00.']);
    }

    try {
        $intent = paymongo_request('POST', '/payment_intents', [
            'amount' => $amount,
            'currency' => 'PHP',
            'payment_method_allowed' => ['qrph'],
            'capture_type' => 'automatic',
            'description' => 'Skambordix Skate Shop order',
        ]);
        $intentId = (string)($intent['id'] ?? '');
        $clientKey = (string)($intent['attributes']['client_key'] ?? '');
        if ($intentId === '' || $clientKey === '') {
            throw new RuntimeException('PayMongo did not return a payment intent.');
        }

        $paymentMethod = paymongo_request('POST', '/payment_methods', ['type' => 'qrph']);
        $attached = paymongo_request(
            'POST',
            '/payment_intents/' . rawurlencode($intentId) . '/attach',
            [
                'payment_method' => (string)($paymentMethod['id'] ?? ''),
                'client_key' => $clientKey,
            ]
        );

        $attributes = $attached['attributes'] ?? [];
        $nextAction = $attributes['next_action'] ?? [];
        $code = $nextAction['code'] ?? $nextAction['qr_code'] ?? $nextAction['qrph'] ?? [];
        $image = (string)($code['image_url'] ?? $code['imageUrl'] ?? $nextAction['image_url'] ?? '');
        if ($image === '') {
            throw new RuntimeException('PayMongo did not return a QR code.');
        }
        if (!str_starts_with($image, 'data:') && !str_starts_with($image, 'http')) {
            $image = 'data:image/png;base64,' . $image;
        }

        respond(200, [
            'qrImageUrl' => $image,
            'paymentIntentId' => (string)($attached['id'] ?? $intentId),
            'clientKey' => $clientKey,
            'status' => (string)($attributes['status'] ?? ''),
        ]);
    } catch (RuntimeException $exception) {
        error_log('PayMongo create payment error: ' . $exception->getMessage());
        respond(502, ['error' => 'Could not create a PayMongo QR payment. Check the server configuration and PayMongo logs.']);
    }
}

if ($action === 'status') {
    require_method('GET');
    require_csrf();
    $paymentIntentId = (string)($_GET['id'] ?? '');
    try {
        respond(200, paymongo_status($paymentIntentId));
    } catch (RuntimeException $exception) {
        error_log('PayMongo payment status error: ' . $exception->getMessage());
        respond(502, ['error' => 'Could not confirm payment status with PayMongo.']);
    }
}

respond(404, ['error' => 'Unknown payment action.']);
