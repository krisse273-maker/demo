import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =========================
   Firebase config
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.firebasestorage.app",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   UI elements
========================= */
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const goRegisterBtn = document.getElementById("goRegisterBtn");
const spinner = document.getElementById("spinner");

/* =========================
   Message element (safe)
========================= */
const msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
document.querySelector(".login-form").appendChild(msgElem);

/* =========================
   Banned flag (session)
========================= */
if (sessionStorage.getItem("banned") === "true") {
  msgElem.textContent = "You are banned from this service.";
  sessionStorage.removeItem("banned");
}

/* =========================
   Helpers: input styles
========================= */
function setValid(input) {
  input.style.borderColor = "#69f0ae";
}

function setInvalid(input) {
  input.style.borderColor = "#ef5350";
}

/* =========================
   Live validation
========================= */
function validateEmail() {
  const val = emailInput.value.trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  ok ? setValid(emailInput) : setInvalid(emailInput);
  return ok;
}

function validatePassword() {
  const ok = passwordInput.value.length >= 6;
  ok ? setValid(passwordInput) : setInvalid(passwordInput);
  return ok;
}

emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);

/* =========================
   Firebase error mapping
========================= */
function mapAuthError(err) {
  switch (err.code) {
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Wrong email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Login failed. Please try again.";
  }
}

/* =========================
   LOGIN
========================= */
loginBtn.addEventListener("click", async () => {
  msgElem.textContent = "";

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  const valid =
    validateEmail() &
    validatePassword();

  if (!valid) {
    msgElem.textContent = "Please fix the highlighted fields.";
    return;
  }

  loginBtn.disabled = true;
  spinner.style.display = "block";
  document.getElementById("btnText").textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.banned === true) {
        sessionStorage.setItem("banned", "true");
        await signOut(auth);
        window.location.href = "login.html";
        return;
      }
    } else {
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || "Anonymous",
        createdAt: new Date()
      });
    }

    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    msgElem.textContent = mapAuthError(err);
    setInvalid(passwordInput);
  } finally {
    loginBtn.disabled = false;
    spinner.style.display = "none";
    document.getElementById("btnText").textContent = "Login";
  }
});

/* =========================
   Go to register
========================= */
if (goRegisterBtn) {
  goRegisterBtn.addEventListener("click", () => {
    window.location.href = "register.html";
  });
}
