# Leave Management System

## Overview

The Leave Management System is a web-based application developed to simplify and automate the employee leave management process. It enables employees to register, log in, apply for leave, track leave history, and receive status updates. Administrators can manage employee records, review leave requests, and approve or reject applications.

The system minimizes manual paperwork, improves transparency, and provides an efficient workflow for leave approvals.

---

## Features

### Employee
- Employee Registration
- Employee Login
- Apply for Leave
- View Leave History
- Track Leave Status
- View Notifications
- View Employee Profile

### Administrator
- Admin Login
- View Employee List
- View Employee Details
- Review Leave Requests
- Approve or Reject Leave Applications
- Monitor Leave History

---

# Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript
- EJS (Embedded JavaScript Templates)

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Tools
- Git
- GitHub
- VS Code
- npm

---

# Project Structure

```
Leave-Management-System/
│
├── node_modules/
│
├── public/
│   ├── css/
│   └── js/
│       ├── dashboard.js
│       └── leave.js
│
├── sql/
│
├── views/
│   ├── admin-dashboard.ejs
│   ├── admin-login.ejs
│   ├── apply-leave.ejs
│   ├── employee-dashboard.ejs
│   ├── employee-details.ejs
│   ├── employee-list.ejs
│   ├── leave-approval.ejs
│   ├── leave-history.ejs
│   └── notifications.ejs
│
├── employee-login.html
├── employee-register.html
├── server.js
├── package.json
└── README.md
```

---

# Setup

## Prerequisites

- Node.js
- npm
- MySQL Server
- Git

### Clone Repository

```bash
git clone https://github.com/Tulasikumar4449/Leave-Management-System.git
```

### Navigate to Project

```bash
cd Leave-Management-System
```

### Install Dependencies

```bash
npm install
```

### Configure Database

1. Create a MySQL database.

2. Import the SQL file located inside the `sql` folder.

3. Update database credentials in `server.js`.

Example:

```javascript
host: "localhost",
user: "root",
password: "your_password",
database: "leave_management"
```

### Start Server

```bash
node server.js
```

or

```bash
npm start
```

Open the application in your browser:

```
http://localhost:3000
```

---

# Architecture

The application follows a three-tier architecture.

```
                Client (Browser)
                      │
          HTML + CSS + JavaScript + EJS
                      │
               Express.js Server
                      │
              Business Logic Layer
                      │
                  MySQL Database
```

### Request Flow

```
Employee

↓

Login / Apply Leave

↓

Express Route

↓

Database Query

↓

Result Processing

↓

Render EJS Page

↓

Browser
```

---

# Database Design

## Employee

- Employee ID
- Name
- Email
- Password
- Department

## Leave Request

- Leave ID
- Employee ID
- Leave Type
- Start Date
- End Date
- Reason
- Status

## Admin

- Admin ID
- Username
- Password

---

# Modules

## Employee Module

- Register
- Login
- Apply Leave
- View History
- Notifications

## Admin Module

- Login
- Employee Management
- Leave Approval
- Dashboard

---

# AI Usage

Artificial Intelligence was used as a development assistant during this project.

AI assisted with:

- Understanding Express.js concepts
- Improving code quality
- Debugging JavaScript and Node.js errors
- SQL query optimization
- README documentation
- Code explanations
- Best practices for project structure

All application logic, testing, integration, and final implementation decisions were performed manually.

---

# Assumptions

- Employees must register before logging in.
- Only administrators can approve or reject leave requests.
- Each employee has a unique email address.
- Users have a stable internet connection.
- MySQL server is running before starting the application.
- Passwords are stored securely (or should be hashed in production).
- Only authenticated users can access protected pages.

---

# Future Enhancements

- Password encryption using bcrypt
- Email notifications
- Role-Based Access Control (RBAC)
- JWT Authentication
- REST API
- React Frontend
- Docker Deployment
- Cloud Hosting (AWS/Azure)
- Leave Balance Calculation
- Analytics Dashboard

---

# Author

Tulasi Kumar

GitHub:
https://github.com/Tulasikumar4449

---
