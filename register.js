// register.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// ===== Register-logik + UI =====
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const goLoginBtn = document.getElementById("goLoginBtn");

  // Gå till login page
  goLoginBtn.addEventListener("click", () => window.location.href = "login.html");

  // Toggle password visibility
  togglePasswordBtn.addEventListener("click", () => {
    const isVisible = passwordInput.type === "text";
    passwordInput.type = isVisible ? "password" : "text";
    confirmPasswordInput.type = isVisible ? "password" : "text";
    togglePasswordBtn.textContent = isVisible ? "OFF" : "ON";
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  // Ny funktion: kolla 1 stor bokstav och 1 siffra
  function hasUppercaseAndNumber(password) {
    return /^(?=.*[A-Z])(?=.*\d).+$/.test(password);
  }

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Alla fält ifyllda?
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }

    // Namn validering
    if (!isValidName(name)) {
      alert("Name must be 1-15 characters and contain only letters and numbers.");
      return;
    }

    // Email validering
    if (!isValidEmail(email) || email.length > 100) {
      alert("Please enter a valid email address.");
      return;
    }

    // Lösenord matchar confirm?
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Minst 6 tecken
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    // Minst 1 stor bokstav och 1 siffra
    if (!hasUppercaseAndNumber(password)) {
      alert("Password must contain at least 1 uppercase letter and 1 number.");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";

    try {
      // Kontrollera unikt publicName
      const publicUsersRef = collection(db, "publicUsers");
      const q = query(publicUsersRef, where("publicName", "==", name.toLowerCase()));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("This name is already taken. Please choose another.");
        registerBtn.disabled = false;
        registerBtn.textContent = "Register / Enter App";
        return;
      }

      // Skapa användare
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await Promise.all([
        setDoc(doc(db, "users", user.uid), {
          name: name,
          publicName: name.toLowerCase(),
          email,
          createdAt: serverTimestamp()
        }),
        setDoc(doc(db, "publicUsers", user.uid), { publicName: name.toLowerCase() }),
        updateProfile(user, { displayName: name })
      ]);

      window.location.href = "index.html";

    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "auth/email-already-in-use") alert("This email already exists.");
      else if (error.code === "auth/invalid-email" || /badly formatted/.test(error.message)) alert("Please enter a valid email address.");
      else if (error.code === "auth/weak-password") alert("Password must be at least 6 characters.");
      else alert("Registration failed. Please check your inputs.");
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register / Enter App";
    }
  });
});
