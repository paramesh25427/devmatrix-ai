// Sample reports and mock fixtures for DevMatrix AI

export const CITYCARE_SAMPLE_TEXT = `CityCare Hospitals — Doctor Appointment Booking & Teleconsultation Platform
Client: CityCare Hospitals Private Limited
Target Go-Live: 14 Weeks
Budget Envelope: ₹6,00,000 to ₹12,00,000 INR

Project Overview:
CityCare Hospitals operates a chain of multi-speciality tertiary care centers across 5 cities. The client requires a modern, patient-centric web and mobile platform for managing in-clinic doctor appointments and online video consultations.

Detailed Requirements:
1. Patient Registration & Authentication:
   - Registration via phone number with SMS OTP verification and email validation.
   - Profile management with family member profiles linked under a single primary account.
2. Doctor Search & Directory:
   - Search doctor by clinical speciality, hospital branch, consultation fee, and geolocation.
   - Comprehensive doctor profiles including qualification, years of experience, and languages spoken.
3. Real-Time Slot Availability & Booking:
   - Real-time doctor calendar slot availability engine with live synchronization.
   - Dynamic 10-minute slot reservation lock during checkout to prevent double-booking.
4. Booking Lifecycle & Cancellation:
   - Seamless appointment booking, rescheduling, and instant patient cancellation.
   - Automated refund calculation based on hospital cancellation policy window.
5. Online Payment Gateway Integration:
   - Integration with Indian payment gateways (Razorpay/PayU) supporting UPI, Debit/Credit Cards, and Netbanking.
   - Automated payment capture, receipt generation, and webhook failure handling.
6. Automated Notifications:
   - Instant transactional SMS and email notifications upon booking, cancellation, and reminders 2 hours prior to consultation.
7. Doctor Consultation Portal:
   - Dedicated portal for doctors to view daily schedule, block emergency leaves, and review patient visit history.
8. Hospital Administration & Analytics Dashboard:
   - Multi-branch administration console with doctor occupancy rates, no-show trends, and revenue reconciliation reports.
9. Non-Functional Performance:
   - High-throughput architecture supporting peak load of 2,000 daily bookings without latency spikes.
10. Patient Health Data Security:
    - Compliance with Indian Digital Personal Data Protection (DPDP) Act and HIPAA standards with AES-256 data encryption at rest and in transit.`;

export const RETAIL_SAMPLE_TEXT = `Retail Store Omnichannel POS & Online Shop
Client: QuickBazaar Stores
Target Go-Live: Flexible / Not specified
Budget Envelope: Unspecified

Project Requirements:
We want a modern retail website that allows our neighborhood retail shop to sell goods online.
The application should also work offline inside the store during internet disconnects so the billing counter does not freeze.
It should be fast, modern, and comparable to top competitors like Blinkit and Zepto.
We need easy payments like card swipe and UPI.
Inventory should be shared between in-store sales and online orders so we don't oversell items.
The checkout should be very quick for walk-in customers.
We need recommendations on what technology to use and how many weeks it will take.`;

export const MOCK_PROJECTS = [
  {
    id: "PRJ-101",
    title: "CityCare Hospitals Appointment Suite",
    client: "CityCare Hospitals",
    status: "analyzed",
    verdict: "feasible",
    effort_min_weeks: 9,
    effort_max_weeks: 12,
    cost_min: 517500.0,
    cost_max: 675000.0,
    deadline_weeks: 14,
    budget_min: 600000.0,
    budget_max: 1200000.0,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: "PRJ-102",
    title: "QuickBazaar Hybrid Offline POS",
    client: "QuickBazaar Stores",
    status: "submitted",
    deadline_weeks: 8,
    budget_min: 300000.0,
    budget_max: 500000.0,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];
