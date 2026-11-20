# OninInternVariant6 
http://localhost/Barili/OninInternVariant6/


## Local PHP/MySQL setup (Laragon)

1. Put this project folder under Laragon's `www` directory, then start **Apache** and **MySQL**.
2. Open `http://localhost/Barili/OninInternVariant6/` (do not open the HTML files as `file://` URLs).
3. In phpMyAdmin, import `database.sql`. It creates the `skate_shop` database and the account/order tables.
4. The local database defaults are `127.0.0.1`, database `skate_shop`, user `root`, and an empty password. If yours differ, set `SHOP_DB_HOST`, `SHOP_DB_NAME`, `SHOP_DB_USER`, and `SHOP_DB_PASS` in the Apache/PHP environment, then restart Laragon.
5. To use GCash/PayMongo, configure `PAYMONGO_SECRET_KEY` in the Apache/PHP environment and restart Laragon. Never put this secret in JavaScript or commit it to the project. The PHP cURL extension must be enabled. Rotate the PayMongo secret that was previously embedded in the frontend before using live payments.
6. To enable store-wide reports, set `SHOP_ADMIN_EMAIL` in the Apache/PHP environment to the email address of the registered administrator account, then restart Laragon. Signed-in customers can view only their own order reports; the configured administrator can view store-wide totals. The Reports page filters by date and its Export PDF button opens the browser print dialog, where you can save the report as a PDF.

Registration and sign-in use PHP sessions; passwords are stored as hashes. Checkout supports guest orders too. Orders and their item snapshots appear in phpMyAdmin under `orders` and `order_items`; account passwords are in `users`. GCash orders are marked paid only after the server verifies the PayMongo intent and amount. Cash-on-delivery orders are marked unpaid.

The current storefront catalog prices are all placeholder values of ₱1.00. Update both `js/shop.js` and `api/paymongo_helpers.php` when setting real prices; the PHP values are authoritative for saved order totals and PayMongo charges.