const loginBtn = document.getElementById("loginBtn");

let msgElem = document.createElement("p");
msgElem.style.color = "red";
msgElem.style.textAlign = "center";
msgElem.style.marginTop = "0.5rem";
document.querySelector(".login-form").appendChild(msgElem);

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  msgElem.textContent = "";

  if (!email || !password) {
    msgElem.textContent = "Please fill in all fields!";
    return;
  }

  try {
    // Logga in användaren med e-post och lösenord
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Hämta användarens data från Firestore (om du har sparat något där)
    const userRef = firebase.firestore().collection('users').doc(user.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Användarinformation finns i Firestore
      const userData = userDoc.data();
      console.log("User data from Firestore: ", userData);
    } else {
      // Om användaren inte har något dokument i Firestore, skapa ett nytt
      await userRef.set({
        email: user.email,
        name: user.displayName || "Anonymous"
      });
    }

    // Skicka användaren till index.html eller annan sida
    window.location.href = "index.html";
  } catch (err) {
    msgElem.textContent = err.message;
  }
});
