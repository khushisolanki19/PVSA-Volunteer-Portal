# PVSA Volunteer Portal

A free, open-source volunteer portal for JCNC and other community service programs. It supports volunteer project discovery, first-come-first-served signup, waitlists, attendance, hour validation, family-linked dashboards, and PVSA progress tracking.

## Current prototype

- Youth, Adult/Parent, Lead, and Coordinator experiences
- Password-protected coordinator area
- Project signup, cancellation, slot counts, and waitlist promotion
- Lead attendance with lateness and Parent/Lead notes
- Coordinator hour validation and credit adjustment
- Project creation, member directory, and CSV reporting
- Responsive mobile and desktop design

## Run locally

Open `index.html` in a browser, or serve this directory with any static web server.

## Coordinator demo access

Select the Coordinator profile and enter the configured demo password. Before production use, coordinator authentication must be moved from the browser code to the server and Google Sign-In.

## Data integration

The prototype retains the existing Google Apps Script connection for Google Sheets. The project, signup, attendance, and validation actions currently use in-memory demo data until matching Apps Script endpoints are added.

## License

Open-source licensing will be finalized by the project coordinators.
