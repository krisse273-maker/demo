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

  // --- Vänta tills användaren är inloggad ---
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // --- Hämta kön från Firestore ---
    const docRef = db.collection("publicUsers").doc(user.uid);
    const docSnap = await docRef.get();
    const gender = docSnap.exists ? docSnap.data().gender : "male";

    // --- Hämta publicName från "users" för välkomsttext ---
    const userDoc = await db.collection("users").doc(user.uid).get();
    const loggedInUserName = userDoc.exists ? userDoc.data().publicName || user.email : user.email;

    // --- Sätt välkomsttext ---
    welcomeMsg.textContent = `Welcome, ${loggedInUserName}!`;

    // --- Sätt emoji i cirkeln baserat på kön ---
    profileIcon.textContent = gender === "female" ? "👩" : "👨";

    // --- Global real-time food list ---
    let allFoods = [];
    db.collection("publicFoods")
      .orderBy("createdAt", "desc")
      .onSnapshot(async snapshot => {
        allFoods = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          let posterName = "Anonymous";

          // --- Hämta publicName från "users"-samlingen för varje poster ---
          if (data.userId) {
            const posterDoc = await db.collection("users").doc(data.userId).get();
            if (posterDoc.exists) posterName = posterDoc.data().publicName || "Anonymous";
          }

          return {
            title: data.title || "",
            city: data.city || "",
            country: data.country || "",
            emoji: data.emoji || "🍽️",
            user: posterName,
            timestamp: data.createdAt || null
          };
        }));

        renderFoodItems(allFoods);
      }, err => {
        console.error("Error fetching global foods:", err);
      });

    // --- Render-funktion ---
    function renderFoodItems(items) {
      foodList.innerHTML = "";
      if (!items.length) {
        foodList.innerHTML = "<p>No food found.</p>";
        stopLoadingDots();
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

      stopLoadingDots();
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

  });
});
