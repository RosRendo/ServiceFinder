import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ServiceFinder",
  description: "Read the ServiceFinder Terms of Service governing your use of the platform.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using ServiceFinder ("Platform", "we", "us"), you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, please stop using the Platform immediately. These terms apply to all visitors, customers, company accounts, and staff members.`,
  },
  {
    title: "2. Nature of Service — Marketplace Connector",
    body: `ServiceFinder is a technology marketplace that connects customers seeking home and commercial services with independent service provider companies. We are NOT the employer of any staff or technician. We do not directly provide cleaning, plumbing, electrical, or any other services. All service providers are independent businesses or sole traders. ServiceFinder bears no liability for the quality, safety, or legality of any services performed by providers found on this Platform.`,
  },
  {
    title: "3. User Accounts",
    body: `You must register and maintain accurate account information. You are responsible for all activity that occurs under your account. Do not share your login credentials. Accounts may be suspended or terminated for violations of these terms.`,
  },
  {
    title: "4. Bookings and Payments",
    body: `All bookings made through the Platform are between the customer and the service provider. ServiceFinder acts solely as a payment facilitator. Payments are processed securely via our partners. By making a payment, you authorize ServiceFinder to charge your selected payment method. All prices are displayed before confirmation.`,
  },
  {
    title: "5. Cancellations and Refunds",
    body: `Cancellations made more than 24 hours before the scheduled service are eligible for a full refund. Cancellations made within 24 hours may be subject to a cancellation fee of up to 30%. No-shows by the customer are non-refundable. No-shows by the provider entitle the customer to a full refund. Refund processing may take 5–10 business days depending on your bank.`,
  },
  {
    title: "6. Disputes and Liability",
    body: `ServiceFinder provides a dispute mediation channel but makes no guarantee of outcome. In the event of property damage during a service, the service provider company is solely responsible. ServiceFinder's maximum liability to any user in connection with any claim arising out of use of the Platform shall not exceed the amount of the transaction in dispute. We are not liable for indirect, incidental, or consequential damages.`,
  },
  {
    title: "7. Intellectual Property",
    body: `All content on the Platform — including logos, design, text, and software — is the property of ServiceFinder and protected by copyright law. You may not copy, reproduce, modify, or distribute any part of the Platform without prior written consent.`,
  },
  {
    title: "8. Prohibited Conduct",
    body: `You agree not to: (a) use the Platform for any unlawful purpose; (b) post false or misleading reviews; (c) attempt to circumvent the Platform's payment system to pay providers directly and avoid Platform fees; (d) harass, threaten, or abuse other users or staff; (e) scrape, crawl, or data-mine the Platform without authorization.`,
  },
  {
    title: "9. Modifications to Terms",
    body: `ServiceFinder reserves the right to update these Terms at any time. Continued use of the Platform following notice of changes constitutes your acceptance of the revised Terms. We will notify registered users via email for material changes.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Cambodia. Any disputes shall be resolved in the competent courts of Phnom Penh, Cambodia.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-slate-300 text-lg">
            Last updated: April 14, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-12">
            Please read these Terms of Service carefully before using the ServiceFinder platform.
            By using our services, you confirm that you have read, understood, and agree to be
            bound by these terms.
          </p>

          <div className="space-y-10">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h2>
                <p className="text-slate-600 leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>

          {/* Contact box */}
          <div className="mt-16 rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Questions about these Terms?</h3>
            <p className="text-slate-500 text-sm mb-4">
              Contact our legal team at{" "}
              <a href="mailto:legal@servicefinder.app" className="text-blue-600 underline">
                legal@servicefinder.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
