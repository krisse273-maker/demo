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

// ===== Custom Alert Elements =====
const customAlertBackdrop = document.getElementById("customAlertBackdrop");
const alertMessage = document.getElementById("alertMessage");
const alertOkBtn = document.getElementById("alertOkBtn");

// ===== Styling for validation =====
const titleError = document.getElementById("titleError");
const emojiError = document.getElementById("emojiError");
const countryError = document.getElementById("countryError");
const cityError = document.getElementById("cityError");

let selectedEmoji = "";
let currentUserData = null;
let userDocUnsubscribe = null;
let countriesData = [];

// ===== Navigation =====
logoutBtn.onclick = async () => {
  await auth.signOut();
  window.location.href = "../login.html";
};
homeBtn.onclick = () => window.location.href = "../index.html";

// ===== Emoji picker =====
emojiPickerBtn.onclick = () => {
  emojiPicker.classList.toggle("show"); // ✅ använd klass, inte style.display
};

emojiPicker.querySelectorAll("span").forEach(span => {
  span.onclick = () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.classList.remove("show");      // ✅ göm pickern med klass
    emojiError.classList.add("hidden");        // ✅ göm valideringsfel med klass
  };
});

// ===== User listener + Mute check =====
function setupUserListener() {
  const user = auth.currentUser;
  if (!user) return;
  if (userDocUnsubscribe) userDocUnsubscribe();

  userDocUnsubscribe = db.collection("users").doc(user.uid)
    .onSnapshot(doc => {
      currentUserData = doc.data();
      if (currentUserData?.banned) {
        showCustomAlert("You are banned.");
        auth.signOut().then(() => window.location.href = "../index.html");
      }
      if (currentUserData?.muteUntil) {
        const muteUntilDate = currentUserData.muteUntil.toDate();
        if (muteUntilDate > new Date()) {
          showCustomAlert(`You are muted until ${muteUntilDate.toLocaleString()}`);
        }
      }
    });
}

// ===== Custom Alert Function =====
function showCustomAlert(msg) {
  if (!customAlertBackdrop || !alertMessage) return;
  alertMessage.textContent = msg;
  customAlertBackdrop.classList.add("show");    // ✅ visa med CSS-klass
}

alertOkBtn?.addEventListener("click", () => {
  customAlertBackdrop.classList.remove("show"); // ✅ göm med CSS-klass
});

// ===== Load countries + cities + flag from Firestore =====
// ===== Load countries + cities + flag from Firestore (med spinner) =====
async function loadCountries() {
  // ✅ Hitta spinnern
  const spinner = document.getElementById("countrySpinner");

  // ✅ Visa spinner och disable dropdown medan vi laddar
  spinner.classList.remove("hidden");
  foodCountry.disabled = true;
  foodCity.disabled = true;

  // ✅ Töm dropdowns och lägg till default-options
  foodCountry.textContent = "";
  foodCity.textContent = "";

  const defaultCountry = document.createElement("option");
  defaultCountry.value = "";
  defaultCountry.textContent = "Select Country";
  foodCountry.appendChild(defaultCountry);

  const defaultCity = document.createElement("option");
  defaultCity.value = "";
  defaultCity.textContent = "Select City";
  foodCity.appendChild(defaultCity);

  try {
    // ✅ Hämta länder från Firestore
    const snap = await db.collection("countries").orderBy("country").get();
    countriesData = snap.docs.map(doc => doc.data());

    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      foodCountry.appendChild(opt);
    });

    // ✅ Enable dropdown nu när data är laddad
    foodCountry.disabled = false;

    // ✅ När länderna är laddade, göm spinnern
    spinner.classList.add("hidden");

    // ===== Country change event =====
    foodCountry.addEventListener('change', () => {
      const selectedCountry = countriesData.find(c => c.country === foodCountry.value);

      foodCity.textContent = "";
      const defaultCityOption = document.createElement("option");
      defaultCityOption.value = "";
      defaultCityOption.textContent = "Select City";
      foodCity.appendChild(defaultCityOption);

      if (!selectedCountry) {
        foodCity.disabled = true;
        foodCountry.style.backgroundImage = 'none';
        return;
      }

      selectedCountry.cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        foodCity.appendChild(opt);
      });
      foodCity.disabled = false;
    });

  } catch (err) {
    console.error("Failed to load countries from Firestore:", err);

    // ✅ Om något går fel, göm spinner ändå
    spinner.classList.add("hidden");
  }
}


