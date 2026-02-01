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
const goRegisterBtn = document.getElementById("goRegisterBtn");
const spinner = document.getElementById("spinner");
const btnText = document.getElementById("btnText"); // ✅ Hämta textspan från HTML

// Meddelande-element
let msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
document.querySelector(".login-form").appendChild(msgElem);

// ===== LOGIN =====
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  msgElem.textContent = "";

  if (!email || !password) {
    msgElem.textContent = "Please fill in all fields!";
    return;
  }

  // Visa spinner och ändra knapptext
  loginBtn.disabled = true;
  spinner.style.display = "inline-block";
  btnText.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || "Anonymous",
        createdAt: new Date()
      });
    }

    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    if (err.code === "auth/user-not-found") msgElem.textContent = "No user found with this email.";
    else if (err.code === "auth/wrong-password") msgElem.textContent = "Incorrect password.";
    else msgElem.textContent = "Login failed: " + err.message;
  } finally {
    // Dölj spinner och återställ text
    loginBtn.disabled = false;
    spinner.style.display = "none";
    btnText.textContent = "Login";
  }
});

// ===== REGISTER / ENTER APP =====
if (goRegisterBtn) {
  goRegisterBtn.addEventListener("click", () => {
    window.location.href = "register.html";
  });
}
