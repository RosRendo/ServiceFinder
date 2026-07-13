# Frontend Structure Analysis & Missing Pages

## Summary
I've analyzed your backend routes against the frontend structure and identified missing pages. I've created the necessary folder structure. Below is a comprehensive breakdown:

---

## ✅ Folders Created/Verified

### Customer (`/app/customer`)
- ✅ `/customer/messages/[id]` - Individual message conversation

### Staff (`/app/staff`)
- ✅ `/staff/services` - View pending service requests (needs page.tsx)
- ✅ `/staff/messages/[id]` - Individual message conversation

### Company (`/app/company`)
- ✅ `/company/services/[id]` - Edit existing service
- ✅ `/company/services/new` - Create new service
- ✅ `/company/staff/[id]` - View/edit staff member (needs page.tsx)
- ✅ `/company/staff/new` - Add new staff member
- ✅ `/company/messages/[id]` - Individual message conversation

### Admin (`/app/admin`)
- ✅ `/admin/users/[id]` - Edit user details
- ✅ `/admin/companies/[id]` - Edit company details
- ✅ `/admin/service-types` - Manage service types (needs page.tsx)

---

## 📋 Sidebar Updates Needed

### **CustomerSidebar** ✅ (Already Complete)
Current navigation items are sufficient:
- Dashboard
- Find Services  
- My Bookings
- Payments
- My Reviews
- Profile

**Optional Addition:**
- Messages (if you want direct access to messages list)

### **StaffSidebar** ⚠️ (Needs Update)
**Missing:** Service Requests (Pending Services)

**Current:**
- Dashboard
- My Schedule
- Active Jobs
- Availability
- Profile

**Recommended Addition:**
```tsx
{ href: '/staff/services', icon: ClipboardCheck, label: 'Service Requests' },
// Add between "Active Jobs" and "Availability"
```

### **CompanySidebar** ✅ (Already Complete)
Current navigation covers all major features:
- Dashboard
- Services (with /new and /[id]/edit as sub-routes)
- Bookings
- Staff (with /new and /[id] as sub-routes)
- Reviews
- Payments
- Service Areas
- Settings

### **AdminSidebar** ⚠️ (Needs Update)
**Missing:** Service Types Management

**Current:**
- Dashboard
- Users
- Companies
- Categories
- Analytics
- Verification
- Settings

**Recommended Addition:**
```tsx
{ href: '/admin/service-types', icon: Layers, label: 'Service Types' },
// Add after "Categories"
```

---

## 🔧 Pages That Need Implementation

These directories exist but need `page.tsx` files:

1. **`/app/staff/services/page.tsx`**
   - Purpose: View and manage pending service requests
   - Backend Route: `GET /api/staff/services/pending`
   - Actions: Approve/Reject service requests

2. **`/app/admin/service-types/page.tsx`**
   - Purpose: CRUD operations for service types
   - Backend Routes:
     - `GET /api/service-types`
     - `POST /api/service-types`
     - `PUT /api/service-types/:id`
     - `DELETE /api/service-types/:id`

3. **`/app/company/staff/[id]/page.tsx`** (if missing)
   - Purpose: View/edit individual staff member
   - Backend Routes:
     - `GET /api/companies/staff/:id`
     - `PUT /api/companies/staff/:id`
     - `DELETE /api/companies/staff/:id`

---

## 🎯 Action Items

### Immediate:
1. ✅ Create missing folders (DONE)
2. ⚠️ Update StaffSidebar - Add "Service Requests" link
3. ⚠️ Update AdminSidebar - Add "Service Types" link
4. ⚠️ Create `/app/staff/services/page.tsx`
5. ⚠️ Create `/app/admin/service-types/page.tsx`

### Optional:
- Add "Messages" to all sidebars for quick access
- Create message detail pages in the [id] subfolders
- Implement real-time messaging features

---

## 📊 Backend Routes Coverage

### ✅ Fully Covered
- Authentication (`/api/auth`)
- Bookings (`/api/bookings`)
- Payments (`/api/payments`)
- Reviews (`/api/reviews`)
- Categories (`/api/categories`)

### ⚠️ Partially Covered
- **Staff Routes** - Missing "Pending Services" UI
- **Service Types** - Missing admin management UI
- **Messages/Conversations** - Has backend, minimal frontend

### ℹ️ Notes
- Most CRUD operations have list views but could benefit from dedicated edit/create pages
- Consider adding breadcrumbs for nested routes (e.g., Services → Edit Service)
- Some pages exist but might need enhancement based on backend capabilities