// ===== Validation =====
function validateTitle(title) {
  if (!title || title.trim() === "") return "Title cannot be empty";
  if (title.length < 5) return "Title must be at least 5 characters long";
  if (title.length > 15) return "Title cannot be longer than 15 characters";
  if (/[<>\/()=]/.test(title)) return "Title contains invalid characters: < > / ( ) =";
  return null;
}

function validateCountryAndCity(country, city) {
  const countryObj = countriesData.find(c => c.country === country);
  if (!countryObj) return "Invalid country selected";
  if (!countryObj.cities.includes(city)) return "Invalid city selected";
  return null;
}

// ===== Add Food =====
addFoodForm.onsubmit = async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  // ✅ göm alla fel först
  titleError.textContent = "";
  emojiError.classList.add("hidden");
  countryError.textContent = "";
  cityError.textContent = "";

  const title = foodTitle.value.trim();
  let hasError = false;

  const titleErr = validateTitle(title);
  if (titleErr) {
    titleError.textContent = titleErr;
    foodTitle.classList.add("error-title", "shake");
    hasError = true;
  }

  if (!selectedEmoji) {
    emojiError.textContent = "You need to select an emoji";
    emojiError.classList.remove("hidden"); //  visa fel med klass
    hasError = true;
  }

  if (!foodCountry.value) {
    countryError.textContent = "Please select a country";
    hasError = true;
  }
  if (!foodCity.value) {
    cityError.textContent = "Please select a city";
    hasError = true;
  }

  const countryCityError = validateCountryAndCity(foodCountry.value, foodCity.value);
  if (countryCityError) {
    if (countryCityError.includes("country")) countryError.textContent = countryCityError;
    if (countryCityError.includes("city")) cityError.textContent = countryCityError;
    hasError = true;
  }

  if (currentUserData?.muteUntil && currentUserData.muteUntil.toDate() > new Date()) {
    const muteUntilDate = currentUserData.muteUntil.toDate();
    showCustomAlert(`You are muted until ${muteUntilDate.toLocaleString()}`);
    return;
  }

  if (hasError) return;

  const foodRef = db.collection("foods").doc(user.uid).collection("items").doc();
  const foodId = foodRef.id;
  const now = firebase.firestore.Timestamp.now();

  const foodData = {
    title,
    emoji: selectedEmoji,
    country: foodCountry.value.trim(),
    city: foodCity.value.trim(),
    type: "food",
    ownerId: user.uid,
    userName: user.displayName || user.email,
    createdAt: now,
  };

  await foodRef.set(foodData);
  await db.collection("publicFoods").doc(foodId).set({
    ...foodData,
    publishedAt: now,
  });

  addFoodForm.reset();
  foodTitle.classList.remove("valid-title", "error-title", "shake");
  emojiPickerBtn.textContent = "Select your food Emoji";
  selectedEmoji = "";
  emojiError.classList.add("hidden"); // göm fel efter submit

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

    del.onclick = async () => {
      try {
        const foodDocId = docSnap.id;
        await db.collection("foods").doc(user.uid).collection("items").doc(foodDocId).delete();
        await db.collection("publicFoods").doc(foodDocId).delete();
        loadFoodList();
        loadPublicFoods();
      } catch (err) {
        console.error("Failed to delete food:", err);
        showCustomAlert("Could not delete this food. Try again.");
      }
    };

const info = document.createElement("div");
info.className = "food-info";
info.textContent = `${data.emoji} ${data.title}`;

div.appendChild(info);
div.appendChild(del);

const card = document.createElement("div");
card.className = "food-card";

card.appendChild(div);
foodListContainer.appendChild(card);


  });
}

// ===== Load Public Foods =====
// ===== Load Public Foods =====
async function loadPublicFoods() {
  if (!publicFoodListContainer) return;

  publicFoodListContainer.innerHTML = "";
  const snap = await db.collection("publicFoods").orderBy("publishedAt", "desc").get();

  snap.forEach(doc => {
    const d = doc.data();

    const div = document.createElement("div");
    div.className = "food-item";

    const info = document.createElement("div");
    info.className = "food-info";
    info.textContent = `${d.emoji} ${d.title} by ${d.userName}`;

    div.appendChild(info);
    publicFoodListContainer.appendChild(div);
  });
}


// ===== Init =====
auth.onAuthStateChanged(user => {
  if (user) {
    setupUserListener(); // ✅ nu finns funktionen
    loadCountries();
    loadFoodList();
    loadPublicFoods();
  }
});
