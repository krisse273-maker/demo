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
// POST endpoint: QR-validering med säker token + transaction
// ========================
app.post("/validate-transfer", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // 🔐 Verifiera token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const receiverId = decodedToken.uid;

    const { postId, donorId } = req.body;
    if (!postId || !donorId) {
      return res.status(400).json({ success: false, error: "Saknar data" });
    }

    // 🔄 Transaction för atomisk uppdatering
    await db.runTransaction(async (t) => {
      const validationRef = db.collection("validations").doc(postId);
      const postRef = db.collection("posts").doc(postId); // posten ska finnas här
      const receiverRef = db.collection("users").doc(receiverId);
      const donorRef = db.collection("users").doc(donorId);

      const validationSnap = await t.get(validationRef);
      if (validationSnap.exists) throw new Error("Redan validerad");

      const postSnap = await t.get(postRef);
      if (!postSnap.exists) throw new Error("Posten finns inte");

      const postData = postSnap.data();
      if (postData.ownerId !== donorId) throw new Error("Donor äger inte posten");

      // 🔥 Skapa validering
      t.set(validationRef, {
        postId,
        donorId,
        receiverId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: "completed"
      });

      // 🔥 Uppdatera poäng atomiskt
      t.update(receiverRef, { points: admin.firestore.FieldValue.increment(1) });
      t.update(donorRef, { points: admin.firestore.FieldValue.increment(2) });
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Validation error:", err);
    return res.status(400).json({ success: false, error: err.message || "Invalid request" });
  }
});

// ========================
// Starta server
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
