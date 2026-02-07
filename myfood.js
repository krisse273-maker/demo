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

const titleError = document.getElementById("titleError");
const emojiError = document.getElementById("emojiError");
const countryError = document.getElementById("countryError");
const cityError = document.getElementById("cityError");

// ===== Styling for validation =====
titleError.style.color = "red";
const style = document.createElement("style");
style.textContent = `
  .valid-title { border: 2px solid #00c853 !important; }
  .error-title { border: 2px solid red !important; }
  .shake { animation: shake 0.25s; }
  @keyframes shake { 0%{transform:translateX(0);}25%{transform:translateX(-4px);}50%{transform:translateX(4px);}75%{transform:translateX(-4px);}100%{transform:translateX(0);} }
`;
document.head.appendChild(style);

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
  emojiPicker.style.display =
    emojiPicker.style.display === "flex" ? "none" : "flex";
};
emojiPicker.querySelectorAll("span").forEach(span => {
  span.onclick = () => {
    selectedEmoji = span.textContent;
    emojiPickerBtn.textContent = selectedEmoji;
    emojiPicker.style.display = "none";
    emojiError.style.display = "none";
  };
});

// ===== TEST: Skapa ett land i Firestore om det inte finns =====
async function setupTestCountry() {
  const countryRef = db.collection("countries").doc("Afghanistan");
  const doc = await countryRef.get();
  if (!doc.exists) {
    await countryRef.set({
      country: "Afghanistan",
      cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad"]
    });
    console.log("Test country 'Afghanistan' skapad!");
  }
}

// ===== Load countries + cities med flaggor från countriesnow.space API =====
async function loadCountries() {
  // Rensa dropdowns
  foodCountry.textContent = "";
  foodCity.textContent = "";
  foodCity.disabled = true;

  // Lägg till default-optioner
  const defaultCountry = document.createElement("option");
  defaultCountry.value = "";
  defaultCountry.textContent = "Select Country";
  foodCountry.appendChild(defaultCountry);

  const defaultCity = document.createElement("option");
  defaultCity.value = "";
  defaultCity.textContent = "Select City";
  foodCity.appendChild(defaultCity);

  try {
    // Hämta länder + städer
    const resCountries = await fetch("https://countriesnow.space/api/v0.1/countries");
    const dataCountries = await resCountries.json();

    // Hämta flaggor
    const resFlags = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
    const dataFlags = await resFlags.json();

    // Kombinera länder, städer och flaggor
    countriesData = dataCountries.data.map(c => {
      const flagObj = dataFlags.data.find(f => f.name === c.country);
      return {
        country: c.country,
        cities: c.cities,
        flag: flagObj ? flagObj.flag : ""
      };
    });

    // Lägg till länder i dropdown
    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      foodCountry.appendChild(opt);
    });

    // När ett land väljs: fyll city och visa flagga
    foodCountry.addEventListener('change', () => {
      const selectedCountry = countriesData.find(c => c.country === foodCountry.value);

      // Rensa city-dropdown
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

      // Fyll cities
      selectedCountry.cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        foodCity.appendChild(opt);
      });
      foodCity.disabled = false;

      // Visa flagga i select
      if (selectedCountry.flag) {
        foodCountry.style.backgroundImage = `url(${selectedCountry.flag})`;
        foodCountry.style.backgroundSize = '20px 15px';
        foodCountry.style.backgroundRepeat = 'no-repeat';
        foodCountry.style.backgroundPosition = '5px center';
      } else {
        foodCountry.style.backgroundImage = 'none';
      }
    });

  } catch (err) {
    console.error("Failed to load countries or flags:", err);
  }
}

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
  customAlertBackdrop.classList.remove("hidden");
}
alertOkBtn?.addEventListener("click", () => {
  customAlertBackdrop.classList.add("hidden");
});

// ===== Validation =====
function validateTitle(title) {
  if (!title || title.trim() === "") return "Title cannot be empty";
  if (title.length < 5) return "Title must be at least 5 characters long";
  if (title.length > 15) return "Title cannot be longer than 15 characters";
  if (/[<>\/()=]/.test(title))
    return "Title contains invalid characters: < > / ( ) =";
  return null;
}

foodTitle.addEventListener("input", () => {
  const title = foodTitle.value.trim();
  const error = validateTitle(title);
  foodTitle.classList.remove("valid-title", "error-title", "shake");
  if (error) {
    titleError.textContent = error;
    foodTitle.classList.add("error-title");
    void foodTitle.offsetWidth;
    foodTitle.classList.add("shake");
  } else if (title.length > 0) {
    titleError.textContent = "";
    foodTitle.classList.add("valid-title");
  } else {
    titleError.textContent = "";
  }
});

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

  titleError.textContent = "";
  emojiError.style.display = "none";
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
    emojiError.style.display = "block";
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

  // Lägg till i privat lista
  await foodRef.set(foodData);
  // Lägg till i publicFoods
  await db.collection("publicFoods").doc(foodId).set({
    ...foodData,
    publishedAt: now,
  });

  addFoodForm.reset();
  foodTitle.classList.remove("valid-title", "error-title", "shake");
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

    del.onclick = async () => {
      try {
        const foodDocId = docSnap.id;

        // Ta bort från privatlista
        await db.collection("foods").doc(user.uid).collection("items").doc(foodDocId).delete();

        // Ta bort från publicFoods — rules tillåter bara ägaren
        await db.collection("publicFoods").doc(foodDocId).delete();

        loadFoodList();
        loadPublicFoods();
      } catch (err) {
        console.error("Failed to delete food:", err);
        showCustomAlert("Could not delete this food. Try again.");
      }
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

    (async () => {
      await setupTestCountry();
      await loadCountries();
      loadFoodList();
      loadPublicFoods();
    })();
  }
});
