document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("registerBtn");

  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Kolla att alla fält är fyllda
    if (!name || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      // 0️⃣ Kontrollera om namnet redan finns i Firestore
      const usersRef = firebase.firestore().collection("users");
      const nameQuery = await usersRef.where("name", "==", name).get();
      if (!nameQuery.empty) {
        alert("This name is already taken. Please choose another.");
        return;
      }

      // 1️⃣ Skapa användare i Firebase Auth
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // 2️⃣ Sätt displayName för Auth-användaren
      await user.updateProfile({ displayName: name });

      // 3️⃣ Skapa Firestore-dokument för användaren
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // 4️⃣ Skicka användaren till index.html istället för myfood.html
      window.location.href = "index.html";

    } catch (error) {
      console.error("Error during registration:", error);
      alert("Registration failed: " + error.message);
    }
  });
});
