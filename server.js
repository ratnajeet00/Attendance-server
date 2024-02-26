const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const ejs = require('ejs');
const cron = require('node-cron');
const twilio = require('twilio');
const cors = require('cors'); 

const app = express();
const port = 3000;

// Your Twilio credentials
const accountSid = 'ACc9d03d0d7851bafaab1b591bb2bd206b';
const authToken = 'f8ac0b0c093fd621d93f7e7b6a4936df';
const twilioClient = twilio(accountSid, authToken);

app.use(cors()); 
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



// Endpoint to mark absent users and send WhatsApp messages to parents
app.post('/markAbsentUsers', async (req, res) => {
  try {
    // Query for users who were not marked present today
    const absentQuery = `
      SELECT uid, phone_number
      FROM attendance
      WHERE (attendance_date != CURDATE() OR attendance_date IS NULL)
        AND days_present = 0
        AND phone_number IS NOT NULL;
    `;

    pool.query(absentQuery, async (error, results) => {
      if (error) {
        throw new Error('Error fetching absent users');
      }

      // Log the results to inspect the phone numbers
      console.log('Results:', results);

      // Extract UIDs and phone numbers of absent students
      const absentData = results.map(result => ({
        uid: result.uid,
        phone_number: result.phone_number,
      }));

      // Send WhatsApp messages to parents
      for (const { uid, phone_number } of absentData) {
        // Log the original phone number before formatting
        console.log('Original Phone Number:', phone_number);

        const formattedPhoneNumber = '+91' + phone_number.trim().replace(/\D/g, '');
        const messageWhatsApp = `Dear parent, your child with UID ${uid} was absent from school today. Please contact the school for more information.`;

        // Log the formatted phone number
        console.log('Formatted Phone Number:', formattedPhoneNumber);

        // Send WhatsApp message
        await sendWhatsAppMessage(phone_number, messageWhatsApp);
      }

      res.json({ success: true, message: 'Absent users marked successfully. WhatsApp messages sent to parents.' });
    });
  } catch (error) {
    console.error('Error marking absent users:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to send WhatsApp message
const sendWhatsAppMessage = async (originalPhoneNumber, message) => {
  try {
    // Remove non-numeric characters from the phone number
    const formattedPhoneNumber = '+91' + originalPhoneNumber.replace(/\D/g, '');

    const twilioPhoneNumberWhatsApp = 'whatsapp:+14155238886'; // Replace with your Twilio WhatsApp number
    const toPhoneNumberWhatsApp = `whatsapp:${formattedPhoneNumber}`;
    console.log('toPhoneNumberWhatsApp:', toPhoneNumberWhatsApp);

    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumberWhatsApp,
      to: toPhoneNumberWhatsApp,
    });

    console.log(`WhatsApp message sent to ${formattedPhoneNumber}`);
  } catch (error) {
    console.error(`Error sending WhatsApp message to ${originalPhoneNumber}:`, error.message);
  }
};


// Route to handle form submission and check attendance
app.post('/attendance', (req, res) => {
  console.log('Received POST request with body:', req.body);

  try {
    const { uid, action } = req.body;

    if (uid && action) {
      console.log(`Received RFID data: ${uid}, Action: ${action}`);

      const updateQuery = `
        UPDATE attendance
        SET days_present = days_present + 1,
            attendance_date = CURDATE()
        WHERE uid = ?;
      `;

      pool.query(updateQuery, [uid], (error, results) => {
        if (error) {
          throw new Error('Error updating attendance');
        }

        if (results.affectedRows > 0) {
          const selectNameQuery = `
            SELECT name FROM attendance WHERE uid = ?;
          `;

          pool.query(selectNameQuery, [uid], (selectError, selectResults) => {
            if (selectError) {
              throw new Error('Error retrieving name');
            }

            const name = selectResults.length > 0 ? selectResults[0].name : '';
            res.json({ success: true, message: 'Attendance updated successfully', name });
          });
        } else {
          // If no record is found for the given UID, insert a new record with the current date
          const insertQuery = `
            INSERT INTO attendance (uid, days_present, attendance_date)
            VALUES (?, 1, CURDATE());
          `;

          pool.query(insertQuery, [uid], (insertError, insertResults) => {
            if (insertError) {
              throw new Error('Error inserting new attendance record');
            }

            const selectNameQuery = `
              SELECT name FROM attendance WHERE uid = ?;
            `;

            pool.query(selectNameQuery, [uid], (selectError, selectResults) => {
              if (selectError) {
                throw new Error('Error retrieving name');
              }

              const name = selectResults.length > 0 ? selectResults[0].name : '';
              res.json({ success: true, message: 'Attendance marked successfully', name });
            });
          });
        }
      });
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
