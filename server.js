const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const cron = require('node-cron');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL database configuration using connection pooling
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'cpp',
  port: 3306,
  connectionLimit: 0, // Adjust based on your requirements
});

// Check if the database connection is successful
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
    connection.release(); // Release the connection
  }
});

// Schedule the task to run at the end of the day
cron.schedule('59 23 * * *', () => {
  markAbsentUsers();
});

// Endpoint to mark absent users
app.post('/markAbsentUsers', (req, res) => {
  try {
    // Query for users who haven't been marked present today
    const absentQuery = 'UPDATE attendance SET days_absent = days_absent + 1 WHERE days_present = 0';
    pool.query(absentQuery, (error, results) => {
      if (error) {
        throw new Error('Error marking absent users');
      }

      res.json({ success: true, message: 'Absent users marked successfully' });
    });
  } catch (error) {
    console.error('Error marking absent users:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route for the root path
app.get('/', (req, res) => {
  res.send('hello');
});

// Route to handle form submission and check attendance
app.post('/attendance', (req, res) => {
  console.log('Received POST request with body:', req.body);

  try {
    const { uid, action } = req.body;

    if (uid && action) {
      console.log(`Received RFID data: ${uid}, Action: ${action}`);

      if (action === 'check') {
        // Increment days_present by 1 for the given UID
        const updateQuery = 'UPDATE attendance SET days_present = days_present + 1 WHERE uid = ?';
        pool.query(updateQuery, [uid], (error, results) => {
          if (error) {
            throw new Error('Error updating attendance');
          }

          if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Attendance updated successfully' });
          } else {
            res.json({ success: false, message: 'Attendance not found for the given UID' });
          }
        });
      } else {
        // Increment days_absent by 1 for the given UID
        const updateQuery = 'UPDATE attendance SET days_absent = days_absent + 1 WHERE uid = ?';
        pool.query(updateQuery, [uid], (error, results) => {
          if (error) {
            throw new Error('Error updating attendance');
          }

          if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Attendance updated successfully' });
          } else {
            res.json({ success: false, message: 'Attendance not found for the given UID' });
          }
        });
      }
    } else {
      throw new Error('Invalid request: Missing UID or Action in the request body');
    }
  } catch (error) {
    console.error('Error processing request:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Serve the HTML form for adding attendance data
app.get('/addAttendance', (req, res) => {
  res.render('addAttendance');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
