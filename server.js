const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Set SendGrid API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ MongoDB connection using environment variable
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection failed:", err));

// ✅ Define schema & model for credentials
const credentialSchema = new mongoose.Schema({
  user: String,
  pass: String
}, { collection: 'bulkmail' });

const Credential = mongoose.model('Credential', credentialSchema);

// ✅ Email sending route
app.post('/sendemail', async (req, res) => {
  const { msg, emailList } = req.body;

  // Validate request
  if (!msg || !emailList || !Array.isArray(emailList) || emailList.length === 0) {
    return res.status(400).send("❌ Bad request: msg and emailList are required");
  }

  try {
    // Fetch credential (used for 'from' email)
    const credential = await Credential.findOne();
    if (!credential) return res.status(400).send("❌ No credentials found");

    // Prepare messages for multiple recipients
    const emails = emailList.map(email => ({
      to: email,
      from: credential.user, // must be verified in SendGrid
      subject: 'Bulk Mail',
      text: msg
    }));

    // Send all emails
    await sgMail.send(emails);
    console.log("✅ All emails sent successfully");
    res.send(true);

  } catch (error) {
    console.error("❌ Email send error:", error);
    res.status(500).send(false);
  }
});

// ✅ Use port from environment variable for cloud deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
