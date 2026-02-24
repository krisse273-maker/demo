require('dotenv').config(); // Laddar .env
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// ========================
// Init Firebase Admin med .env
// ========================
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

// ========================
// POST endpoint: QR-validering med säker token
// ========================
app.post("/validate-transfer", async (req, res) => {
  try {
    // 🔐 1. Hämta Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // 🔥 2. Verifiera Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const receiverId = decodedToken.uid; // ← korrekt receiver

    const { postId, donorId } = req.body;

    if (!postId || !donorId) {
      return res.status(400).json({ success: false, error: "Saknar data" });
    }

    // 🔎 3. Kontrollera om redan validerad
    const validationRef = db.collection("validations").doc(postId);
    const validationSnap = await validationRef.get();

    if (validationSnap.exists) {
      return res.json({ success: false, error: "Redan validerad" });
    }

    // 🔥 4. Skapa validering
    await validationRef.set({
      postId,
      donorId,
      receiverId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "completed"
    });

    // 🔥 5. Uppdatera poäng
    await db.collection("users").doc(receiverId).update({
      points: admin.firestore.FieldValue.increment(1) // Hämtare = 1p
    });

    await db.collection("users").doc(donorId).update({
      points: admin.firestore.FieldValue.increment(2) // Skänkare = 2p
    });

    return res.json({ success: true });

  } catch (error) {
    console.error("Validation error:", error);
    return res.status(401).json({ success: false, error: "Invalid token eller serverfel" });
  }
});

// ========================
// Starta server
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
