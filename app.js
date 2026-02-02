// --- Firebase-konfiguration ---
const firebaseConfig = {
  apiKey: "AIzaSyCrN3PoqcVs2AbEPbHjfM92_35Uaa1uAYw",
  authDomain: "global-food-share.firebaseapp.com",
  projectId: "global-food-share",
  storageBucket: "global-food-share.appspot.com",
  messagingSenderId: "902107453892",
  appId: "1:902107453892:web:dd9625974b8744cc94ac91"
};

// Initiera Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

window.addEventListener("DOMContentLoaded", async () => {
  const countrySelect = document.getElementById("country");
  const citySelect = document.getElementById("city");
  const filterBtn = document.getElementById("filterBtn");
  const foodList = document.querySelector(".global-food-list");
  const myFoodBtn = document.getElementById("myFoodBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileIcon = document.getElementById("profileIcon");
  const welcomeMsg = document.getElementById("welcomeMsg");

  // --- Länder/städer ---
  let countriesData = [];
  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries");
    const data = await res.json();
    countriesData = data.data;

    countrySelect.innerHTML = '<option value="">Select country</option>';
    countriesData.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.country;
      opt.textContent = c.country;
      countrySelect.appendChild(opt);
    });
    countrySelect.disabled = false;
  } catch (err) {
    console.error("Could not fetch countries:", err);
    alert("Failed to load countries. Try refreshing.");
  }

  countrySelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select city</option>';
    citySelect.disabled = true;

    const selectedCountry = countrySelect.value;
    if (!selectedCountry) return;

    const countryObj = countriesData.find(c => c.country === selectedCountry);
    if (!countryObj || !countryObj.cities.length) return;

    countryObj.cities.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
    citySelect.disabled = false;
  });

  // --- Navigera ---
  myFoodBtn.addEventListener("click", () => window.location.href = "myfood.html");
  logoutBtn.addEventListener("click", async () => {
    await firebase.auth().signOut();
    window.location.href = "login.html";
  });

  // --- Vänta tills användaren är inloggad innan Firestore ---
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // --- Hämta kön från Firestore ---
    const docRef = db.collection("publicUsers").doc(user.uid);
    const docSnap = await docRef.get();
    const gender = docSnap.exists ? docSnap.data().gender : "male";

    // --- Sätt välkomsttext ---
    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    // --- Sätt profilikon baserat på kön ---
    if(gender === "male") {
      // Klassisk manikon
      profileIcon.innerHTML = `
        <svg viewBox="0 0 64 64" width="40" height="40">
          <circle cx="32" cy="20" r="12" fill="#4caf50"/>
          <path d="M16 52c0-8 16-8 16-8s16 0 16 8v4H16v-4z" fill="#4caf50"/>
        </svg>
      `;
    } else {
      // Kvinnlig ikon med hästsvans (sedd från sidan)
      profileIcon.innerHTML = `
        <svg viewBox="0 0 64 64" width="40" height="40">
          <!-- Ansikte -->
          <circle cx="32" cy="20" r="12" fill="#4caf50"/>
          <!-- Kropp -->
          <path d="M16 52c0-8 32-8 32 0v4H16v-4z" fill="#4caf50"/>
          <!-- Hästsvans som sticker ut -->
          <path d="M44 16c4-2 12-4 12 4c0 4-2 8-4 10c-2 2-4 0-4 0s0-8-4-14z" fill="#388e3c"/>
        </svg>
      `;
    }

    // --- Global real-time food list ---
    let allFoods = [];
    db.collection("publicFoods")
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        allFoods = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: data.userName || "Anonymous",
            timestamp: data.createdAt || null
          };
        });

        renderFoodItems(allFoods);
      }, err => {
        console.error("Error fetching global foods:", err);
      });

    // --- Render-funktion ---
    function renderFoodItems(items) {
      foodList.innerHTML = "";
      if (!items.length) {
        foodList.innerHTML = "<p>No food found.</p>";
        return;
      }

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      items.forEach(item => {
        let dateStr = "";
        if (item.timestamp && item.timestamp.toDate) {
          const date = item.timestamp.toDate();
          const day = date.getDate();
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          dateStr = `${day} ${month} ${year}`;
        }

        const div = document.createElement("div");
        div.classList.add("food-item");
        div.innerHTML = `
          <div class="food-header">
            <span>${item.emoji}</span>
            <h3>${item.title}</h3>
          </div>
          <div class="food-details">
            <p><span class="icon-small">📍</span><strong>Location:</strong> ${item.city}, ${item.country}</p>
            <p><span class="icon-small">👤</span><strong>Published By:</strong> ${item.user}</p>
            ${dateStr ? `<p><span class="icon-small">📅</span><strong>Posted On:</strong> ${dateStr}</p>` : ""}
          </div>
        `;
        foodList.appendChild(div);
      });
    }

    // --- Filterknapp ---
    filterBtn.addEventListener("click", () => {
      const country = countrySelect.value;
      const city = citySelect.value;

      const filtered = allFoods.filter(f =>
        (!country || f.country === country) &&
        (!city || f.city === city)
      );

      renderFoodItems(filtered);
    });

    // --- Lägg till matpost (om framtida funktion behövs) ---
    async function addFoodItem(foodData) {
      await db.collection("publicFoods").add({
        title: foodData.title,
        type: foodData.type,
        country: foodData.country || "",
        city: foodData.city || "",
        emoji: foodData.emoji || "🍽️",
        userName: user.displayName || "Anonymous",
        ownerId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

  });
});
