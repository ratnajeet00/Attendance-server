run 
```
npm install
```

then 
``` 
node server.js
```
the You can port forword the site to a link using 
```
Ngrok
```

and the server is live 


the database setup quries are:

setup database
```
create database cpp
```

table cretaion qurie:
```
CREATE TABLE attendance (
    id INT PRIMARY KEY,
    uid VARCHAR(255), -- Adjust the length as needed
    name VARCHAR(255),
    days_present INT,
    days_absent INT,
    username VARCHAR(255),
    password VARCHAR(255),
    attendance_date DATE,
    phone_number VARCHAR(15) -- Assuming a basic phone number format
);

```

this is the structure of data base table 
```
+----+-------------+----------+--------------+-------------+----------+----------+-----------------+--------------+
| id | uid         | name     | days_present | days_absent | username | password | attendance_date | phone_number |
+----+-------------+----------+--------------+-------------+----------+----------+-----------------+--------------+
|  1 | 89e28316%0D | John Doe |            0 |           0 | NULL     | NULL     | NULL            | ------   |
+----+-------------+----------+--------------+-------------+----------+----------+-----------------+--------------+
```
