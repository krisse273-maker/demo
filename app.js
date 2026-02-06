// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

// Init Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ===== Kolla om användaren är bannad =====
auth.onAuthStateChanged((user) => {
  if (!user) return;

  db.collection("users").doc(user.uid).onSnapshot((docSnap) => {
    if (!docSnap.exists) return;
    const data = docSnap.data();

    if (data.banned === true) {
      auth.signOut().then(() => window.location.href = "login.html");
    }
  });
});

// All DOM-manipulation efter att innehållet är klart
window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const welcomeMsg = document.getElementById("welcomeMsg");
  const foodTitle = document.getElementById("foodTitle");
  const adminPanel = document.getElementById("adminPanel");

  let countriesData = [];
  let allFoods = [];

  const countryFlags = {
    Sweden: "🇸🇪",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    Germany: "🇩🇪",
    France: "🇫🇷",
    Italy: "🇮🇹",
    Spain: "🇪🇸",
    Mexico: "🇲🇽",
    Japan: "🇯🇵",
    China: "🇨🇳",
    India: "🇮🇳"
  };

  // ===== Koppla nya navbar-länkar =====
  const logoutLink = document.getElementById("logoutLink");
  const myFoodLink = document.getElementById("myFoodLink");

  if (logoutLink) {
    logoutLink.onclick = () => auth.signOut().then(() => window.location.href = "login.html");
  }

  if (myFoodLink) {
    myFoodLink.onclick = () => window.location.href = "myfood.html";
  }

  // ===== Ladda länder =====
  async function loadCountries() {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countrySelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select country";
    countrySelect.appendChild(defaultOption);

    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = `${countryFlags[c.country] || ""} ${c.country}`;
      countrySelect.appendChild(opt);
    });
  }

  countrySelect.onchange = () => {
    citySelect.innerHTML = "";
    const defaultCity = document.createElement("option");
    defaultCity.value = "";
    defaultCity.textContent = "Select city";
    citySelect.appendChild(defaultCity);

    const country = countriesData.find(c => c.country === countrySelect.value);
    if (!country) return;

    country.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  };

  filterBtn.onclick = () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!country || f.country === country) &&
      (!city || f.city === city)
    );
    renderFoodItems(filtered);
  };

  // ===== Auth och UI setup =====
  auth.onAuthStateChanged(async user => {
    if (!user) return (window.location.href = "login.html");

    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists && userDoc.data().admin === true) {
      adminPanel.style.display = "block";
    }

    await loadCountries();
    loadGlobalFood(user);
    watchMute(user);
  });

  function loadGlobalFood(user) {
    db.collection("publicFoods")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            title: d.title,
            city: d.city,
            country: d.country,
            emoji: d.emoji || "🍽️",
            user:
              d.ownerId === user.uid
                ? user.displayName || user.email
                : d.userName || "Anonymous",
            timestamp: d.createdAt
          };
        });

        renderFoodItems(allFoods);
      });
  }

  function renderFoodItems(items) {
    foodList.innerHTML = "";

    if (!items.length) {
      const p = document.createElement("p");
      p.textContent = "No food found.";
      foodList.appendChild(p);
      return;
    }

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    items.forEach(item => {
      let dateStr = "";
      if (item.timestamp?.toDate) {
        const d = item.timestamp.toDate();
        dateStr = `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]}`;
      }

      const div = document.createElement("div");
      div.className = "food-item";

      const headerDiv = document.createElement("div");
      headerDiv.className = "food-header";

      const emojiSpan = document.createElement("span");
      emojiSpan.className = "title-emoji";
      emojiSpan.textContent = item.emoji;

      const h3 = document.createElement("h3");
      h3.textContent = item.title;

      headerDiv.appendChild(emojiSpan);
      headerDiv.appendChild(h3);

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "food-details";

      const locationP = document.createElement("p");
      locationP.textContent = `📍 ${item.city}, ${item.country}`;
      const userP = document.createElement("p");
      userP.textContent = `👤 ${item.user}`;

      detailsDiv.appendChild(locationP);
      detailsDiv.appendChild(userP);

      if (dateStr) {
        const dateP = document.createElement("p");
        dateP.textContent = `📅 ${dateStr}`;
        detailsDiv.appendChild(dateP);
      }

      div.appendChild(headerDiv);
      div.appendChild(detailsDiv);

      foodList.appendChild(div);
    });
  }

  function watchMute(user) {
    let shown = false;

    db.collection("users")
      .doc(user.uid)
      .onSnapshot(doc => {
        const data = doc.data();
        if (!data?.muteUntil) return;

        const until = data.muteUntil.toDate();
        if (until > new Date() && !shown) {
          shown = true;
          document.getElementById("alertMessage").textContent =
            `You are muted until ${until.toLocaleString()}`;
          document.getElementById("customAlertBackdrop").classList.remove("hidden");
        }
      });

    document.getElementById("alertOkBtn").onclick = () => {
      document.getElementById("customAlertBackdrop").classList.add("hidden");
    };
  }

  // Validering och add food
  document.getElementById("addFoodForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById("foodTitle");
    const emojiInput = document.getElementById("foodEmoji");
    const countryInput = document.getElementById("country");
    const cityInput = document.getElementById("city");

    const newFood = {
      title: titleInput.value,
      emoji: emojiInput.value,
      country: countryInput.value,
      city: cityInput.value
    };

    try {
      const validatedData = validateFoodData(newFood);
      await db.collection("publicFoods").add({
        ...validatedData,
        ownerId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert("Din matpost har lagts till!");
    } catch (error) {
      alert(error.message);
    }
  });

  function validateFoodData(data) {
    if (!data.title || data.title.trim() === "") throw new Error("Titel är obligatoriskt");
    data.title = sanitizeString(data.title);

    if (!data.country || data.country.trim() === "") throw new Error("Välj ett land");
    data.country = sanitizeString(data.country);

    if (!data.city || data.city.trim() === "") throw new Error("Välj en stad");
    data.city = sanitizeString(data.city);

    if (!isValidEmoji(data.emoji)) data.emoji = "🍽️";
    data.emoji = sanitizeString(data.emoji);

    return data;
  }

  function sanitizeString(str) {
    const temp = document.createElement("div");
    temp.textContent
