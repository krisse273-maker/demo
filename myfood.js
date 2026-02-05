// ===== Firebase setup =====
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91",
  measurementId: "G-S1G7JY0TH5",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ===== DOM Elements =====
const emojiPickerBtn = document.getElementById("emojiPickerBtn");
const emojiPicker = document.getElementById("emojiPicker");
const foodTitle = document.getElementById("foodTitle");
const foodCountry = document.getElementById("foodCountry");
const foodCity = document.getElementById("foodCity");
const addFoodForm = document.getElementById("addFoodForm");
const foodListContainer = document.querySelector(".my-food-list");
const publicFoodListContainer = document.querySelector(".public-food-list");
const logoutBtn = document.getElementById("logoutBtn");
const homeBtn = document.getElementById("homeBtn");

const titleError = document.getElementById("titleError");
const emojiError = document.getElementById("emojiError");
const countryError = document.getElementById("countryError");
const cityError = document.getElementById("cityError");

let selectedEmoji = "";
let countriesData = [];
let currentUserData = null;
let userDocUnsubscribe = null;

// ===== Navigation =====
logoutBtn.onclick = async () => {
  await auth.signOut();
  window.location.href = "../login.html";
};
homeBtn.onclick = () => window.location.href = "../index.html";

// ===== Emoji picker =====
emojiPickerBtn.onclick = () => {
  emojiPicker.style.display = emojiPicker.style.display === "flex" ? "none" : "flex";
};
emojiPicker.querySelectorAll("span").forEach(span => {
  span.onclick = () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.style.display = "none";
    emojiError.style.display = "none";
  };
});

// ===== Load countries and cities =====
async function loadCountries() {
  const res = await fetch("https://countriesnow.space/api/v0.1/countries");
  const data = await res.json();
  countriesData = data.data;

  foodCountry.innerHTML = `<option value="">Select Country</option>`;
  countriesData.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.country;
    opt.textContent = c.country;
    foodCountry.appendChild(opt);
  });
}

foodCountry.onchange = () => {
  foodCity.innerHTML = `<option value="">Select City</option>`;
  foodCity.disabled = true;

  const c = countriesData.find(c => c.country === foodCountry.value);
  if (!c || !c.cities) return;

  c.cities.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    foodCity.appendChild(opt);
  });

  foodCity.disabled = false;
};

loadCountries();

// ===== User listener =====
function setupUserListener() {
  const user = auth.currentUser;
  if (!user) return;
  if (userDocUnsubscribe) userDocUnsubscribe();

  userDocUnsubscribe = db.collection("users").doc(user.uid)
    .onSnapshot(doc => {
      currentUserData = doc.data();
      if (currentUserData?.banned) {
        alert("You are banned.");
        auth.signOut().then(() => window.location.href = "../index.html");
      }
    });
}

// ===== Validation =====
function validateTitle(title) {
  if (!title || title.trim() === "") return "Title cannot be empty";
  if (title.length < 5) return "Title must be at least 5 characters long";
  if (title.length > 15) return "Title cannot be longer than 15 characters";
  if (/[<>\/()=]/.test(title)) return "Title contains invalid characters: < > / ( ) =";
  return null;
}

// ===== Add Food =====
addFoodForm.onsubmit = async e => {
  e.preventDefault();

  // Reset errors
  titleError.textContent = "";
  emojiError.style.display = "none";
  countryError.textContent = "";
  cityError.textContent = "";

  const title = foodTitle.value.trim();

  let hasError = false;
  const titleErr = validateTitle(title);
  if (titleErr) { titleError.textContent = titleErr; hasError = true; }
  if (!selectedEmoji) { emojiError.style.display = "block"; hasError = true; }
  if (!foodCountry.value) { countryError.textContent = "Please select a country"; hasError = true; }
  if (!foodCity.value) { cityError.textContent = "Please select a city"; hasError = true; }

  if (hasError) return;

  const user = auth.currentUser;
  if (!user) return;

  const foodRef = db.collection("foods").doc(user.uid).collection("items").doc();
  const foodId = foodRef.id;

  const foodData = {
    title,
    emoji: selectedEmoji,
    country: foodCountry.value,
    city: foodCity.value,
    type: "meal",
    ownerId: user.uid,
    userName: user.displayName || user.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  await foodRef.set(foodData);
  await db.collection("publicFoods").doc(foodId).set({
    ...foodData,
    publishedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  addFoodForm.reset();
  emojiPickerBtn.textContent = "Select your food Emoji";
  selectedEmoji = "";

  loadFoodList();
  loadPublicFoods();
};

// ===== Load Private Foods =====
async function loadFoodList() {
  const user = auth.currentUser;
  if (!user) return;

  foodListContainer.innerHTML = "";
  const snap = await db.collection("foods").doc(user.uid).collection("items").orderBy("createdAt", "desc").get();

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "food-item";

    const del = document.createElement("span");
    del.textContent = "×";
    del.className = "delete-icon";

    // === Ändrat: Ta bort confirm popup ===
    del.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await db.collection("foods").doc(user.uid).collection("items").doc(docSnap.id).delete();
      await db.collection("publicFoods").doc(docSnap.id).delete();

      loadFoodList();
      loadPublicFoods();
    };

    div.textContent = `${data.emoji} ${data.title}`;
    div.appendChild(del);
    foodListContainer.appendChild(div);
  });
}

// ===== Load Public Foods =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;
  publicFoodListContainer.innerHTML = "";

  const snap = await db.collection("publicFoods").orderBy("publishedAt", "desc").get();
  snap.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.textContent = `${d.emoji} ${d.title} by ${d.userName}`;
    publicFoodListContainer.appendChild(div);
  });
}

// ===== Init =====
auth.onAuthStateChanged(user => {
  if (user) {
    setupUserListener();
    loadFoodList();
    loadPublicFoods();
  }
});
