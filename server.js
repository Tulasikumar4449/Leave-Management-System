require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = process.env.PORT || 3000;


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});


db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err.message);
    return;
  }
  console.log('Connected to MySQL');
});

const dbPromise = db.promise();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'leave-management-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function requireEmployee(req, res, next) {
  if (req.session.user && req.session.user.role === 'employee') {
    return next();
  }
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/admin/login');
}

app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'employee-login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-register.html'));
});

app.post('/register', (req, res) => {
  const { name, email, password, department } = req.body;
  const insertUser = 'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)';
  db.query(insertUser, [name, email, password, 'employee', department], (err, result) => {
    if (err) return res.status(500).send('Registration error');
    const userId = result.insertId;
    const insertBalance = 'INSERT INTO leave_balances (user_id, sick_leave, casual_leave, privileged_leave, optional_leave) VALUES (?, 12, 12, 15, 5)';
    db.query(insertBalance, [userId], (balanceErr) => {
      if (balanceErr) return res.status(500).send('Balance creation error');
      res.redirect('/login');
    });
  });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-login.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = ?';
  db.query(query, [email, password, 'employee'], (err, results) => {
    if (err) return res.status(500).send('Login error');
    if (results.length === 0) return res.redirect('/login?error=invalid');
    req.session.user = results[0];
    res.redirect('/dashboard');
  });
});

