const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ MongoDB connection
mongoose.connect(
  "mongodb+srv://siva:1234@cluster0.vdvb74x.mongodb.net/passkey?appName=Cluster0",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ Connection Failed:", err));

// ✅ Define schema & model for credentials
const credentialSchema = new mongoose.Schema({
  user: String,
  pass: String
}, { collection: 'bulkmail' });

const Credential = mongoose.model('Credential', credentialSchema);

// ✅ Email sending route
app.post('/sendemail', async (req, res) => {
  const { msg, emailList } = req.body;

  if (!msg || !emailList || !Array.isArray(emailList) || emailList.length === 0) {
    return res.status(400).send("❌ Bad request: msg and emailList are required");
  }

  try {
    // Fetch credential (used for 'from' email)
    const credential = await Credential.findOne();
    if (!credential) return res.status(400).send("❌ No credentials found");

    // Prepare messages
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

// ✅ Render uses port from env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
