require('dotenv').config(); // <-- Laddar .env
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// Init Firebase Admin med .env
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  })
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST endpoint för QR-validering
app.post("/validate-transfer", async (req, res) => {
  const { postId, donorId, receiverId } = req.body;

  if (!postId || !donorId || !receiverId) {
    return res.status(400).json({ success: false, error: "Saknar data" });
  }

  try {
    const validationRef = db.collection("validations").doc(postId);
    const validationSnap = await validationRef.get();

    if (validationSnap.exists) {
      return res.json({ success: false, error: "Redan validerad" });
    }

    // Skapa validation
    await validationRef.set({
      postId,
      donorId,
      receiverId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed"
    });

    // Lägg till poäng hos receiver (hämtare = 1p)
    const receiverRef = db.collection("users").doc(receiverId);
    await receiverRef.update({ points: admin.firestore.FieldValue.increment(1) });

    // Lägg till poäng hos donor (skänkare = 2p)
    const donorRef = db.collection("users").doc(donorId);
    await donorRef.update({ points: admin.firestore.FieldValue.increment(2) });

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
});

// Starta server på port från .env, default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));