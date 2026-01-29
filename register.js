// Vänta på att Firebase är klart
document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  // Hantera användarregistrering
  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Kolla om alla fält är fyllda
    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Skapa användare via Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Uppdatera displayName i Firebase Auth
      await user.updateProfile({
        displayName: name,
      });

      console.log("Updated displayName:", user.displayName);

      // Spara användardata i Firestore under users/{uid}
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Skicka användaren direkt till myfood.html
      window.location.href = "myfood.html";
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
