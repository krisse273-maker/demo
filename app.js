// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974cc94ac91"
};

//Init Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// ===== Kolla om användaren är bannad =====
auth.onAuthStateChanged((user) => {
  if (!user) return; // Om ingen är inloggad, gör inget

  db.collection("users").doc(user.uid).onSnapshot((docSnap) => {
    if (!docSnap.exists) return;
    const data = docSnap.data();

    if (data.banned === true) {
      // Skicka direkt till login.html
      auth.signOut().then(() => window.location.href = "login.html");
    }
  });
});

window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
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

  logoutBtn.onclick = () =>
    auth.signOut().then(() => (window.location.href = "login.html"));

  myFoodBtn.onclick = () => (window.location.href = "myfood.html");

  async function loadCountries() {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    // Rensa countrySelect och lägg till default
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
    // Rensa och lägg till default för city
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
    // Rensa listan
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

      // Skapa header-div
      const headerDiv = document.createElement("div");
      headerDiv.className = "food-header";

      const emojiSpan = document.createElement("span");
      emojiSpan.className = "title-emoji";
      emojiSpan.textContent = item.emoji;

      const h3 = document.createElement("h3");
      h3.textContent = item.title;

      headerDiv.appendChild(emojiSpan);
      headerDiv.appendChild(h3);

      // Skapa detaljer-div
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "food-details";

      // Lägg till plats
      const locationP = document.createElement("p");
      locationP.textContent = `📍 ${item.city}, ${item.country}`;

      // Lägg till publicerare
      const userP = document.createElement("p");
      userP.textContent = `👤 ${item.user}`;

      detailsDiv.appendChild(locationP);
      detailsDiv.appendChild(userP);

      // Lägg till datum om finns
      if (dateStr) {
        const dateP = document.createElement("p");
        dateP.textContent = `📅 ${dateStr}`;
        detailsDiv.appendChild(dateP);
      }

      // Lägg till header och details i huvuddiven
      div.appendChild(headerDiv);
      div.appendChild(detailsDiv);

      // Lägg till i listan
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

  // Här kan du lägga till funktionen för att skapa en ny matpost
  // Exempel: ett formulär eller knapp
  // Jag visar ett exempel på hur du kan använda valideringen:

  // Antag du har ett formulär med id "addFoodForm"
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
      // Lägg till i Firestore
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

  // Valideringsfunktion samt sanitization
  function validateFoodData(data) {
    // Kontrollera att titel inte är tom eller innehåller farliga tecken
    if (!data.title || data.title.trim() === "") {
      throw new Error("Titel är obligatoriskt");
    }
    // Sanera titel
    data.title = sanitizeString(data.title);

    // Kontrollera att country är vald
    if (!data.country || data.country.trim() === "") {
      throw new Error("Välj ett land");
    }
    data.country = sanitizeString(data.country);

    // Kontrollera att city är vald
    if (!data.city || data.city.trim() === "") {
      throw new Error("Välj en stad");
    }
    data.city = sanitizeString(data.city);

    // Validera emoji (enkel check)
    if (!isValidEmoji(data.emoji)) {
      // Om inte giltig, sätt till standard
      data.emoji = "🍽️";
    }
    // Sanera emoji
    data.emoji = sanitizeString(data.emoji);

    return data;
  }

  // Funktion för att sanera strängar
  function sanitizeString(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerText;
  }

  // Enkel emoji-validering
  function isValidEmoji(emoji) {
    const emojiRegex = /[\p{Emoji}]/u;
    return emojiRegex.test(emoji);
  }
});
