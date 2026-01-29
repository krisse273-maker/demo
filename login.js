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

    // Spara användarnamn och e-post i localStorage
    localStorage.setItem("currentUser", JSON.stringify({
      email: user.email,
      name: user.displayName || "Anonymous"  // Om användaren inte har ett displayName, använd "Anonymous"
    }));

    // Skicka användaren till index.html eller annan sida
    window.location.href = "index.html";
  } catch (err) {
    msgElem.textContent = err.message;
  }
});
