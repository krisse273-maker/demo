// ================================
//            app.js
// ================================

// --- Kontrollera om användaren är inloggad ---
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser) {
  window.location.href = "login.html";
}

// --- Hälsa användaren ---
const headerP = document.getElementById("welcomeMsg");
headerP.textContent = `Welcome, ${currentUser.name}! Here’s your food list.`;

// --- Log out knapp ---
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", async () => {
  localStorage.removeItem("currentUser");
  await firebase.auth().signOut();
  window.location.href = "login.html";
});

// --- DOM-element ---
const myFoodList = document.querySelector(".my-food-list");
const addFoodForm = document.getElementById("addFoodForm");
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const foodTitleInput = document.getElementById("foodTitle");
const foodCountrySelect = document.getElementById("foodCountry");
const foodCitySelect = document.getElementById("foodCity");

// --- Mat-data ---
let myFoods = [];
let countriesData = [];
let firebaseUser = null; // håller auth-user
let selectedEmoji = "";

// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ================================
//         LÄNDER OCH STÄDER
// ================================
document.addEventListener("DOMContentLoaded", () => {
  loadCountries();
});

async function loadCountries() {
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countriesData.forEach((c) => {
      const option = document.createElement("option");
      option.value = c.country;
      option.textContent = c.country;
      foodCountrySelect.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to load countries:", err);
  }
}

foodCountrySelect.addEventListener("change", () => {
  const selectedCountry = foodCountrySelect.value;
  foodCitySelect.innerHTML = '<option value="">Select City</option>';
  foodCitySelect.disabled = true;

  if (!selectedCountry) return;

  const countryObj = countriesData.find((c) => c.country === selectedCountry);
  if (countryObj && countryObj.cities.length) {
    countryObj.cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      foodCitySelect.appendChild(option);
    });
    foodCitySelect.disabled = false;
  }
});

// ================================
//            EMOJI PICKER
// ================================
emojiPickerBtn.addEventListener("click", () => {
  emojiPicker.style.display = emojiPicker.style.display === "flex" ? "none" : "flex";
});

emojiPicker.addEventListener("click", (e) => {
  if (e.target.tagName.toLowerCase() === "span") {
    selectedEmoji = e.target.textContent;
    emojiPicker.style.display = "none";
    emojiPickerBtn.textContent = `Selected: ${selectedEmoji}`;
  }
});

// ================================
//         LÄGG TILL MAT
// ================================
addFoodForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedEmoji) return alert("Please select an emoji!");
  if (!firebaseUser) return alert("User not logged in");

  const newFood = {
    title: foodTitleInput.value,
    country: foodCountrySelect.value,
    city: foodCitySelect.value,
    emoji: selectedEmoji,
    user: currentUser.email,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const newDocRef = await db
      .collection("foods")
      .doc(firebaseUser.uid)
      .collection("items")
      .add(newFood);

    // Vänta tills server-timestamp är satt
    await db.doc(newDocRef.path).get();

    // Reset form
    addFoodForm.reset();
    selectedEmoji = "";
    emojiPickerBtn.textContent = "Select your food Emoji";
    foodCitySelect.disabled = true;

    await loadUserFoods();
    alert("Food item added successfully!");
  } catch (err) {
    console.error("Error adding food:", err);
    alert("Failed to add food!");
  }
});

// ================================
//       LÄS ANVÄNDARENS MAT
// ================================
async function loadUserFoods() {
  if (!firebaseUser) return;

  try {
    const snapshot = await db
      .collection("foods")
      .doc(firebaseUser.uid)
      .collection("items")
      .orderBy("timestamp", "desc")
      .get();

    myFoods = snapshot.docs.map((doc) => doc.data());
    console.log("Loaded foods:", myFoods);

    renderMyFoods();
  } catch (err) {
    console.error("Error loading foods:", err);
  }
}

// ================================
//          RENDER FUNKTION
// ================================
function renderMyFoods() {
  myFoodList.innerHTML = "";
  if (!myFoods.length) {
    myFoodList.innerHTML = `<p class="no-food">You don't have any food listed yet.</p>`;
    return;
  }

  myFoods.forEach((food) => {
    const div = document.createElement("div");
    div.classList.add("food-item");
    div.innerHTML = `
      <span class="icon">${food.emoji}</span>
      <h3>${food.title}</h3>
      <p>${food.city}, ${food.country}</p>
    `;
    myFoodList.appendChild(div);
  });
}

// ================================
//      VÄNTA PÅ FIREBASE AUTH
// ================================
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  firebaseUser = user;
  await loadUserFoods();
});