app.get('/dashboard', requireEmployee, async (req, res) => {
  const userId = req.session.user.id;
  const currentYear = new Date().getFullYear();

  try {
    const [balanceResults] = await dbPromise.query('SELECT * FROM leave_balances WHERE user_id = ?', [userId]);
    const balance = balanceResults[0] || {};

    const [statsResults] = await dbPromise.query('SELECT status, COUNT(*) AS count FROM leave_requests WHERE user_id = ? GROUP BY status', [userId]);
    const stats = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    statsResults.forEach((row) => {
      stats[row.status.toLowerCase()] = row.count;
    });

    const [totalResults] = await dbPromise.query('SELECT COUNT(*) AS total FROM leave_requests WHERE user_id = ?', [userId]);
    const total = totalResults[0] ? totalResults[0].total : 0;

    const [notificationsResults] = await dbPromise.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 5', [userId]);

    const [leaveCalendarResults] = await dbPromise.query(
      `SELECT id, leave_type, from_date, to_date, status FROM leave_requests WHERE user_id = ? AND status IN ('PENDING','APPROVED') AND to_date >= CURDATE() ORDER BY from_date ASC`,
      [userId]
    );

    const [holidayResults] = await dbPromise.query('SELECT * FROM holidays ORDER BY holiday_date LIMIT 6');

    const [usedResults] = await dbPromise.query(
      'SELECT SUM(days) AS used_days FROM leave_requests WHERE user_id = ? AND status = ? AND YEAR(from_date) = ?',
      [userId, 'APPROVED', currentYear]
    );
    const usedDays = usedResults[0].used_days || 0;

    const [monthlyTrendResults] = await dbPromise.query(
      'SELECT MONTH(from_date) AS month, SUM(days) AS days FROM leave_requests WHERE user_id = ? AND YEAR(from_date) = ? GROUP BY MONTH(from_date)',
      [userId, currentYear]
    );
    const trendLabels = Array.from({ length: 12 }, (_, index) => new Date(currentYear, index).toLocaleString('default', { month: 'short' }));
    const trendValues = Array.from({ length: 12 }, (_, index) => {
      const detail = monthlyTrendResults.find((row) => row.month === index + 1);
      return detail ? detail.days : 0;
    });

    const [typeDistributionResults] = await dbPromise.query(
      'SELECT leave_type, SUM(days) AS total_days FROM leave_requests WHERE user_id = ? AND status = ? AND YEAR(from_date) = ? GROUP BY leave_type',
      [userId, 'APPROVED', currentYear]
    );
    const typeLabels = typeDistributionResults.map((row) => row.leave_type);
    const typeValues = typeDistributionResults.map((row) => row.total_days);

    const [insightResults] = await dbPromise.query(
      'SELECT leave_type, SUM(days) AS total_days FROM leave_requests WHERE user_id = ? AND status = ? AND YEAR(from_date) = ? GROUP BY leave_type ORDER BY total_days DESC LIMIT 1',
      [userId, 'APPROVED', currentYear]
    );
    const favoriteType = insightResults[0] ? insightResults[0].leave_type : 'None';

    const [longestResults] = await dbPromise.query(
      'SELECT leave_type, days FROM leave_requests WHERE user_id = ? AND YEAR(from_date) = ? ORDER BY days DESC LIMIT 1',
      [userId, currentYear]
    );
    const longestLeave = longestResults[0] ? longestResults[0] : { leave_type: 'None', days: 0 };

    res.render('employee-dashboard', {
      user: req.session.user,
      balance,
      stats,
      total,
      notifications: notificationsResults,
      leaves: leaveCalendarResults,
      holidays: holidayResults,
      usedDays,
      trendLabels: JSON.stringify(trendLabels),
      trendValues: JSON.stringify(trendValues),
      typeLabels: JSON.stringify(typeLabels),
      typeValues: JSON.stringify(typeValues),
      favoriteType,
      longestLeave
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
});

app.get('/apply-leave', requireEmployee, (req, res) => {
  res.render('apply-leave', { user: req.session.user });
});

app.post('/apply-leave', requireEmployee, (req, res) => {
  const { leave_type, from_date, to_date, reason, days } = req.body;
  const insertRequest = 'INSERT INTO leave_requests (user_id, leave_type, from_date, to_date, days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(insertRequest, [req.session.user.id, leave_type, from_date, to_date, days, reason, 'PENDING'], (err) => {
    if (err) return res.status(500).send('Leave apply error');
    res.redirect('/leave-history');
  });
});

app.get('/leave-history', requireEmployee, (req, res) => {
  const historyQuery = 'SELECT * FROM leave_requests WHERE user_id = ? ORDER BY id DESC';
  db.query(historyQuery, [req.session.user.id], (err, results) => {
    if (err) return res.status(500).send('Error loading history');
    res.render('leave-history', { user: req.session.user, history: results });
  });
});

app.post('/leave-history/cancel/:id', requireEmployee, (req, res) => {
  const requestId = req.params.id;
  const pendingQuery = 'SELECT * FROM leave_requests WHERE id = ? AND user_id = ? AND status = ?';
  db.query(pendingQuery, [requestId, req.session.user.id, 'PENDING'], (err, results) => {
    if (err || results.length === 0) return res.redirect('/leave-history');
    const cancelQuery = 'UPDATE leave_requests SET status = ?, admin_notes = ? WHERE id = ?';
    db.query(cancelQuery, ['CANCELLED', 'Cancelled by employee', requestId], (cancelErr) => {
      if (cancelErr) console.error(cancelErr);
      res.redirect('/leave-history');
    });
  });
});

app.get('/notifications', requireEmployee, (req, res) => {
  const notifyQuery = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC';
  const markRead = 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
  db.query(notifyQuery, [req.session.user.id], (err, results) => {
    if (err) return res.status(500).send('Error loading notifications');
    db.query(markRead, [req.session.user.id], () => {
      res.render('notifications', { user: req.session.user, notifications: results });
    });
  });
});

app.get('/admin/login', (req, res) => {
  res.render('admin-login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE name = ? AND password = ? AND role = ?';
  db.query(query, [username, password, 'admin'], (err, results) => {
    if (err) return res.status(500).send('Admin login error');
    if (results.length === 0) return res.render('admin-login', { error: 'Invalid credentials' });
    req.session.user = results[0];
    res.redirect('/admin/dashboard');
  });
});

app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [employeeResults] = await dbPromise.query('SELECT COUNT(*) AS totalEmployees FROM users WHERE role = ?', ['employee']);
    const [pendingResults] = await dbPromise.query("SELECT COUNT(*) AS pending FROM leave_requests WHERE status = 'PENDING'");
    const [approvedResults] = await dbPromise.query("SELECT COUNT(*) AS approved FROM leave_requests WHERE status = 'APPROVED'");
    const [rejectedResults] = await dbPromise.query("SELECT COUNT(*) AS rejected FROM leave_requests WHERE status = 'REJECTED'");
    const [departmentResults] = await dbPromise.query(
      `SELECT u.department,
              COUNT(u.id) AS totalEmployees,
              SUM(lr.status = 'PENDING') AS pendingLeaves
       FROM users u
       LEFT JOIN leave_requests lr ON u.id = lr.user_id
       WHERE u.role = 'employee'
       GROUP BY u.department`
    );
    const [conflictResults] = await dbPromise.query(
      `SELECT u.department, COUNT(*) AS conflictCount
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.status IN ('PENDING','APPROVED')
         AND lr.from_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND lr.to_date >= CURDATE()
       GROUP BY u.department
       HAVING conflictCount >= 2`
    );
    let recentRequests = [];
    try {
      const [recentRequestsResults] = await dbPromise.query(
        `SELECT lr.id, u.name AS employee_name, lr.leave_type, lr.from_date, lr.to_date, lr.status
         FROM leave_requests lr
         JOIN users u ON lr.user_id = u.id
         ORDER BY lr.id DESC
         LIMIT 4`
      );
      recentRequests = recentRequestsResults;
    } catch (recentErr) {
      console.error('Recent requests query error:', recentErr);
      recentRequests = [];
    }

    res.render('admin-dashboard', {
      user: req.session.user,
      totalEmployees: employeeResults[0].totalEmployees,
      pending: pendingResults[0].pending,
      approved: approvedResults[0].approved,
      rejected: rejectedResults[0].rejected,
      departments: departmentResults,
      conflicts: conflictResults,
      recentRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading admin dashboard');
  }
});

app.get('/admin/employees', requireAdmin, (req, res) => {
  const query = 'SELECT id, name, email, department FROM users WHERE role = ?';
  db.query(query, ['employee'], (err, results) => {
    if (err) return res.status(500).send('Error loading employees');
    res.render('employee-list', { user: req.session.user, employees: results });
  });
});

app.get('/admin/employee/:id', requireAdmin, (req, res) => {
  const userId = req.params.id;
  const userQuery = 'SELECT id, name, email, department FROM users WHERE id = ? AND role = ?';
  const balanceQuery = 'SELECT * FROM leave_balances WHERE user_id = ?';
  const historyQuery = 'SELECT * FROM leave_requests WHERE user_id = ? ORDER BY id DESC';

  db.query(userQuery, [userId, 'employee'], (err, userResults) => {
    if (err || userResults.length === 0) return res.status(404).send('Employee not found');
    db.query(balanceQuery, [userId], (balanceErr, balanceResults) => {
      if (balanceErr) return res.status(500).send('Error loading employee details');
      db.query(historyQuery, [userId], (historyErr, historyResults) => {
        if (historyErr) return res.status(500).send('Error loading employee leave history');
        res.render('employee-details', {
          user: req.session.user,
          employee: userResults[0],
          balance: balanceResults[0] || {},
          history: historyResults
        });
      });
    });
  });
});

app.get('/admin/requests', requireAdmin, (req, res) => {
  const query = `SELECT lr.*, u.name AS employee_name FROM leave_requests lr JOIN users u ON lr.user_id = u.id ORDER BY lr.id DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).send('Error loading leave requests');
    res.render('leave-approval', { user: req.session.user, requests: results });
  });
});

app.post('/admin/requests/bulk-action', requireAdmin, (req, res) => {
  const { action, requestIds } = req.body;
  if (!requestIds) return res.redirect('/admin/requests');
  const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
  const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

  const requestQuery = 'SELECT * FROM leave_requests WHERE id IN (?)';
  db.query(requestQuery, [ids], (err, requests) => {
    if (err || requests.length === 0) return res.redirect('/admin/requests');

    const processed = requests.map((request) => {
      return new Promise((resolve) => {
        const updateRequest = 'UPDATE leave_requests SET status = ?, admin_notes = ? WHERE id = ?';
        const notes = action === 'approve' ? 'Approved in bulk' : 'Rejected in bulk';

        db.query(updateRequest, [status, notes, request.id], (updateErr) => {
          if (updateErr) return resolve();
          const notifyMessage = status === 'APPROVED' ? 'Your leave request has been approved.' : 'Your leave request has been rejected.';
          const actions = [];

          actions.push(new Promise((notifyResolve) => {
            db.query('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)', [request.user_id, notifyMessage], () => notifyResolve());
          }));

          if (status === 'APPROVED') {
            const balanceFieldMap = {
              Sick: 'sick_leave',
              Casual: 'casual_leave',
              Privileged: 'privileged_leave',
              Optional: 'optional_leave'
            };
            const balanceField = balanceFieldMap[request.leave_type];
            if (balanceField) {
              actions.push(new Promise((balanceResolve) => {
                const updateBalance = `UPDATE leave_balances SET ${balanceField} = ${balanceField} - ? WHERE user_id = ?`;
                db.query(updateBalance, [request.days, request.user_id], () => balanceResolve());
              }));
            }
          }

          Promise.all(actions).then(() => resolve());
        });
      });
    });

    Promise.all(processed).then(() => {
      res.redirect('/admin/requests');
    });
  });
});

app.post('/admin/requests/:id/action', requireAdmin, (req, res) => {
  const requestId = req.params.id;
  const { action, admin_notes } = req.body;
  const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

  const requestQuery = 'SELECT * FROM leave_requests WHERE id = ?';
  db.query(requestQuery, [requestId], (err, requestResults) => {
    if (err || requestResults.length === 0) return res.status(404).send('Leave request not found');

    const leaveRequest = requestResults[0];
    const updateRequest = 'UPDATE leave_requests SET status = ?, admin_notes = ? WHERE id = ?';

    db.query(updateRequest, [status, admin_notes, requestId], (updateErr) => {
      if (updateErr) return res.status(500).send('Error updating request');

      if (status === 'APPROVED') {
        const balanceFieldMap = {
          Sick: 'sick_leave',
          Casual: 'casual_leave',
          Privileged: 'privileged_leave',
          Optional: 'optional_leave'
        };
        const balanceField = balanceFieldMap[leaveRequest.leave_type];
        const updateBalance = `UPDATE leave_balances SET ${balanceField} = ${balanceField} - ? WHERE user_id = ?`;
        db.query(updateBalance, [leaveRequest.days, leaveRequest.user_id], (balanceErr) => {
          if (balanceErr) console.error('Balance update error:', balanceErr.message);
          const msg = 'Your leave request has been approved.';
          db.query('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)', [leaveRequest.user_id, msg], () => {
            res.redirect('/admin/requests');
          });
        });
      } else {
        const msg = 'Your leave request has been rejected.';
        db.query('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)', [leaveRequest.user_id, msg], () => {
          res.redirect('/admin/requests');
        });
      }
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
