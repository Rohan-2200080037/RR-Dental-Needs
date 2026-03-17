# RR Dental Needs - Advanced E-commerce Platform

A professional full-stack e-commerce application for dental instruments, built with Node.js, React, PostgreSQL, and modern UI/UX principles.

## 🚀 Advanced Features

### 📦 Order & Inventory Management
- **Full Order Lifecycle:** Track orders from 'Pending' to 'Delivered' with status timelines.
- **Stock Validation:** Real-time inventory checks during checkout.
- **Low Stock Alerts:** Automatic triggers for products falling below specific thresholds.
- **Order History:** Detailed views for users and sellers to manage their transactions.

### 💳 Payment Integration
- **Razorpay Integration:** Secure online payment gateway for cards, UPI, and net banking.
- **Cash on Delivery (COD):** Alternative payment method for user convenience.
- **Post-Payment Verification:** Orders are only created in the database after successful payment confirmation.

### 📊 Admin & Seller Dashboards
- **Sales Analytics:** Visual data representation using Recharts (Bar charts/Sales distribution).
- **Revenue Tracking:** Real-time platform revenue and product performance metrics.
- **Seller Management:** Profile approval flow for new dental instrument vendors.
- **Inventory Control:** Sellers can manage products, descriptions, and stock levels.

### 🔔 Smart Notification System
- **Real-time Alerts:** In-app notifications for order updates, account status, and more.
- **Notification Dropdown:** Accessible bell icon in the navbar with read/unread status.

### 🔍 Search & Discovery
- **Smart Search:** Global search functionality with filters (Price range, Category).
- **Product Recommendations:** "You May Also Like" section based on category matching.
- **Category Navigation:** Intuitive browsing for 1st to 4th-year dental instruments.

### 🛡️ Security & Performance
- **Image Hosting:** Cloudinary integration for optimized image storage and delivery.
- **Rate Limiting:** Protection against API abuse with `express-rate-limit`.
- **Security Headers:** Enhanced protection using `helmet`.
- **Structured Logging:** Backend activity monitoring with Winston.
- **Verified Reviews:** Only customers who bought and received a product can leave a review.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Zustand, Recharts.
- **Backend:** Node.js, Express.js, PostgreSQL.
- **Payments:** Razorpay SDK.
- **Storage:** Cloudinary API.
- **Email:** Nodemailer with SMTP integration.

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL Database
- Razorpay / Cloudinary API Keys

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend` folder with:
   - `DATABASE_URL`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

4. Start the application:
   ```bash
   # Backend
   npm start
   
   # Frontend
   npm run dev
   ```

## 📝 License
This project is for professional use in the dental instruments retail industry.
