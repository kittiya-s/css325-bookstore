# CSS325 Project 2 – Online Bookstore (Too Cute to Work)

Online bookstore database for CSS325 Database Systems (Semester 1/2026), with a small web app for customers and staff.

**Team:** Kittiya Saiprakas (6722773635), Apitsamai Pangsang (6722772397), Nicharee Teeratrakul (6722772199)

```
bookstore-project2/
├── database/
│   ├── 00_setup_root.sql                 run once as root (creates DB + accounts)
│   ├── 01_schema.sql                     run as bookstore_owner
│   ├── 02_sample_data.sql                run as bookstore_owner
│   ├── 03_views_triggers_procedures.sql  run as bookstore_owner
│   ├── 04_access_control.sql             run as bookstore_owner
│   └── 05_demo_queries.sql               for the demo, run one query at a time
└── web/                                  Node.js + Express (MVC)
    ├── server.js
    ├── db.js                             two connection pools (customer / staff)
    ├── controllers/
    ├── models/                           all SQL queries are here
    ├── routes/
    ├── middleware/
    ├── utils/
    └── public/                           HTML, CSS and JavaScript pages
```

## Requirements
- MySQL Server 8.x + MySQL Workbench
- Node.js 18 or newer (20 or 22 LTS recommended)
- VS Code

## Setup

### 1. Database
1. Open Workbench, connect as **root**, open `00_setup_root.sql` and click ⚡ (Execute All).
   - This is the only step that uses root. It creates the database and the accounts.
2. Create a new connection in Workbench (click ➕):
   - Connection Name: `bookstore_owner`
   - Username: `bookstore_owner` (the password is in `00_setup_root.sql`)
3. Connect as `bookstore_owner` and run `01` → `02` → `03` → `04`, one file at a time (⚡).
4. **Do not** use Execute All on `05_demo_queries.sql`. Click on a query and press Ctrl+Enter to run them one by one. Some of them are supposed to fail (to show the triggers, rollback and permissions).

> To reset all data, run `01` → `02` → `03` → `04` again as `bookstore_owner`. Root is not needed.

### 2. Web app
```bash
cd web
copy .env.example .env      # Windows (Mac: cp .env.example .env)
npm install
npm start
```
Before `npm start`, open `.env` and fill in the passwords. The MySQL passwords are the ones in `database/00_setup_root.sql`. Put each password in quotes, because `#` starts a comment if the value is not quoted.

Open http://localhost:3000

## Test accounts (sample data)
| Used for | Email | Password |
|---|---|---|
| Customer | somchai@example.com | somchai123 |
| Customer (no orders yet) | natta@example.com | natta123 |

The staff login for the website is set in `.env` (`STAFF_USERNAME`, `STAFF_PASSWORD`).

## MySQL accounts
| Account | Used for |
|---|---|
| root | only `00_setup_root.sql` |
| bookstore_owner | builds and maintains the database |
| app_customer | customer pages of the website |
| app_staff | staff pages of the website |

## Security
1. **No root** – root is only used once to create the accounts. The web app connects as `app_customer` / `app_staff`, which only have the privileges their pages need (least privilege).
2. **Roles and column privileges** – `role_customer` and `role_staff`. Staff cannot read `password_hash`, and can only change the `status` of an order, not the total.
3. **Orders only through `sp_place_order`** – customers have no INSERT on orders/payment, so they cannot fake a price. The price is read from the book table inside the procedure.
4. **SQL injection** – every query uses `?` placeholders (prepared statements).
5. **XSS** – text from the database is escaped before it is put into the page.
6. **Passwords** are hashed with scrypt + salt. The real password is never stored.
7. **DB passwords are in `.env`**, not in the code, and `.env` is in `.gitignore`.
8. The session cookie is `httpOnly`, and a new session ID is created after login.
9. SQL errors are only logged on the server, not shown to users.

## Notes
- `00_setup_root.sql` sets `log_bin_trust_function_creators = 1`. MySQL 8 has binary logging on by default, and then a user without SUPER cannot create triggers or functions (error 1419).
- If you change a MySQL password, change it in `.env` too.
- In MySQL Workbench, Safe Update mode is on by default, so every UPDATE in our scripts has a key column in its WHERE clause.
