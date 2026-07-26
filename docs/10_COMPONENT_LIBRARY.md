# 10: Component Library Document
**Project:** Service Finder App

This acts as the blueprint for reusable React Native components (`/components`).

---

## 1. Core Atoms
- **`PrimaryButton`**: Deep Navy background, White Text, 56px height, 12px radius. Handles `isLoading` state (shows ActivityIndicator).
- **`OutlineButton`**: Transparent background, Deep Navy border, Deep Navy text. Used for secondary actions (e.g., Cancel).
- **`InputField`**: Standard text input. 48px height, Slate 50 background, subtle border on focus. Supports left/right icons (e.g., eye icon for passwords).
- **`Badge`**: Small pill-shaped indicator. Colors match Semantic tokens (Success=Green, Pending=Amber).

## 2. Molecules
- **`CompanyCard`**: Displays Company Image, Name, Rating, and a list of top 3 services. Used in `(customer)/home.tsx` horizontal scrolls.
- **`BookingRow`**: Displays Job Title, Date, Time, and Status Badge. Tapping routes to the booking detail page. Used heavily in Company and Staff dashboards.
- **`StatusTimeline`**: Vertical list of dots with connecting lines. Active step is Blue, completed is Green, upcoming is Gray. Used in `booking/[id].tsx`.
- **`ChatBubble`**: Renders message text. Blue background for self, Gray background for other. Parses URLs and renders images if present.

## 3. Organisms (Complex Components)
- **`AddressPickerModal`**: Bottom sheet containing a Google Places Autocomplete input. Returns standard `{ lat, lng, text }` object.
- **`PaymentSummaryCard`**: Displays Subtotal, Tax, Platform Fee, and Total. Includes a "Powered by Stripe" footer.
- **`StaffMapTracker`**: Renders a `react-native-maps` instance plotting the Staff's live lat/lng, the Customer's lat/lng destination, and a polyline route between them.
