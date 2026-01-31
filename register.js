document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  // Funktion för enkel email-validering
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Funktion för name-validering: max 15 tecken, bara bokstäver och siffror
  function isValidName(name) {
    return /^[a-zA-Z0-9]{1,15}$/.test(name);
  }

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
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

    // Kontrollera email
    if (!isValidEmail(email) || email.length > 100) {
      alert("Please enter a valid email address (max 100 characters).");
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

      // Visa förenklat felmeddelande för email och annat
      if (error.code === "auth/email-already-in-use") {
        alert("This email already exists.");
      } else {
        alert("Registration failed: " + error.message);
      }
    }
  });
});
