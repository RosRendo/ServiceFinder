# 13: Security Document
**Project:** Service Finder App

This document outlines the security, compliance, and fraud prevention measures.

---

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens):** Used for stateless authentication. Tokens expire every 15 minutes.
- **Refresh Tokens:** Stored in secure, HttpOnly cookies (on Web) or SecureStore (on Mobile) to silently request new JWTs.
- **Role-Based Access Control (RBAC):** Backend route guards (`@Roles('ADMIN')`) strictly enforce the permissions outlined in `08_PERMISSIONS.md`.

## 2. Financial Security (Stripe)
- **PCI Compliance:** The app never touches raw credit card data. All card inputs use Stripe Elements/Stripe SDK.
- **3D Secure:** Enforced for European cards (SCA compliance) and high-risk transactions.
- **Payout Holds:** Company payouts are held in a Stripe Connect Custom account until T+2 days after job completion to ensure funds are available if a dispute arises.

## 3. Data Privacy
- **Phone Number Masking:** Customers and Staff do not see each other's real phone numbers. Communication is routed through in-app chat or a VoIP proxy.
- **Exact Location Privacy:** A Staff member's exact GPS location is only broadcasted to the Customer *after* the status changes to "En Route" and stops immediately after "Arrived".

## 4. Fraud Detection
- **Fake Review Prevention:** Reviews can *only* be left on Bookings with a status of "Completed". It is impossible to leave a review on an arbitrary company profile.
- **Velocity Limits:** Rate limiting (e.g., max 5 OTP requests per hour per IP) is enforced at the API Gateway (Nginx/Cloudflare) to prevent SMS bombing.
- **Identity Verification:** Companies must upload a business license/ID during registration. Admins manually review these PDFs before status changes to `VERIFIED`.
