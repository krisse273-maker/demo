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

  let allFoods = [];

  // --- Hårdkodad lista av länder och städer (börjar med A, kan fyllas på med resten) ---
  const countriesData = [
  // --- A-länder ---
  { country: "Afghanistan", cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad"] },
  { country: "Albania", cities: ["Tirana", "Durrës", "Vlorë", "Shkodër", "Fier"] },
  { country: "Algeria", cities: ["Algiers", "Oran", "Constantine", "Annaba", "Blida"] },
  { country: "Andorra", cities: ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "La Massana", "Sant Julià de Lòria"] },
  { country: "Angola", cities: ["Luanda", "N’dalatando", "Huambo", "Lobito", "Benguela"] },
  { country: "Antigua & Barbuda", cities: ["Saint John's", "All Saints", "Liberta", "Potters Village", "Parham"] },
  { country: "Argentina", cities: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"] },
  { country: "Armenia", cities: ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan"] },
  { country: "Australia", cities: ["Canberra", "Sydney", "Melbourne", "Brisbane", "Perth"] },
  { country: "Austria", cities: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"] },
  { country: "Azerbaijan", cities: ["Baku", "Ganja", "Sumqayit", "Mingachevir", "Shaki"] },

  // --- B-länder ---
  { country: "Bahamas", cities: ["Nassau", "Freeport", "West End", "Coopers Town", "Marsh Harbour"] },
  { country: "Bahrain", cities: ["Manama", "Riffa", "Muharraq", "Isa Town", "Sitra"] },
  { country: "Bangladesh", cities: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet"] },
  { country: "Barbados", cities: ["Bridgetown", "Speightstown", "Oistins", "Saint Michael", "Holetown"] },
  { country: "Belarus", cities: ["Minsk", "Gomel", "Mogilev", "Vitebsk", "Hrodna"] },
  { country: "Belgium", cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège"] },
  { country: "Belize", cities: ["Belmopan", "San Ignacio", "Orange Walk", "Dangriga", "Corozal"] },
  { country: "Benin", cities: ["Porto-Novo", "Cotonou", "Parakou", "Djougou", "Bohicon"] },
  { country: "Bhutan", cities: ["Thimphu", "Phuntsholing", "Punakha", "Trongsa", "Jakar"] },
  { country: "Bolivia", cities: ["Sucre", "La Paz", "Santa Cruz", "Cochabamba", "Oruro"] },
  { country: "Bosnia & Herzegovina", cities: ["Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Mostar"] },
  { country: "Botswana", cities: ["Gaborone", "Francistown", "Molepolole", "Maun", "Selebi-Phikwe"] },
  { country: "Brazil", cities: ["Brasília", "São Paulo", "Rio de Janeiro", "Salvador", "Fortaleza"] },
  { country: "Brunei", cities: ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong", "Bangar"] },
  { country: "Bulgaria", cities: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"] },
  { country: "Burkina Faso", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya"] },
  { country: "Burundi", cities: ["Gitega", "Bujumbura", "Ngozi", "Muyinga", "Rutana"] },

  // --- C-länder ---
  { country: "Cabo Verde", cities: ["Praia", "Mindelo", "Santa Maria", "Assomada", "São Filipe"] },
  { country: "Cambodia", cities: ["Phnom Penh", "Siem Reap", "Sihanoukville", "Battambang", "Ta Khmau"] },
  { country: "Cameroon", cities: ["Yaoundé", "Douala", "Garoua", "Bamenda", "Maroua"] },
  { country: "Canada", cities: ["Ottawa", "Toronto", "Montreal", "Vancouver", "Calgary"] },
  { country: "Central African Republic", cities: ["Bangui", "Bimbo", "Berbérati", "Carnot", "Bossangoa"] },
  { country: "Chad", cities: ["N'Djamena", "Moundou", "Sarh", "Abéché", "Kélo"] },
  { country: "Chile", cities: ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta"] },
  { country: "China", cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu"] },
  { country: "Colombia", cities: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"] },
  { country: "Comoros", cities: ["Moroni", "Moutsamoudou", "Fomboni", "Domoni", "Itsandra"] },
  { country: "Congo, Democratic Republic of the", cities: ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani"] },
  { country: "Congo, Republic of the", cities: ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Owando"] },
  { country: "Costa Rica", cities: ["San José", "Alajuela", "Cartago", "Heredia", "Liberia"] },
  { country: "Côte d'Ivoire", cities: ["Yamoussoukro", "Abidjan", "Bouaké", "Daloa", "San Pedro"] },
  { country: "Croatia", cities: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar"] },
  { country: "Cuba", cities: ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara"] },
  { country: "Cyprus", cities: ["Nicosia", "Limassol", "Larnaca", "Famagusta", "Paphos"] },
  { country: "Czechia", cities: ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec"] },

  // --- D-länder ---
  { country: "Denmark", cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"] },
  { country: "Djibouti", cities: ["Djibouti", "Ali Sabieh", "Tadjoura", "Obock", "Dikhil"] },
  { country: "Dominica", cities: ["Roseau", "Portsmouth", "Marigot", "Castle Bruce", "Grand Bay"] },
  { country: "Dominican Republic", cities: ["Santo Domingo", "Santiago de los Caballeros", "La Romana", "San Pedro de Macorís", "Puerto Plata"] },

    // --- E-H länder ---
{ country: "Ecuador", cities: ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala"] },
{ country: "Egypt", cities: ["Cairo", "Alexandria", "Giza", "Shubra El-Kheima", "Port Said"] },
{ country: "El Salvador", cities: ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Mejicanos"] },
{ country: "Equatorial Guinea", cities: ["Malabo", "Bata", "Ebebiyín", "Mongomo", "Luba"] },
{ country: "Eritrea", cities: ["Asmara", "Keren", "Massawa", "Assab", "Mendefera"] },
{ country: "Estonia", cities: ["Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve"] },
{ country: "Eswatini", cities: ["Mbabane", "Manzini", "Big Bend", "Lobamba", "Siteki"] },
{ country: "Ethiopia", cities: ["Addis Ababa", "Dire Dawa", "Mek'ele", "Gondar", "Bahir Dar"] },
{ country: "Fiji", cities: ["Suva", "Nadi", "Lautoka", "Labasa", "Sigatoka"] },
{ country: "Finland", cities: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu"] },
{ country: "France", cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"] },
{ country: "Gabon", cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda"] },
{ country: "Gambia", cities: ["Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni"] },
{ country: "Georgia", cities: ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Zugdidi"] },
{ country: "Germany", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"] },
{ country: "Ghana", cities: ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Obuasi"] },
{ country: "Greece", cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"] },
{ country: "Grenada", cities: ["St. George's", "Gouyave", "Grenville", "Victoria", "Hillsborough"] },
{ country: "Guatemala", cities: ["Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"] },
{ country: "Guinea", cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé"] },
{ country: "Guinea-Bissau", cities: ["Bissau", "Bafatá", "Gabú", "Bissorã", "Bolama"] },
{ country: "Guyana", cities: ["Georgetown", "Linden", "New Amsterdam", "Bartica", "Anna Regina"] },
{ country: "Haiti", cities: ["Port-au-Prince", "Cap-Haïtien", "Gonaïves", "Les Cayes", "Petion-Ville"] },
{ country: "Honduras", cities: ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso"] },
{ country: "Hungary", cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs"] }

];


  // --- Flaggar för vissa länder (valfritt) ---
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

  // Logout och myFood-knappar
  logoutBtn.onclick = () =>
    auth.signOut().then(() => (window.location.href = "login.html"));
  myFoodBtn.onclick = () => (window.location.href = "myfood.html");

  // --- Ladda hårdkodade länder till dropdown ---
  function loadCountries() {
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

  auth.onAuthStateChanged(async user => {
    if (!user) return (window.location.href = "login.html");

    welcomeMsg.textContent = `Welcome, ${user.displayName || user.email}!`;

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists && userDoc.data().admin === true) {
      adminPanel.style.display = "block";
    }

    loadCountries();
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



