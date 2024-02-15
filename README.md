School Attendance System with WhatsApp Notifications
This is a Node.js application for managing school attendance and sending WhatsApp notifications to parents using Twilio.

Setup
Prerequisites
Before running the application, ensure you have the following installed:
```
Node.js
MySQL
Twilio Account
```

Installation
Clone the repository:
```
git clone https://github.com/your-username/school-attendance-system.git
cd school-attendance-system
```

Install dependencies:
```
npm install
```
Set up MySQL database:

Create a MySQL database and update the pool configuration in app.js with your database details.

Run the SQL script provided in setup.sql to create the required table:

```
mysql -u your-username -p your-database-name < setup.sql
```
Note: Make sure to replace your-username and your-database-name with your MySQL username and database name.

Configure Twilio:

Create a Twilio account and obtain your Account SID and Auth Token.

Update the accountSid and authToken variables in app.js with your Twilio credentials.

Replace twilioPhoneNumberWhatsApp with your Twilio WhatsApp number.

Running the Application
```
npm start
```
The server will start on``` http://localhost:3000.```

Usage
Open http://localhost:3000/addAttendance in your browser to access the attendance form.

Use the provided form to mark attendance for students.

The system will automatically send WhatsApp messages to parents of absent students at the end of each day.

Contributors
Ratnajeet Patil
