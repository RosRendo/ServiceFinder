# Service Finder API Documentation Guide

Welcome to the Service Finder API! This backend is built using Nest.js and provides comprehensive RESTful endpoints for the Service Finder platform.

## Interactive Swagger Documentation

The API includes built-in interactive documentation via Swagger (OpenAPI 3.0).

**URL:** `http://localhost:5000/api/docs` *(or your production domain + `/api/docs`)*

### Features of the Swagger UI:
1. **Endpoint Discovery:** Browse all available controllers and their endpoints categorized by tags (e.g., Auth, Users, Companies, Bookings, Payments).
2. **Request Schemas:** View the required payloads (DTOs) and query parameters for each endpoint.
3. **Response Schemas:** See expected success and error responses.
4. **Interactive Testing:** Use the "Try it out" button to execute real requests against the API directly from your browser.

## Authentication

Most endpoints require a valid JWT token. 

### How to authenticate in Swagger:
1. Register or login using the `/auth/login` or `/auth/register` endpoints.
2. In the response, copy the `token` string.
3. Click the green **Authorize** button at the top of the Swagger UI.
4. Paste the token into the input field (you do not need to type "Bearer ", just the token string).
5. Click **Authorize** and then **Close**. 
6. Endpoints decorated with a padlock icon are now unlocked and will automatically include your token in the `Authorization: Bearer <token>` header.

## Core Modules

- **Auth:** Registration, login, password reset, and Google OAuth.
- **Users:** User management, role assignment, and status updates.
- **Companies:** Vendor profiles, verification status, and company management.
- **Services & Service Types:** Hierarchical catalog mapping Categories -> Service Types -> Services.
- **Bookings:** Core transaction engine with state machine (`pending` -> `confirmed` -> `in_progress` -> `completed`).
- **Payments:** Payment processing integrating Stripe (with raw-body webhooks), PayPal, and Cash/Wallet tracking.
- **Reviews:** User feedback tied to companies and specific service staff.
- **Saved Items:** Wishlist functionality for bookmarking companies and services.

## Decorators Reference for Developers

When adding new endpoints, ensure you maintain the documentation standard by applying the appropriate decorators from `@nestjs/swagger`:

```typescript
@ApiTags('ModuleName') // On the Controller class

@ApiOperation({ summary: 'What this endpoint does' }) // On the route handler
@ApiResponse({ status: 200, description: 'Success condition' })
@ApiResponse({ status: 400, description: 'Failure condition' })
@ApiBearerAuth() // If the route uses @UseGuards(JwtAuthGuard)
```

## Upcoming Enhancements
- DTO validation schemas will automatically populate Swagger models in Phase 3.
- Advanced response formatting and error handling schemas will be documented in Phase 4.
