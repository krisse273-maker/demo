document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Uppdatera displayName i Auth
      await user.updateProfile({ displayName: name });

      console.log("Updated displayName:", user.displayName);

      // 🔹 Vänta på att Firestore-dokumentet sparas
      const userRef = firebase.firestore().collection("users").doc(user.uid);
      await userRef.set({
        name: name,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 🔹 Hämta tillbaka dokumentet för säkerhets skull (garanterar att data finns)
      const savedDoc = await userRef.get();
      if (!savedDoc.exists) throw new Error("Failed to save user document.");

      // Skicka användaren först nu
      window.location.href = "myfood.html";
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
