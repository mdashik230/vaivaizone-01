# Security Specification

## Data Invariants
1. Only authorized administrators can modify products, categories, and site configurations.
2. Anyone can read products and categories to browse the shop.
3. Anyone can create an order, but only admins can update order status.
4. Administrative access is restricted specifically to a whitelist of verified Google emails.

## Whitelisted Admin Emails
- mdashik23010@gmail.com
- loverblack2022@gmail.com

## The "Dirty Dozen" Payloads (Test cases for PERMISSION_DENIED)
1. **Unauthorized Product Create**: Unauthenticated user trying to add a product.
2. **Unauthorized Product Update**: Authenticated non-admin user trying to change a price.
3. **Unauthorized Config Edit**: Authenticated non-admin user trying to change Telegram settings.
4. **Order Hijacking**: User trying to read an order belonging to someone else.
5. **Unauthorized Status Update**: Customer trying to change their own order status to "Completed" without payment.
6. **Shadow Field Injection**: Admin trying to add a field not in the schema.
7. **Identity Spoofing**: User trying to create an order with someone else's email in Auth.
8. **Resource Poisoning**: Injection of massive strings into ID fields.
9. **PII Exposure**: Unauthenticated user listing all orders with customer phone numbers.
10. **Global Write**: Attempting to write to a non-existent collection.
11. **Malicious Delete**: Non-admin trying to delete the entire products collection.
12. **Expired Session**: Trying to write with an expired token.

## Test Runner (TDD Plan)
We will verify that `isAdmin()` correctly identifies the two emails and denies all others.
- `allow read, write: if isAdmin()` for configs and products (write).
- `allow read: if true` for products/categories.
- `allow create: if true` for orders.
- `allow read, update: if isAdmin()` for orders.
