document.addEventListener("DOMContentLoaded", () => {

  // =====================================
  // Hämta element
  // =====================================
  const headerP = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const homeBtn = document.getElementById("homeBtn");
  const myFoodList = document.querySelector(".my-food-list");
  const addFoodForm = document.getElementById("addFoodForm");
  const emojiPickerBtn = document.getElementById("emojiPickerBtn");
  const emojiPicker = document.getElementById("emojiPicker");
  const foodTitleInput = document.getElementById("foodTitle");
  const foodCountrySelect = document.getElementById("foodCountry");
  const foodCitySelect = document.getElementById("foodCity");

  if (!addFoodForm || !foodTitleInput) {
    console.error("Form or foodTitle input not found in DOM!");
    return;
  }

  // =====================================
  // Firebase init
  // =====================================
  const firebaseConfig = {
    apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
    authDomain: "global-food-share.firebaseapp.com",
    projectId: "global-food-share",
    storageBucket: "global-food-share.appspot.com",
    messagingSenderId: "902107453892",
    appId: "1:902107453892:web:dd9625974b8744cc94ac91"
  };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  let firebaseUser = null;
  let currentUserName = "Anonymous"; // Default
  let selectedEmoji = "";
  let myFoods = [];
  let countriesData = [];

  // =====================================
  // Auth state
  // =====================================
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    firebaseUser = user;

    // Hämta displayName från Firestore
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists && userDoc.data().name) {
        currentUserName = userDoc.data().name;  // Om användaren har ett namn sparat i Firestore
      } else if (user.displayName) {
        currentUserName = user.displayName;  // Om användaren har ett displayName sparat i Auth
      }
    } catch (err) {
      console.error("Failed to get user displayName from Firestore:", err);
    }

    headerP.textContent = `Welcome, ${currentUserName}! Here’s your food list.`;
    await loadUserFoods();
  });

  logoutBtn?.addEventListener("click", () => {
    firebase.auth().signOut();
    window.location.href = "login.html";
  });

  homeBtn?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // =====================================
  // Ladda användarens mat
  // =====================================
  async function loadUserFoods() {
    if (!firebaseUser) return;
    try {
      const snapshot = await db.collection("foods")
                               .doc(firebaseUser.uid)
                               .collection("items")
                               .orderBy("createdAt", "desc")
                               .get();
      myFoods = snapshot.docs.map(doc => doc.data());
      renderMyFoods();
    } catch(err) {
      console.error("Failed to load user foods:", err);
    }
  }

  // =====================================
  // Rendera matlistan
  // =====================================
  function renderMyFoods() {
    myFoodList.innerHTML = "";
    if (!myFoods.length) {
      myFoodList.innerHTML = `<p class="no-food">You don't have any food listed yet.</p>`;
      return;
    }
    myFoods.forEach(food => {
      const div = document.createElement("div");
      div.classList.add("food-item");
      div.innerHTML = `
        <span class="icon">${food.emoji}</span>
        <h3>${food.title}</h3>
        <p>${food.city}, ${food.country}</p>
        <p>Shared by: ${food.user}</p> <!-- Här används displayName -->
        <p>Posted: ${food.createdAt.toDate().toLocaleDateString()}</p>
      `;
      myFoodList.appendChild(div);
    });
  }

});
