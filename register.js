// ===== Firebase setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// ===== DOMContentLoaded =====
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const goLoginBtn = document.getElementById("goLoginBtn");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const genderSelect = document.getElementById("gender");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const genderError = document.getElementById("genderError");
  const passwordLengthError = document.getElementById("passwordLengthError");
  const uppercaseNumberError = document.getElementById("uppercaseNumberError");

  const spinner = registerBtn.querySelector(".spinner");
  const btnText = registerBtn.querySelector("#btnText");

  // ===== Validation helpers =====
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Ny namnvalidering: endast bokstäver, min 5, max 15
  const isValidName = (name) => /^[a-zA-Z0-9]{5,15}$/.test(name);

  const hasUppercaseAndNumber = (pw) => /[A-Z]/.test(pw) && /[0-9]/.test(pw);

  // ===== Toggle password visibility =====
  togglePasswordBtn.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    confirmPasswordInput.type = type;
    togglePasswordBtn.textContent = type === "password" ? "👁️" : "🙈";
  });

  // ===== Clear errors on input =====
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener("input", () => {
      input.style.borderColor = "";
      nameError.classList.remove('show');
      emailError.classList.remove('show');
      passwordLengthError.classList.remove('show');
      uppercaseNumberError.classList.remove('show');
    });
  });

  genderSelect.addEventListener("change", () => {
    genderError.classList.remove('show');
    genderSelect.style.borderColor = "";
  });

  // ===== Show password error =====
  const showPasswordError = (type) => {
    passwordLengthError.classList.remove('show');
    uppercaseNumberError.classList.remove('show');

    if (type === "length") passwordLengthError.classList.add('show');
    if (type === "uppercaseNumber") uppercaseNumberError.classList.add('show');

    passwordInput.style.borderColor = "red";
    confirmPasswordInput.style.borderColor = "red";
  };

  // ===== Register button click =====
  registerBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const gender = genderSelect.value;

    let hasError = false;

    // Clear previous errors
    [nameError, emailError, genderError].forEach(el => el.classList.remove('show'));
    passwordLengthError.classList.remove('show');
    uppercaseNumberError.classList.remove('show');
    [nameInput, emailInput, passwordInput, confirmPasswordInput, genderSelect].forEach(el => el.style.borderColor = "");

    // ===== Name validation =====
    if (!name) {
      nameError.textContent = "Name is required";
      nameError.classList.add('show');
      nameInput.style.borderColor = "red";
      hasError = true;
    } else if (!isValidName(name)) {
      nameError.textContent = "Name must be 5-15 letters only";
      nameError.classList.add('show');
      nameInput.style.borderColor = "red";
      hasError = true;
    }

    // ===== Email validation =====
    if (!email) {
      emailError.textContent = "Email is required";
      emailError.classList.add('show');
      emailInput.style.borderColor = "red";
      hasError = true;
    } else if (!isValidEmail(email) || email.length > 100) {
      emailError.textContent = "Please enter a valid email";
      emailError.classList.add('show');
      emailInput.style.borderColor = "red";
      hasError = true;
    }

    // ===== Gender validation =====
    if (!gender) {
      genderError.textContent = "You need to choose Gender";
      genderError.classList.add('show');
      genderSelect.style.borderColor = "red";
      hasError = true;
    }

    // ===== Password validation =====
    if (!password || !confirmPassword) {
      if (!password) passwordInput.style.borderColor = "red";
      if (!confirmPassword) confirmPasswordInput.style.borderColor = "red";
      hasError = true;
    }

    if (password !== confirmPassword) {
      passwordInput.style.borderColor = "red";
      confirmPasswordInput.style.borderColor = "red";
      passwordLengthError.textContent = "Passwords do not match";
      passwordLengthError.classList.add('show');
      hasError = true;
    }

    if (!hasUppercaseAndNumber(password)) {
      showPasswordError("uppercaseNumber");
      hasError = true;
    } else if (password.length < 6) {
      showPasswordError("length");
      hasError = true;
    }

    if (hasError) return;

    // ===== Firebase registration =====
    registerBtn.disabled = true;
    spinner.style.display = "inline-block";
    btnText.textContent = "Registering...";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // ✅ Users document with required fields for Firestore rules
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        publicName: name.toLowerCase(),
        email: email,
        createdAt: serverTimestamp(),
        admin: false,
        banned: false,
        muteUntil: null
      });

      // Public users
      await setDoc(doc(db, "publicUsers", user.uid), {
        name: name,
        gender: gender
      });

      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);
      emailInput.style.borderColor = "red";

      // ===== Specific error handling =====
      if (error.code === "auth/email-already-in-use") {
        emailError.textContent = "This email already exists";
      } else if (error.code === "auth/invalid-email") {
        emailError.textContent = "Invalid email format";
      } else if (error.code === "auth/weak-password") {
        passwordLengthError.textContent = "Password is too weak (min 6 characters)";
        passwordLengthError.classList.add('show');
        emailError.textContent = "";
      } else {
        emailError.textContent = "Registration failed. Check email or password";
      }

      emailError.classList.add('show');
    } finally {
      registerBtn.disabled = false;
      spinner.style.display = "none";
      btnText.textContent = "Register";
    }
  });

  // ===== Login button click =====
  goLoginBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
});

