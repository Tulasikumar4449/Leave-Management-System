CREATE DATABASE IF NOT EXISTS leave_management;
USE leave_management;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL,
  department VARCHAR(100) NULL,
  joining_date DATE NULL,
  manager VARCHAR(150) DEFAULT 'HR Team'
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  sick_leave INT DEFAULT 12,
  casual_leave INT DEFAULT 12,
  privileged_leave INT DEFAULT 15,
  optional_leave INT DEFAULT 5,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type ENUM('Sick', 'Casual', 'Privileged', 'Optional') NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
  admin_notes VARCHAR(500) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  holiday_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, password, role, department, joining_date, manager) VALUES
('admin', 'admin@leave.com', 'admin123', 'admin', 'HR', CURDATE(), 'HR Team')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO users (name, email, password, role, department, joining_date, manager) VALUES
('Priya Sharma', 'priya@example.com', 'password1', 'employee', 'Finance', '2024-01-12', 'Finance Manager'),
('Amit Patel', 'amit@example.com', 'password2', 'employee', 'Marketing', '2024-03-19', 'Marketing Lead');

INSERT INTO leave_balances (user_id) SELECT id, 12, 12, 15, 5 FROM users WHERE role = 'employee' AND id NOT IN (SELECT user_id FROM leave_balances);

INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, days, reason, status) VALUES
(2, 'Sick', '2026-07-01', '2026-07-03', 3, 'Fever and rest', 'APPROVED'),
(3, 'Casual', '2026-07-05', '2026-07-06', 2, 'Personal work', 'PENDING');

INSERT INTO holidays (name, holiday_date) VALUES
('Independence Day', '2026-08-15'),
('Gandhi Jayanti', '2026-10-02'),
('Diwali', '2026-11-04');

INSERT INTO notifications (user_id, message, is_read) VALUES
(2, 'Your leave request has been approved.', 0),
(3, 'Your leave request is pending review.', 0);
