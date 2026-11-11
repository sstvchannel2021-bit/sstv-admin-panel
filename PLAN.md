# SS TV Admin — Backend Implementation Plan

Goal: turn the demo admin panel (data saved only in the browser) into a real, shared, secure system on **Supabase**, run and tested **locally** until the final go-live on **Cloudflare**.

How we work:
- One stage at a time. After each stage I stop and you QA it with the checklist for that stage.
- I only run `npm run build` myself after each stage (to be sure it compiles). Anything more, I ask first.
- SQL is delivered as numbered files in `supabase/` — you paste each one into the Supabase **SQL Editor** and run it.
- The friend's page designs stay as they are. I change the data layer underneath and only add UI where a feature needs it, in the same style.

---

## Owner decisions (made on the client's behalf, can be changed later)

| Topic | Decision |
|---|---|
| Ad tracking | Booking record + its air times for every day it runs. A **daily ad sheet** lists every ad slot for a date, sorted by time, printable for the on-air operator. No proof of airing for now (can add a "mark aired" tick later). |
| Login | **Username + password** (no SMS/OTP, costs money). The owner creates staff accounts and sets a temporary password; staff can change it. Deactivated staff are locked out immediately. |
| Work hours | Start / finish use **server time**, not the phone's clock, so it can't be faked. One shift per person per day. |
| Late rule | Owner sets office start time (default **09:30**) and grace (default **15 min**). Later than that = **Late**. |
| Unfinished shifts | At midnight any open shift is closed and marked **Did not finish**. |
| Monthly summary | Per staff: days worked, late days, total hours, unfinished days. |
| Activity history | Every create / edit / delete is recorded: who, what, when, before and after. Owner-only page. |
| Deleting | Nothing is truly deleted. Deleted items are **hidden** and the owner can see and restore them. Payments can't be deleted, only **voided with a reason**. |
| Logbook | Staff can edit or delete their own entries only on the same day. After that they're locked. |
| Old records | Start from zero. Real packages/prices from the demo are kept, all sample clients, bookings, staff etc. are removed. |
| Location / office-network lock | Not now. Possible later. |

---

## Stage 0 — Project setup
- Make `D:\sstv-website-main` its own git repo (today it's inside a repo covering the whole D: drive), connect it to `github.com/sstvchannel2021-bit/sstv-admin-panel`.
- Add `@supabase/supabase-js`, a `.env` (gitignored) with the Supabase URL + anon key, and `.env.example`.
- Supabase client file `admin/src/supabase.js`.
- **Before the first push I'll ask you.**

**You check:** `npm run dev` in `admin/` still opens the demo as before.

## Stage 1 — Database
SQL files: tables, permission rules (RLS), helper functions.
- Tables: `profiles` (staff), `packages`, `clients`, `bookings`, `payments`, `expenses`, `programs` (timetable), `attendance`, `logins`, `logbook`, `notifications`, `notification_reads`, `activity_log`, `settings`.
- Permission functions `can_view(module)` / `can_manage(module)` — the owner always manages everything; staff get exactly what the owner set (None / View / Manage) per area. **The database itself refuses** data a person isn't allowed to see, not just the screen.
- Rules in the database: no overpaying a booking, no overlapping programs, payment totals, soft delete columns, activity log triggers.
- Seed: the 10 real packages.

**You check:** run the SQL files in order, no errors; tables appear in Table Editor.

## Stage 2 — Login and staff accounts
- Login page: username + password (demo account list removed).
- One-time owner setup: you create the owner in Supabase Auth, run one SQL line to make them owner (steps given).
- Edge Function `staff-admin` (owner only): create staff, reset password, deactivate/reactivate. Pasted into the Supabase dashboard (steps given).
- Staff page: password fields; "Change my password" for everyone.
- Each login is recorded with device and time; logout closes it.
- Remove "Reset demo data" button and "Demo with sample data" badge.

**You check:** log in as owner → add a staff with limited access → log in as that staff in a private window → they only see their pages; deactivate them → they're thrown out.

## Stage 3 — Clients, packages, bookings, payments, expenses
- `store.jsx` reads/writes Supabase instead of the browser. Pages keep the same look.
- Loading and error states (no blank screen while loading, clear message if saving fails).
- Live updates: when one person adds something, others see it without refreshing.
- Payments: void with reason (owner / payments manager). Expenses: delete becomes hide + restore.

**You check:** add client → booking → payment → expense; refresh, open on another browser, data is there; a "view only" staff can't change anything.

## Stage 4 — Timetable and daily ad sheet
- Programs saved per day, copy day, gaps, sponsor link — same as now, on Supabase.
- New **Daily ad sheet**: pick a date → every ad slot that day in time order (client, package, time), print button.

**You check:** add/edit/copy programs; overlaps are blocked; ad sheet matches the bookings.

## Stage 5 — Staff tracking
- Start / finish work via server time; late badge; owner settings for start time and grace.
- Midnight auto-close of open shifts (scheduled job).
- Attendance page: monthly summary per staff.
- Logbook on Supabase with the same-day edit rule.
- New owner-only **Activity** page: filter by staff, area, date; shows what changed; restore hidden items from here.

**You check:** start/finish as staff; late shows correctly; activity page shows your actions; restore a deleted expense.

## Stage 6 — Notifications and automation
- Notifications created by the database (new booking, payment, expense, timetable change), shown only to people who can see that area.
- Daily scheduled job (morning): payment overdue, ad ending in 3 days, timetable gaps in the next 7 days.
- Read / unread per person.

**You check:** create a booking as one user, the bell lights up for another; overdue bookings show the next morning (or when I give you the SQL to run the job now).

## Stage 7 — Dashboard and reports on real data
- Remove sample history; reports built from real records only (starting this month).
- CSV export kept.

**You check:** numbers on dashboard/reports match what you entered.

## Stage 8 — Security check and clean-up  ⚠ I need to test this myself
- Automated test that signs in as owner, a "view" staff and a "no access" staff and confirms each one can / can't read and write each table through the API (not just the screen).
- Remove leftover demo code; final build.
- **I'll ask before running it** — it needs 2–3 test accounts in your Supabase project, which I delete afterwards.

## Stage 9 — Landing page connection (when your friend's page is ready)
- Public, read-only: active packages and prices, "On air now" from the timetable.
- Enquiry form → `enquiries` table → new "Enquiries" page in the admin + notification.

## Stage 10 — Go live (final, only when you say)
- Cloudflare: connect the GitHub repo, set env variables, replace `vercel.json` with Cloudflare SPA config, custom domain if any.
- Supabase: set the live site URL, turn on daily backups reminder.

---

## What you need to do along the way
- Stage 1, 2: run the SQL files, create the owner user, paste the Edge Function (step by step instructions provided).
- Stage 2: decide the owner's username.
- Have git access to `sstvchannel2021-bit` on this PC (for push).
- Never send me the Supabase **service_role** key — it's not needed here.
