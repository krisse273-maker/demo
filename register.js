document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Kontrollera att alla fält är ifyllda
    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Uppdatera displayName i Firebase Auth
      await user.updateProfile({ displayName: name });

      // Hämta den uppdaterade användarprofilen för att säkerställa att displayName är satt
      await user.reload();  // Hämta den senaste versionen av användarprofilen från Firebase Auth
      if (!user.displayName) {
        throw new Error("Failed to set displayName in Firebase Auth");
      }

      console.log("Updated displayName:", user.displayName);

      // Skicka användaren till myfood.html efter registrering
      window.location.href = "myfood.html";
      
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
