require('dotenv').config();
const functions = require('@google-cloud/functions-framework');
const { v4: uuidv4 } = require('uuid');
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MYDOMAIN
});
const mysql = require('mysql');

// const DB_HOST = '10.246.0.2';
// const DB_USER = 'webapp';
// const DB_PASSWORD = '39VOhY1HUdWkk4qt';
// const DB_NAME = 'webapp';

const pool = mysql.createPool({
  connectionLimit: 10,
   host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD
});

// Define the entry point function and export it
exports.newUserAccount = async (cloudEvent) => {
  try {
    const decodedData = Buffer.from(cloudEvent.data, 'base64').toString('utf-8');
    console.log("error decode data",decodedData);
    const data = JSON.parse(decodedData);
    console.log('Decoded data:', data);

if (!data || !data.email) {
      console.error('Invalid or missing email address');
      return;
    }
    // Generate verification link
    const verificationLink = `http://poojacloud24.pw:8080/v1/user/verify?token=${data.verificationToken}`;

    // Send verification email
    const emailData = {
      from: 'noreply@poojacloud24.pw',
      to: data.email,
      subject: 'User Verification Email',
      text: `Please click on this link to verify your email address: ${verificationLink}`,
    };

    console.log("EmailData: ", emailData);

    // await mailgun.messages().send(emailData);

    mailgun.messages().send(emailData, (error, body) => {
      if (error) {
        console.log("Email send error: ", error)
      } else {
        console.log("Email send success: ", body);
      }
    });

    // Track the email sent in MySQL
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
      }

      const queryText = 'UPDATE EmailTracking SET timestamp=? WHERE verification_token=?';
      connection.query(queryText, [new Date(), data.verificationToken], (error, results, fields) => {
        connection.release();

        if (error) {
          console.error('Error inserting email tracking:', error);
          return;
        }

        console.log(`Verification email sent to ${data.username}`);
      });
    });
  } catch (error) {
    console.error('Error processing message:', error);
  }
};
