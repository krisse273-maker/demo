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

// =========================
// Skapa countries collection med Afghanistan (om den inte finns)
// =========================
async function createCountriesCollection() {
  const afghanistanDoc = await db.collection("countries").doc("Afghanistan").get();
  if (!afghanistanDoc.exists) {
    await db.collection("countries").doc("Afghanistan").set({
      cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad"]
    });
    console.log("Countries collection med Afghanistan skapad!");
  }
}

// =========================
// Kolla om användaren är bannad
// =========================
auth.onAuthStateChanged((user) => {
  if (!user) return; // Om ingen är inloggad, gör inget

  db.collection("users").doc(user.uid).onSnapshot((docSnap) => {
    if (!docSnap.exists) return;
    const data = docSnap.data();

    if (data.banned === true) {
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

  let allFoods = [];

  // =========================
  // Skapa countries collection (Afghanistan) om den inte finns
  // =========================
  await createCountriesCollection();

  // =========================
  // Ladda länder från Firestore
  // =========================
  async function loadCountries() {
    countrySelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select country";
    countrySelect.appendChild(defaultOption);

    const snapshot = await db.collection("countries").get();
    snapshot.forEach(doc => {
      const opt = document.createElement("option");
      opt.value = doc.id;
      opt.textContent = doc.id;
      countrySelect.appendChild(opt);
    });
  }

  countrySelect.onchange = async () => {
    citySelect.innerHTML = "";
    const defaultCity = document.createElement("option");
    defaultCity.value = "";
    defaultCity.textContent = "Select city";
    citySelect.appendChild(defaultCity);

    const country = countrySelect.value;
    if (!country) return;

    const docSnap = await db.collection("countries").doc(country).get();
    if (!docSnap.exists) return;

    const cities = docSnap.data().cities || [];
    cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });

    citySelect.disabled = false;
  };

  // =========================
  // Filterknapp
  // =========================
  filterBtn.onclick = () => {
    const country = countrySelect.value;
    const city = citySelect.value;

    const filtered = allFoods.filter(f =>
      (!country || f.country === country) &&
      (!city || f.city === city)
    );
    renderFoodItems(filtered);
  };

  // =========================
  // Logout och myFood-knappar
  // =========================
  logoutBtn.onclick = () =>
    auth.signOut().then(() => (window.location.href = "login.html"));
  myFoodBtn.onclick = () => (window.location.href = "myfood.html");

  // =========================
  // Ladda global food
  // =========================
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

  // =========================
  // Render food items
  // =========================
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

  // =========================
  // Watch mute
  // =========================
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

  // =========================
  // Add food form
  // =========================
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
    if (!data.title || data.title.trim() === "") {
      throw new Error("Titel är obligatoriskt");
    }
    data.title = sanitizeString(data.title);

    if (!data.country || data.country.trim() === "") {
      throw new Error("Välj ett land");
    }
    data.country = sanitizeString(data.country);

    if (!data.city || data.city.trim() === "") {
      throw new Error("Välj en stad");
    }
    data.city = sanitizeString(data.city);

    if (!isValidEmoji(data.emoji)) {
      data.emoji = "🍽️";
    }
    data.emoji = sanitizeString(data.emoji);

    return data;
  }

  function sanitizeString(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerText;
  }

  function isValidEmoji(emoji) {
    const emojiRegex = /[\p{Emoji}]/u;
    return emojiRegex.test(emoji);
  }

});
