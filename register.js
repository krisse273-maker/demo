// ===== Firebase och annat är som innan =====
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const togglePasswordBtn = document.getElementById("togglePassword");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  const passwordLengthError = document.getElementById("passwordLengthError");
  const uppercaseNumberError = document.getElementById("uppercaseNumberError");

  // ===== Funktionskontroller =====
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  function hasUppercaseAndNumber(password) {
    return /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  // ===== Toggle password visibility =====
  if (togglePasswordBtn && passwordInput && confirmPasswordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";
      confirmPasswordInput.type = isVisible ? "password" : "text";
      togglePasswordBtn.textContent = isVisible ? "OFF" : "ON";
    });
  }

  // ===== Inline felhantering =====
  function clearPasswordErrors() {
    passwordLengthError.style.display = "none";
    uppercaseNumberError.style.display = "none";
  }

  passwordInput.addEventListener("input", clearPasswordErrors);
  confirmPasswordInput.addEventListener("input", clearPasswordErrors);

  function showPasswordError(message) {
    passwordLengthError.style.display = "none";
    uppercaseNumberError.style.display = "none";

    if (message === "length") {
      passwordLengthError.style.display = "block";
    } else if (message === "uppercaseNumber") {
      uppercaseNumberError.style.display = "block";
    }
  }

  // ===== Register-knapp =====
  registerBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    clearPasswordErrors();

    let hasError = false;

    // Grundkontroller
    if (!name || !email || !password || !confirmPassword) {
      if (!name) nameInput.style.borderColor = "red";
      if (!email) emailInput.style.borderColor = "red";
      if (!password) passwordInput.style.borderColor = "red";
      if (!confirmPassword) confirmPasswordInput.style.borderColor = "red";
      return;
    } else {
      nameInput.style.borderColor = "";
      emailInput.style.borderColor = "";
      passwordInput.style.borderColor = "";
      confirmPasswordInput.style.borderColor = "";
    }

    if (!isValidName(name)) {
      nameInput.style.borderColor = "red";
      hasError = true;
    }

    if (!isValidEmail(email) || email.length > 100) {
      emailInput.style.borderColor = "red";
      hasError = true;
    }

    if (password !== confirmPassword) {
      passwordInput.style.borderColor = "red";
      confirmPasswordInput.style.borderColor = "red";
      hasError = true;
    }

    if (!hasUppercaseAndNumber(password)) {
      showPasswordError("uppercaseNumber");
      passwordInput.style.borderColor = "red";
      confirmPasswordInput.style.borderColor = "red";
      hasError = true;
    } else if (password.length < 6) {
      showPasswordError("length");
      passwordInput.style.borderColor = "red";
      confirmPasswordInput.style.borderColor = "red";
      hasError = true;
    }

    if (hasError) return;

    // ===== Firebase-registration =====
    registerBtn.disabled = true;
    registerBtn.textContent = "Registering...";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);
      // Om du vill kan du visa ett generellt inline-fel här
      emailInput.style.borderColor = "red";
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register / Enter App";
    }
  });
});
