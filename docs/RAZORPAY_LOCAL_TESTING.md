# Local Razorpay Webhook Testing Guide with zrok

This guide provides step-by-step instructions for testing Razorpay payments and incoming webhooks locally in **KisanDirect / Kisanova** using **zrok** (an open-source, zero-trust tunneling tool by OpenZiti).

---

## 1. Architecture Overview

```
 Browser / Mobile Client
        │
        ▼ (1. Checkout / Pay)
 Next.js Dev Server (http://localhost:3000)
        │
        ▼ (2. Create Order & Verify)
 Razorpay Test Mode Gateway
        │
        ▼ (3. Asynchronous Webhook Event: payment.captured, order.paid, etc.)
 Public HTTPS Internet
        │
        ▼ (4. Encrypted Inbound Tunnel)
 zrok Public Edge
        │
        ▼
 zrok local daemon
        │
        ▼ (5. Delivery to Local Endpoint)
 http://localhost:3000/api/webhooks/razorpay
        │
        ▼ (6. HMAC SHA256 Signature Verification & Deduplication)
 MongoDB (Order CONFIRMED & Captured)
```

---

## 2. Prerequisites

1. **Running Next.js Dev Server**: `http://localhost:3000`
2. **Running MongoDB Instance**: `mongodb://127.0.0.1:27017/KISANOVA`
3. **Razorpay Account (Test Mode Only)**: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
4. **zrok CLI**: Downloaded and enabled on your Windows system.

---

## 3. Environment Variables Setup

Ensure your local `.env.local` contains your Razorpay **Test Mode** credentials.

> **CRITICAL SECURITY RULE**: Never commit `.env.local` or expose Razorpay secrets. `.env.local` is listed in `.gitignore`.

### Template (`.env.example`)
```env
# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_test_key_id
```

### Local Development (`.env.local`)
Fill in your actual values from the Razorpay Dashboard:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

> **Note**: `RAZORPAY_WEBHOOK_SECRET` is a passphrase you choose yourself when configuring the webhook in the Razorpay Dashboard. It must match identically between Razorpay and `.env.local`.

---

## 4. Installing & Enabling zrok on Windows

### Step 4.1: Download zrok for Windows
You can download the Windows binary from the official OpenZiti GitHub releases:

1. Open PowerShell and create a tools directory (if desired):
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\bin"
   ```
2. Download and extract the latest Windows `amd64` release:
   - Visit: [https://github.com/openziti/zrok/releases/latest](https://github.com/openziti/zrok/releases/latest)
   - Download the file named: `zrok_*_windows_amd64.tar.gz` (or `.zip`)
   - Extract `zrok.exe` into `$env:USERPROFILE\bin` or any directory in your system `PATH`.

3. Alternatively, using PowerShell one-liner to download:
   ```powershell
   Invoke-WebRequest -Uri "https://github.com/openziti/zrok/releases/download/v2.0.4/zrok_2.0.4_windows_amd64.tar.gz" -OutFile "$env:TEMP\zrok.tar.gz"
   tar -zxvf "$env:TEMP\zrok.tar.gz" -C "$env:USERPROFILE\bin" zrok.exe
   ```

4. Verify zrok is in your PATH:
   ```powershell
   zrok version
   ```

### Step 4.2: First-Time zrok Account Activation
If you have not activated zrok before:
```powershell
zrok invite
```
- Enter your email address when prompted.
- Check your inbox for the invitation email and click the verification link to choose a password.
- Copy your **enable token** from the confirmation page.
- Enable your environment:
  ```powershell
  zrok enable <your_secret_token>
  ```

---

## 5. Starting the Local Tunnel

### Step 5.1: Start Kisanova Dev Server
In Terminal 1 (from your repository root `d:\sih2026`):
```powershell
npm run dev
```
Verify the site loads at `http://localhost:3000`.

### Step 5.2: Launch zrok Public Tunnel
In Terminal 2, run:
```powershell
zrok share public 3000
```
*(Or specify the full local URL: `zrok share public http://localhost:3000`)*

### Step 5.3: Identify the Generated Public URL
zrok will display a status window in Terminal 2 showing:
```
[INFO]:  zrok v2.0.4
[INFO]:  sharing: http://localhost:3000
[INFO]:  public endpoint: https://abcdef123456.share.zrok.io
```

Your generated public URL is:
```
https://<generated-zrok-url>
```
*(Example: `https://abcdef123456.share.zrok.io`)*

> **IMPORTANT**: Keep this Terminal 2 window open while testing. If you restart zrok, a new URL will be generated and you will need to update the URL in your Razorpay Dashboard.

---

## 6. Configuring the Webhook in Razorpay Test Mode

1. Log in to your **Razorpay Dashboard**: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (toggle on top-left / top-right of the dashboard).
3. Navigate to:
   **Account & Settings** $\rightarrow$ **Webhooks** (under Website and app settings)
4. Click **+ Add New Webhook**.
5. Fill in the webhook parameters:
   - **Webhook URL**:
     ```
     https://<generated-zrok-url>/api/webhooks/razorpay
     ```
     *(Example: `https://abcdef123456.share.zrok.io/api/webhooks/razorpay`)*
   - **Secret**: Enter the exact secret you placed in `RAZORPAY_WEBHOOK_SECRET` in `.env.local`.
   - **Alert Email**: Your email address for notification if webhook deliveries fail.
