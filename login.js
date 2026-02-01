import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===== Firebase-konfiguration =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.firebasestorage.app",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

// ===== Initiera Firebase =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== UI =====
const loginBtn = document.getElementById("loginBtn");
const spinner = document.getElementById("spinner");
let msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
document.querySelector(".login-form").appendChild(msgElem);

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  msgElem.textContent = "";

  if (!email || !password) {
    msgElem.textContent = "Please fill in all fields!";
    return;
  }

  // ===== Disable the button, show spinner and update button text =====
  loginBtn.disabled = true;
  spinner.style.display = "inline-block";  // Show spinner
  loginBtn.textContent = "Logging in...";  // Change button text

  try {
    // ===== Logga in användaren =====
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ===== Hämta Firestore-data =====
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("User data from Firestore:", userSnap.data());
    } else {
      // Skapa dokument om det saknas
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || "Anonymous",
        createdAt: new Date()
      });
    }

    // Skicka användaren vidare
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    if (err.code === "auth/user-not-found") msgElem.textContent = "No user found with this email.";
    else if (err.code === "auth/wrong-password") msgElem.textContent = "Incorrect password.";
    else msgElem.textContent = "Login failed: " + err.message;
  } finally {
    // ===== Re-enable the button, hide spinner and reset text =====
    loginBtn.disabled = false;
    spinner.style.display = "none";  // Hide spinner
    loginBtn.textContent = "Login";  // Reset button text
  }
});
