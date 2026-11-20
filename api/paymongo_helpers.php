<?php
declare(strict_types=1);

function shop_catalog(): array
{
    return [
        'sneaker' => ['name' => 'sneaker', 'price' => 1.00],
        'skateboardSetup' => ['name' => 'skateboardSetup', 'price' => 1.00],
        'ST' => ['name' => 'santacruz', 'price' => 1.00],
        'giannis-freak-6' => ['name' => 'thrasher-short', 'price' => 1.00],
        'ja-2' => ['name' => 'independentSetUp', 'price' => 1.00],
        'Converse' => ['name' => 'Converse', 'price' => 1.00],
        'DICKIES' => ['name' => 'DICKIES', 'price' => 1.00],
        'Thrasher hoodie' => ['name' => 'thrasher-hoodie', 'price' => 1.00],
    ];
}

function validated_cart(array $rawItems): array
{
    if (count($rawItems) < 1 || count($rawItems) > 30) {
        respond(422, ['error' => 'Your cart is empty or contains too many items.']);
    }

    $catalog = shop_catalog();
    $items = [];
    foreach ($rawItems as $item) {
        if (!is_array($item)) {
            respond(422, ['error' => 'Invalid cart item.']);
        }
        $id = (string)($item['id'] ?? '');
        $quantity = filter_var($item['qty'] ?? null, FILTER_VALIDATE_INT);
        if (!isset($catalog[$id]) || $quantity === false || $quantity < 1 || $quantity > 20) {
            respond(422, ['error' => 'Your cart contains an invalid product or quantity.']);
        }

        $product = $catalog[$id];
        $items[] = [
            'id' => $id,
            'name' => $product['name'],
            'price' => $product['price'],
            'quantity' => $quantity,
        ];
    }

    return $items;
}

function order_totals(array $items, string $couponCode): array
{
    $subtotal = 0.0;
    foreach ($items as $item) {
        $subtotal += $item['price'] * $item['quantity'];
    }

    $discount = strtoupper(trim($couponCode)) === 'HOOPS20'
        ? round($subtotal * 0.20, 2)
        : 0.0;

    return [
        'subtotal' => $subtotal,
        'discount' => $discount,
        'total' => max(0, $subtotal - $discount),
    ];
}

function paymongo_request(string $method, string $path, array $attributes = []): array
{
    $secretKey = getenv('PAYMONGO_SECRET_KEY');
    if (!is_string($secretKey) || !str_starts_with($secretKey, 'sk_')) {
        throw new RuntimeException('PAYMONGO_SECRET_KEY is not configured.');
    }
    if (!function_exists('curl_init')) {
        throw new RuntimeException('The PHP cURL extension is not enabled.');
    }

    $headers = [
        'Accept: application/json',
        'Authorization: Basic ' . base64_encode($secretKey . ':'),
    ];
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 20,
    ];
    if ($method !== 'GET') {
        $headers[] = 'Content-Type: application/json';
        $options[CURLOPT_HTTPHEADER] = $headers;
        $options[CURLOPT_POSTFIELDS] = json_encode(
            ['data' => ['attributes' => $attributes]],
            JSON_UNESCAPED_UNICODE
        );
    }

    $curl = curl_init('https://api.paymongo.com/v1' . $path);
    if ($curl === false) {
        throw new RuntimeException('Could not initialize PayMongo request.');
    }
    curl_setopt_array($curl, $options);
    $body = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($body === false) {
        throw new RuntimeException('PayMongo connection failed: ' . $curlError);
    }

    $response = json_decode($body, true);
    if (!is_array($response)) {
        throw new RuntimeException('PayMongo returned an invalid response.');
    }
    if ($status < 200 || $status >= 300) {
        $details = $response['errors'][0]['detail'] ?? 'PayMongo request failed.';
        throw new RuntimeException((string)$details);
    }
    if (!isset($response['data']) || !is_array($response['data'])) {
        throw new RuntimeException('PayMongo response did not contain payment data.');
    }

    return $response['data'];
}

function paymongo_status(string $paymentIntentId): array
{
    if (!preg_match('/^pi_[A-Za-z0-9]+$/', $paymentIntentId)) {
        throw new RuntimeException('Invalid PayMongo payment reference.');
    }

    $intent = paymongo_request('GET', '/payment_intents/' . rawurlencode($paymentIntentId));
    $attributes = $intent['attributes'] ?? [];

    return [
        'id' => (string)($intent['id'] ?? ''),
        'status' => (string)($attributes['status'] ?? ''),
        'amount' => (int)($attributes['amount'] ?? 0),
        'currency' => strtoupper((string)($attributes['currency'] ?? '')),
    ];
}