6. Select the **Active Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.created`
   - `refund.processed`
7. Click **Create Webhook**.

---

## 7. Testing the Payment & Webhook Lifecycle

### Flow A: End-to-End Success Flow
1. Open your browser and navigate to:
   ```
   http://localhost:3000/marketplace
   ```
2. Add a produce lot (e.g. Tomatoes or Potatoes) to your cart.
3. Open Cart $\rightarrow$ Proceed to Checkout (`/consumer/checkout`).
4. Enter delivery address details and select **Instant UPI** or **Debit / Credit Card**.
5. Click **Pay & Confirm Order**.
6. The Razorpay Test Modal will open:
   - For UPI: Enter test UPI ID: `success@razorpay` (or click "Success").
   - For Card: Use standard Razorpay test card credentials.
7. Click **Pay**.
8. Observe:
   - Client verifies cryptographic signature via `POST /api/payments/verify`.
   - Order transitions to `CONFIRMED` and `CAPTURED`.
   - In Terminal 1 (Next.js server), observe:
     ```
     ========================================
     [Razorpay Webhook] Incoming event: payment.captured
       Event ID : evt_xxxxxxxxxxxxxx
       Timestamp: 2026-09-11T...
     ========================================
     [Razorpay Webhook] Successfully processed and reconciled payment.captured
     ```
   - Inventory is deducted exactly once (`inventoryConsumed: true`).

### Flow B: Payment Failure Flow
1. Repeat checkout, but in the Razorpay Modal select **Failure** or simulate a bank decline.
2. Observe:
   - Client displays failure message with retry option.
   - Razorpay sends `payment.failed` event to your zrok URL.
   - The backend records failure reason and safely releases temporarily reserved inventory back to the catalog.

### Flow C: Duplicate Delivery (Idempotency Test)
1. If Razorpay sends the same webhook event ID twice:
2. The second event is caught by the `WebhookEvent` model deduplication check:
   ```
   [Razorpay Webhook] Deduplication hit: Event evt_... already processed.
   ```
   The endpoint responds with HTTP 200 `{ success: true, message: "Webhook event already processed" }` without running double logic or deducting stock twice.

### Flow D: Staged Refund Testing
1. For an already captured order, trigger a refund via `POST /api/payments/refund` with `{ orderId, amount, reason }`.
2. Order transitions to `paymentStatus: "REFUND_REQUESTED"`.
3. When Razorpay webhook sends `refund.processed`:
4. The webhook updates order to `paymentStatus: "REFUNDED"` (or `"PARTIALLY_REFUNDED"`) and records `refundCompletedAt`.

---

## 8. Quick Local Webhook Simulation Script

We have also provided a standalone simulator script that can trigger authentic, cryptographically signed test webhooks directly to your local endpoint without needing an active browser session:

```powershell
# Simulate payment.captured
node scratch/simulate-razorpay-webhook.mjs http://localhost:3000/api/webhooks/razorpay payment.captured

# Simulate payment.failed
node scratch/simulate-razorpay-webhook.mjs http://localhost:3000/api/webhooks/razorpay payment.failed

# Simulate refund.processed
node scratch/simulate-razorpay-webhook.mjs http://localhost:3000/api/webhooks/razorpay refund.processed
```

You can also pass your public zrok URL to verify public internet ingress:
```powershell
node scratch/simulate-razorpay-webhook.mjs https://<generated-zrok-url>/api/webhooks/razorpay payment.captured
```

---

## 9. Troubleshooting & FAQ

| Issue | Cause | Solution |
|---|---|---|
| `Invalid webhook signature` (400) | `RAZORPAY_WEBHOOK_SECRET` in `.env.local` does not match the secret in Razorpay Dashboard. | Ensure the exact same secret string is set in both places. Restart `npm run dev` if you edited `.env.local`. |
| `Missing x-razorpay-signature header` (400) | Request did not originate from Razorpay or custom proxy stripped headers. | Ensure your reverse proxy / tunnel forwards all `x-*` headers. |
| `Webhook URL unreachable` in Razorpay | `zrok` tunnel is stopped, or port 3000 is not running. | Check Terminal 2 to ensure `zrok share public 3000` is active and Next.js is responding on port 3000. |
| `Order not found for payment confirmation` | The order was created in another database or with a different test account. | Verify MongoDB is connected to `mongodb://127.0.0.1:27017/KISANOVA`. |
| Downgrade protection message | `payment.failed` arrived after order was already `CONFIRMED`. | Expected behavior: Authoritative downgrade protection ensures legitimate captured orders are not corrupted by out-of-order webhooks. |

---

## 10. Security Checklist

- [x] `.env.local` is added to `.gitignore` and never committed.
- [x] Webhook signature verified using `crypto.timingSafeEqual` to prevent timing attacks.
- [x] Raw request body (`req.text()`) preserved for byte-for-byte HMAC SHA256 verification.
- [x] Webhook secrets are never exposed to client-side code or browser bundles.
- [x] Webhook events deduplicated via `WebhookEvent` database collection.
- [x] Order status transitions enforce Finite State Machine rules.
