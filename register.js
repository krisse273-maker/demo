// ===== Firebase och annat är som innan =====
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const togglePasswordBtn = document.getElementById("togglePassword");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Inline error spans
  const nameError = document.createElement("p");
  const emailError = document.createElement("p");
  const passwordLengthError = document.getElementById("passwordLengthError");
  const uppercaseNumberError = document.getElementById("uppercaseNumberError");

  [nameError, emailError].forEach(el => {
    el.classList.add("password-error");
    el.style.display = "none";
  });

  nameInput.insertAdjacentElement("afterend", nameError);
  emailInput.insertAdjacentElement("afterend", emailError);

  // ===== Validation functions =====
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

  // ===== Clear errors when typing =====
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener("input", () => {
      input.style.borderColor = "";
      if (input === nameInput) nameError.style.display = "none";
      if (input === emailInput) emailError.style.display = "none";
      if (input === passwordInput || input === confirmPasswordInput) {
        passwordLengthError.style.display = "none";
        uppercaseNumberError.style.display = "none";
      }
    });
  });

  // ===== Show password error =====
  function showPasswordError(message) {
    passwordLengthError.style.display = "none";
    uppercaseNumberError.style.display = "none";

    if (message === "length") {
      passwordLengthError.style.display = "block";
    } else if (message === "uppercaseNumber") {
      uppercaseNumberError.style.display = "block";
    }

    passwordInput.style.borderColor = "red";
    confirmPasswordInput.style.borderColor = "red";
  }

  // ===== Register button =====
  registerBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Clear all previous errors
    [nameError, emailError].forEach(el => (el.style.display = "none"));
    passwordLengthError.style.display = "none";
    uppercaseNumberError.style.display = "none";
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(
      el => (el.style.borderColor = "")
    );

    let hasError = false;

    // ===== Name validation =====
    if (!name) {
      nameError.textContent = "Name is required";
      nameError.style.display = "block";
      nameInput.style.borderColor = "red";
      hasError = true;
    } else if (!isValidName(name)) {
      nameError.textContent = "Name must be 1-15 letters or numbers";
      nameError.style.display = "block";
      nameInput.style.borderColor = "red";
      hasError = true;
    }

    // ===== Email validation =====
    if (!email) {
      emailError.textContent = "Email is required";
      emailError.style.display = "block";
      emailInput.style.borderColor = "red";
      hasError = true;
    } else if (!isValidEmail(email) || email.length > 100) {
      emailError.textContent = "Please enter a valid email";
      emailError.style.display = "block";
      emailInput.style.borderColor = "red";
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
    registerBtn.textContent = "Registering...";

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Registration error:", error);
      emailInput.style.borderColor = "red";
      emailError.textContent = "Registration failed. Check email or password";
      emailError.style.display = "block";
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Register / Enter App";
    }
  });
});
