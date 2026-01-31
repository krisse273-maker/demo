document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");
  const passwordInput = document.getElementById("password");

  // Skapa ett p-element för felmeddelande under passwordfältet
  let passwordError = document.createElement("p");
  passwordError.id = "passwordError";
  passwordError.style.color = "red";
  passwordError.style.display = "none";
  passwordError.textContent = "Password must be at least 6 characters.";
  passwordInput.insertAdjacentElement("afterend", passwordError);

  // Funktion för enkel email-validering
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Funktion för name-validering: max 15 tecken, bara bokstäver och siffror
  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  // Lyssna på input för password och visa röd text om för kort
  passwordInput.addEventListener("input", () => {
    if (passwordInput.value.length < 6) {
      passwordError.style.display = "block";
    } else {
      passwordError.style.display = "none";
    }
  });

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Kolla att alla fält är fyllda
    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }

    // Kontrollera name
    if (!isValidName(name)) {
      alert("Name must be 1-15 characters and contain only letters and numbers.");
      return;
    }

    // Kontrollera email innan Firebase
    if (!isValidEmail(email) || email.length > 100) {
      alert("Please enter a valid email address.");
      return;
    }

    // Kontrollera password längd
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    // Kontrollera password match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Maxlängd password
    if (password.length > 128) {
      alert("Password must be 128 characters or less.");
      return;
    }

    try {
      // Kontrollera om namnet redan finns i Firestore (case-insensitive)
      const usersRef = firebase.firestore().collection("users");
      const nameQuery = await usersRef
        .where("publicName", "==", name.toLowerCase())
        .get();

      if (!nameQuery.empty) {
        alert("This name is already taken. Please choose another.");
        return;
      }

      // Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Sätt displayName för Auth-användaren
      await user.updateProfile({ displayName: name });

      // Skapa Firestore-dokument för användaren
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        publicName: name.toLowerCase(),
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Skicka användaren till index.html
      window.location.href = "index.html";

    } catch (error) {
      console.error("Error during registration:", error);

      // Visa förenklade felmeddelanden
      if (error.code === "auth/email-already-in-use") {
        alert("This email already exists.");
      } else if (
        error.code === "auth/invalid-email" ||
        /badly formatted/.test(error.message)
      ) {
        alert("Please enter a valid email address.");
      } else {
        alert("Registration failed. Please check your inputs.");
      }
    }
  });
});
