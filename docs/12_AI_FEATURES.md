# 12: AI Features Document
**Project:** Service Finder App

This document maps out the specific AI integrations that enhance the user and staff experience.

---

## 1. Staff AI Assistants (`(staff)/ai/ai.tsx`)
**Goal:** Empower service providers to generate accurate estimates and record keeping.

### A. AI Job Estimator
- **UX Flow:** Staff points camera at a problem area (e.g., a broken pipe or a messy room) → Takes photo → Sends to OpenAI Vision API → Receives a generated breakdown of suggested materials and estimated time to complete.
- **Business Value:** Standardizes quotes and prevents under-bidding.

### B. AI Digital Measurement (`measurement/index.tsx`)
- **UX Flow:** Utilizes ARKit / ARCore (via Expo modules) to allow staff to drop pins on the camera view to measure dimensions (Length x Width) of a physical space, which is automatically saved to the Job Record.

## 2. Customer AI Recommendations
**Goal:** Increase conversion by helping customers find what they need.

### A. Semantic Search
- **UX Flow:** Instead of exact keyword matching, the Customer search bar uses embeddings to understand intent. 
  - *Example:* User searches "my sink is leaking" → AI maps this intent to the "Plumbing" category and suggests specific "Pipe Repair" services nearby.

## 3. Admin AI Moderation
**Goal:** Reduce manual workload for platform operators.

### A. Auto-Review Moderation
- **System Flow:** Every time a Customer submits a Review, the text is passed through an AI toxicity filter. If flagged for profanity or hate speech, the review is hidden and routed to an Admin manual review queue.

### B. Fraud Flagging
- **System Flow:** An AI anomaly detection model analyzes booking patterns. If a Company suddenly receives 50 high-value bookings from the same IP address in one hour, the AI auto-suspends the payouts and flags the account for Admin review.
