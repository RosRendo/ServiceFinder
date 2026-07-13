# Monolith to Microservices: A Complete Learning Guide

This guide documents the complete journey of transitioning the `Service_Finder` backend from a single monolithic NestJS application to a modern, scalable Microservices architecture using Docker, Nginx, and PostgreSQL.

---

## 1. Why Microservices?

In the original `backend-nest` folder, all modules (Auth, Users, Companies, Bookings, Payments, Reviews) lived together in one application and shared a single database. 

**Problems with the Monolith:**
- **Scaling:** If the `booking` feature gets heavy traffic, you have to scale the entire application, wasting resources.
- **Single Point of Failure:** If the `payment` module crashes due to a bug, the entire API goes down (Auth, Bookings, everything).
- **Database Coupling:** Any module could read/write to any table. E.g., `BookingsService` directly modified `CompanyStaff` tables. This makes code hard to maintain.

**The Microservices Solution:**
We split the monolith into **6 independent mini-applications**:
1. `auth-service` (Port 3001)
2. `payment-service` (Port 3002)
3. `booking-service` (Port 3003)
4. `company-service` (Port 3004)
5. `notification-service` (Port 3005)
6. `review-service` (Port 3006)

Each service has its **own `package.json`**, its **own `Dockerfile`**, and its **own Prisma Schema / Database**.

---

## 2. Architectural Changes We Made

### A. The API Gateway (Nginx)
In a microservices architecture, the frontend shouldn't need to know the port of every single service. It should just send requests to `localhost:8000/api/...`

We created an Nginx Reverse Proxy (`nginx.conf`) that acts as a traffic cop.
- If a request goes to `/api/auth/v1/login`, Nginx routes it to `auth-service:3001`.
- If a request goes to `/api/bookings/v1/...`, Nginx routes it to `booking-service:3003`.

### B. Database Migration (MySQL → PostgreSQL)
Microservices work best with powerful relational databases. We migrated from MySQL to PostgreSQL. More importantly, we implemented **Database per Service**. 
- `auth-service` only has the `User` table in its `schema.prisma`.
- `company-service` only has `Company`, `Category`, `ServiceType`, and `Service` tables.
- This prevents "database spaghetti" where one service accidentally corrupts another service's data.

### C. Containerization (Docker Compose)
We created a `docker-compose.yml` file to orchestrate the entire environment locally. With one command (`docker-compose up -d`), you spin up:
- 6 NestJS microservices
- 6 PostgreSQL databases
- 1 Nginx API Gateway

### D. Multi-Stage Dockerfiles
We optimized the deployment by using **Multi-stage Dockerfiles**.
- **Stage 1 (Builder):** Installs all dependencies, generates the Prisma client, and compiles TypeScript into JavaScript.
- **Stage 2 (Production):** Only copies the compiled JS code and production dependencies, resulting in a very lightweight and secure container image.

---

## 3. The Current State: The bounded Context Problem

We successfully copied the business logic (`controllers`, `services`, `modules`) from the monolith into the respective microservices. However, if you run `npx tsc` (TypeScript compile) inside `booking-service` or `company-service`, you will see errors. 

**Why? (The Bounded Context Rule)**
In the monolith, `BookingsService` did this:
```typescript
// Old Monolith Code
const user = await this.prisma.user.findUnique({ where: { id: userId } });
const company = await this.prisma.company.findUnique({ where: { id: companyId } });
```
This fails in `booking-service` because **the `booking-service` Prisma schema does not have `User` or `Company` tables!** It only knows about `Booking`.

### How to Fix Inter-Service Communication (Your Next Steps)

To fix the TypeScript errors and make the microservices talk to each other, you must implement **Inter-Service Communication**.

**1. Synchronous Communication (HTTP / REST)**
If `booking-service` needs user details, it should make an HTTP request to `auth-service`:
```typescript
// Inside booking-service
import { HttpService } from '@nestjs/axios';

const response = await this.httpService.get(`http://auth-service:3001/api/auth/v1/users/${userId}`).toPromise();
const user = response.data;
```

**2. Asynchronous Communication (Event Emitters / RabbitMQ / Kafka)**
If a booking is created and you want to send an email, `booking-service` should NOT import `MailService`. Instead, it emits an event:
```typescript
// Inside booking-service
this.client.emit('booking_created', { bookingId, customerEmail });

// Inside notification-service
@EventPattern('booking_created')
handleBookingCreated(data: any) {
  this.mailService.sendBookingConfirmation(data.customerEmail);
}
```

**3. Shared Libraries for Auth Guards**
All services currently throw errors because they can't find `JwtAuthGuard`. 
In microservices, you usually create a shared internal NPM package (e.g., `@servicefinder/common`) that contains your JWT validation logic, so you don't have to copy/paste `jwt-auth.guard.ts` into all 6 microservices. Alternatively, Nginx or an API Gateway like Kong can handle JWT validation before the request even reaches the microservice.

---

## 4. Kubernetes Readiness

Inside the `kubernetes/` folder, we scaffolded production-ready manifests:
- **Deployments:** Rules for how many copies (pods) of each service should run.
- **Services:** Internal networking so `booking-service` can talk to the database.
- **HPA (Horizontal Pod Autoscalers):** Automatically spins up more pods if CPU usage goes over 70%.
- **Ingress:** The production version of Nginx, configured with HTTPS (Cert-Manager).

## Summary of Commands to Remember

- **Start everything:** `docker-compose up -d`
- **Rebuild after code changes:** `docker-compose up -d --build`
- **View logs for one service:** `docker-compose logs -f auth-service`
- **Stop everything:** `docker-compose down`

**Welcome to Microservices!** You have successfully completed the architectural scaffolding. The journey ahead involves refactoring your business logic to use HTTP/Message Brokers instead of direct Prisma calls.
