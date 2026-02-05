// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Initiera Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.addEventListener("DOMContentLoaded", async () => {
  const foodList = document.querySelector(".admin-food-list");
  const logoutBtn = document.getElementById("logoutBtn");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const usersBtn = document.getElementById("usersBtn");

  // Logga ut
  logoutBtn.addEventListener("click", () => {
    auth.signOut()
      .then(() => window.location.href = "../index.html")
      .catch(err => console.error("Logout error:", err));
  });

  // Navigera till Users-sidan
  usersBtn.addEventListener("click", () => {
    window.location.href = "user.html";
  });

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = "../login.html";

    let userDoc;
    try {
      userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists || !userDoc.data()?.admin) {
        alert("Access denied! Only admins can access this page.");
        return window.location.href = "../index.html";
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      alert("Failed to verify admin. Try logging in again.");
      return window.location.href = "../login.html";
    }

    // Sätt välkomsttext med sanering
    const adminName = userDoc.data().name || "Admin";
    welcomeMsg.textContent = `Welcome, ${adminName}!`;

    // Loader
    foodList.innerHTML = "";
    const loader = document.createElement("p");
    loader.textContent = "Loading meals...";
    foodList.appendChild(loader);

    // Ladda publicFoods
    db.collection("publicFoods").orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        foodList.innerHTML = "";
        if (snapshot.empty) {
          foodList.textContent = "No meals shared yet.";
          return;
        }

        const fragment = document.createDocumentFragment();

        snapshot.docs.forEach(doc => {
          const data = doc.data();

          // Sanera data innan användning
          const title = data.title || "";
          const emoji = data.emoji || "🍽️";
          const city = data.city || "";
          const country = data.country || "";
          const userName = data.userName || "Anonymous";

          const div = document.createElement("div");
          div.className = "food-item";

          const header = document.createElement("div");
          header.className = "food-header";

          const emojiSpan = document.createElement("span");
          emojiSpan.textContent = emoji;

          const h3 = document.createElement("h3");
          h3.textContent = title;

          header.appendChild(emojiSpan);
          header.appendChild(h3);

          const details = document.createElement("div");
          details.className = "food-details";

          const locationP = document.createElement("p");
          const locationIcon = document.createElement("span");
          locationIcon.className = "icon-small";
          locationIcon.textContent = "📍";
          locationP.appendChild(locationIcon);
          const locationStrong = document.createElement("strong");
          locationStrong.textContent = "Location:";
          locationP.appendChild(locationStrong);
          locationP.appendChild(document.createTextNode(` ${city}, ${country}`));

          const userP = document.createElement("p");
          const userIcon = document.createElement("span");
          userIcon.className = "icon-small";
          userIcon.textContent = "👤";
          userP.appendChild(userIcon);
          const userStrong = document.createElement("strong");
          userStrong.textContent = "Published By:";
          userP.appendChild(userStrong);
          userP.appendChild(document.createTextNode(` ${userName}`));

          details.appendChild(locationP);
          details.appendChild(userP);

          // Delete-knapp
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "delete-btn";
          deleteBtn.textContent = "Delete";
          deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
            try {
              await db.collection("publicFoods").doc(doc.id).delete();
              alert(`"${title}" deleted!`);
            } catch (err) {
              console.error("Error deleting food:", err);
              alert("Failed to delete this meal.");
            }
          });

          div.appendChild(header);
          div.appendChild(details);
          div.appendChild(deleteBtn);

          fragment.appendChild(div);
        });

        foodList.appendChild(fragment);
      }, err => {
        console.error("Error fetching publicFoods:", err);
        foodList.textContent = "Failed to load meals.";
      });
  });
});
