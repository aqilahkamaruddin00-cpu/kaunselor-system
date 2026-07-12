# TVET MARA Besut Counselor Appointment Website

A modern, highly polished, and fully responsive Single Page Application (SPA) designed for students of TVET MARA Besut (such as IKM Besut) to schedule consultation appointments with campus counselors. It includes a student reservation portal and an administrative dashboard for counselors.

## Features

1. **Student Booking Portal**:
   - **Interactive Calendar**: Dynamically renders available appointment dates, automatically highlighting today.
   - **Local Customization**: Campus operating hours and local Terengganu weekends (**Friday & Saturday**) are disabled automatically.
   - **Dynamic Slots**: Renders morning/afternoon consultation slots. Slots already reserved are dynamically disabled.
   - **Reservation Form**: Gathers student details (Name, ID, Program, Semester, Phone Number, Consultation Type, and Reason).
   - **Confirmation Receipt**: Generates a professional booking receipt with a unique ticket reference code. Supports direct ticket printing.

2. **Counselor Admin Portal**:
   - **Secure Access**: Protected with client-side password authentication (Password: `mara123`).
   - **Live Statistics**: Displays real-time updates for Total Bookings, Pending Reviews, and Approved Appointments.
   - **Review System**: Counselors can review student forms and approve, reject/cancel, or reschedule bookings.
   - **Filtering**: Easily filter reservations by status and counselor assignment.

3. **Premium Visual Design**:
   - Glassmorphism UI containers and soft background gradient blobs.
   - Light & Dark mode support with persistent state.
   - Fully fluid responsive layouts (optimized for mobile, tablet, and desktop viewports).
   - Smooth hover micro-interactions, spring animations, and card transitions.

4. **Persistence**:
   - Uses browser `localStorage` to save all state, updates, and bookings, enabling full functionality across browser refreshes without requiring external database setups.
   - Pre-populated with realistic student appointment demo data.

## Getting Started

Since the application is built entirely using vanilla web technologies (HTML5, CSS3, and ES6 JavaScript), there is no installation or local server environment required.

### How to Run

1. Open the project folder `KAUNSELOR`.
2. Double-click the `index.html` file to launch it directly in your web browser, or serve it using any simple local server extension (e.g. Live Server in VS Code).

### Administrator Credentials

To access the Counselor Dashboard:
1. Click the **Counselor Portal** button in the navigation header.
2. Enter the password: `mara123`.
3. In this mode, you can inspect student requests, approve/decline appointments, and filter bookings.

## Where To Edit

- `index.html` - page content and section order.
- `style.css` - main stylesheet loader. It imports the smaller files inside `css/`.
- `css/base.css` - colors, theme variables, reset, and background.
- `css/layout.css` - header, navigation, section layout, and buttons.
- `css/home.css` - home hero area and service cards.
- `css/counselors.css` - counselor profile cards.
- `css/booking.css` - calendar, time slots, booking form, and form highlight.
- `css/resources.css` - FAQ and resource cards.
- `css/dashboard.css` - counselor portal dashboard, table, modals, and status buttons.
- `css/footer.css` - footer design.
- `css/responsive.css` - mobile and desktop responsive rules.
- `css/counselor-management.css` - add/delete counselor profile panel.
- `css/print.css` - print view for booking receipt.
- `app.js` - startup file that initializes the app.
- `js/data.js` - app state, BM/EN text, counselor names/photos, and demo bookings.
- `js/theme.js` - light/dark mode.
- `js/i18n.js` - BM/EN language switching.
- `js/navigation.js` - mobile menu and FAQ accordion.
- `js/counselors.js` - counselor cards, dropdowns, add/delete counselor profiles.
- `js/booking.js` - calendar, slot selection, service shortcuts, and student booking form.
- `js/home.js` - homepage interactions, rotating quotes, live hero availability, service modal, scrollspy, and back-to-top button.
- `js/availability.js` - counselor unavailable dates and minimum notice before students can book.
- `js/portal.js` - counselor portal login and view switching.
- `js/dashboard.js` - appointment table, filters, approve/cancel/reschedule actions.
