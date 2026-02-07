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
  { country: "Denmark", cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Helsingør", "Næstved", "Fredericia", "Silkeborg", "Hjørring", "Holstebro", "Taastrup", "Slagelse", "Hørsholm", "Nykøbing Falster", "Sønderborg", "Holbæk", "Svendborg", "Thisted", "Skive", "Rønne", "Ballerup", "Ringsted", "Grindsted", "Viborg", "Frederikshavn", "Ikast", "Brønderslev", "Nykøbing Mors", "Kalundborg", "Hillerød", "Aabenraa", "Tønder", "Struer", "Løgstør", "Maribo", "Frederikssund", "Billund", "Faaborg", "Haderslev", "Hobro", "Hørsholm", "Sæby", "Nakskov", "Skanderborg", "Frederiksværk"] },
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
{ country: "Hungary", cities: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs"] },

    // --- I-K länder ---
{ country: "Iceland", cities: ["Reykjavík", "Kopavogur", "Hafnarfjörður", "Akureyri", "Reykjanesbær"] },
{ country: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad"] },
{ country: "Indonesia", cities: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi"] },
{ country: "Iran", cities: ["Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz"] },
{ country: "Iraq", cities: ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf"] },
{ country: "Ireland", cities: ["Dublin", "Cork", "Limerick", "Galway", "Waterford"] },
{ country: "Israel", cities: ["Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva"] },
{ country: "Italy", cities: ["Rome", "Milan", "Naples", "Turin", "Palermo"] },
{ country: "Jamaica", cities: ["Kingston", "Montego Bay", "Spanish Town", "Portmore", "Mandeville"] },
{ country: "Japan", cities: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo"] },
{ country: "Jordan", cities: ["Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba"] },
{ country: "Kazakhstan", cities: ["Almaty", "Nur-Sultan", "Shymkent", "Karaganda", "Aktobe"] },
{ country: "Kenya", cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"] },
{ country: "Kiribati", cities: ["South Tarawa", "Betio", "Bikenibeu", "Teaoraereke", "Buota"] },
{ country: "Kuwait", cities: ["Kuwait City", "Al Ahmadi", "Hawalli", "Al Farwaniyah", "Salmiya"] },
{ country: "Kyrgyzstan", cities: ["Bishkek", "Osh", "Jalal-Abad", "Kara-Balta", "Tokmok"] },

                        // --- L-N länder ---
{ country: "Laos", cities: ["Vientiane", "Luang Prabang", "Pakse", "Savannakhet", "Thakhek"] },
{ country: "Latvia", cities: ["Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala"] },
{ country: "Lebanon", cities: ["Beirut", "Tripoli", "Sidon", "Tyre", "Jounieh"] },
{ country: "Lesotho", cities: ["Maseru", "Teyateyaneng", "Butha-Buthe", "Leribe", "Mafeteng"] },
{ country: "Liberia", cities: ["Monrovia", "Gbarnga", "Bensonville", "Harper", "Buchanan"] },
{ country: "Libya", cities: ["Tripoli", "Benghazi", "Misrata", "Al Khums", "Sirte"] },
{ country: "Liechtenstein", cities: ["Vaduz", "Schaan", "Balzers", "Triesen", "Eschen"] },
{ country: "Lithuania", cities: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"] },
{ country: "Luxembourg", cities: ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck"] },
{ country: "Madagascar", cities: ["Antananarivo", "Toamasina", "Antsirabe", "Fianarantsoa", "Mahajanga"] },
{ country: "Malawi", cities: ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu"] },
{ country: "Malaysia", cities: ["Kuala Lumpur", "George Town", "Ipoh", "Shah Alam", "Johor Bahru"] },
{ country: "Maldives", cities: ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo"] },
{ country: "Mali", cities: ["Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes"] },
{ country: "Malta", cities: ["Valletta", "Birkirkara", "Mosta", "Qormi", "Sliema"] },
{ country: "Marshall Islands", cities: ["Majuro", "Ebeye", "Laura", "Jabor", "Delap-Uliga-Djarrit"] },
{ country: "Mauritania", cities: ["Nouakchott", "Nouadhibou", "Kiffa", "Zouérat", "Rosso"] },
{ country: "Mauritius", cities: ["Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes"] },
{ country: "Mexico", cities: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Toluca"] },
{ country: "Micronesia", cities: ["Palikir", "Weno", "Kolonia", "Tamuning", "Dublon"] },
{ country: "Moldova", cities: ["Chișinău", "Tiraspol", "Bălți", "Bender", "Rîbnița"] },
{ country: "Monaco", cities: ["Monaco", "Monte Carlo", "La Condamine", "Fontvieille", "Moneghetti"] },
{ country: "Mongolia", cities: ["Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan", "Mörön"] },
{ country: "Montenegro", cities: ["Podgorica", "Nikšić", "Herceg Novi", "Pljevlja", "Bijelo Polje"] },
{ country: "Morocco", cities: ["Rabat", "Casablanca", "Fes", "Marrakech", "Tangier"] },
{ country: "Mozambique", cities: ["Maputo", "Matola", "Beira", "Nampula", "Chimoio"] },
{ country: "Myanmar", cities: ["Naypyidaw", "Yangon", "Mandalay", "Mawlamyine", "Taunggyi"] },
{ country: "Namibia", cities: ["Windhoek", "Rundu", "Swakopmund", "Walvis Bay", "Oshakati"] },
{ country: "Nauru", cities: ["Yaren", "Denigomodu", "Aiwo", "Buada", "Boe"] },
{ country: "Nepal", cities: ["Kathmandu", "Pokhara", "Lalitpur", "Biratnagar", "Birgunj"] },
{ country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"] },
{ country: "New Zealand", cities: ["Wellington", "Auckland", "Christchurch", "Hamilton", "Dunedin"] },
{ country: "Nicaragua", cities: ["Managua", "León", "Masaya", "Chinandega", "Matagalpa"] },
{ country: "Niger", cities: ["Niamey", "Zinder", "Maradi", "Tahoua", "Agadez"] },
{ country: "Nigeria", cities: ["Abuja", "Lagos", "Kano", "Ibadan", "Port Harcourt"] },

                        // --- O-Q länder ---
{ country: "Oman", cities: ["Muscat", "Seeb", "Sohar", "Salalah", "Bawshar"] },
{ country: "Pakistan", cities: ["Islamabad", "Karachi", "Lahore", "Faisalabad", "Rawalpindi"] },
{ country: "Palau", cities: ["Ngerulmud", "Koror", "Melekeok", "Airai", "Babeldaob"] },
{ country: "Panama", cities: ["Panama City", "San Miguelito", "David", "Colón", "La Chorrera"] },
{ country: "Papua New Guinea", cities: ["Port Moresby", "Lae", "Mount Hagen", "Madang", "Arawa"] },
{ country: "Paraguay", cities: ["Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Capiatá"] },
{ country: "Peru", cities: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura"] },
{ country: "Philippines", cities: ["Manila", "Quezon City", "Cebu City", "Davao City", "Zamboanga City"] },
{ country: "Poland", cities: ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań"] },
{ country: "Portugal", cities: ["Lisbon", "Porto", "Amadora", "Braga", "Coimbra"] },
{ country: "Qatar", cities: ["Doha", "Al Rayyan", "Umm Salal Muhammad", "Al Wakrah", "Al Khor"] },

                        // --- R-T länder ---
{ country: "Romania", cities: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța"] },
{ country: "Russia", cities: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Nizhny Novgorod"] },
{ country: "Rwanda", cities: ["Kigali", "Butare", "Gisenyi", "Ruhengeri", "Kibuye"] },
{ country: "Saint Kitts and Nevis", cities: ["Basseterre", "Charlestown", "Sandy Point Town", "Cayon", "Dieppe Bay Town"] },
{ country: "Saint Lucia", cities: ["Castries", "Gros Islet", "Vieux Fort", "Soufrière", "Laborie"] },
{ country: "Saint Vincent and the Grenadines", cities: ["Kingstown", "Georgetown", "Barrouallie", "Chateaubelair", "Layou"] },
{ country: "Samoa", cities: ["Apia", "Vaitele", "Faleula", "Siusega", "Leulumoega"] },
{ country: "San Marino", cities: ["San Marino", "Borgo Maggiore", "Serravalle", "Domagnano", "Faetano"] },
{ country: "Sao Tome and Principe", cities: ["São Tomé", "Santana", "Trindade", "Neves", "Guadalupe"] },
{ country: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"] },
{ country: "Senegal", cities: ["Dakar", "Touba", "Thiès", "Rufisque", "Kaolack"] },
{ country: "Serbia", cities: ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica"] },
{ country: "Seychelles", cities: ["Victoria", "Anse Boileau", "Anse Royale", "Bel Ombre", "Beau Vallon"] },
{ country: "Sierra Leone", cities: ["Freetown", "Bo", "Kenema", "Makeni", "Koidu"] },
{ country: "Singapore", cities: ["Singapore"] },
{ country: "Slovakia", cities: ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra"] },
{ country: "Slovenia", cities: ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje"] },
{ country: "Solomon Islands", cities: ["Honiara", "Auki", "Gizo", "Kira Kira", "Tulagi"] },
{ country: "Somalia", cities: ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Baidoa"] },
{ country: "South Africa", cities: ["Pretoria", "Johannesburg", "Cape Town", "Durban", "Port Elizabeth"] },
{ country: "South Sudan", cities: ["Juba", "Malakal", "Wau", "Bor", "Rumbek"] },
{ country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza"] },
{ country: "Sri Lanka", cities: ["Colombo", "Sri Jayawardenepura Kotte", "Kandy", "Negombo", "Galle"] },
{ country: "Sudan", cities: ["Khartoum", "Omdurman", "Nyala", "Port Sudan", "Kassala"] },
{ country: "Suriname", cities: ["Paramaribo", "Lelydorp", "Nieuw Nickerie", "Moengo", "Albina"] },
{ country: "Sweden", cities: ["Stockholm","Gothenburg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Jönköping","Norrköping","Lund","Umeå","Gävle","Borås","Södertälje","Eskilstuna","Karlstad","Täby","Växjö","Halmstad","Sundsvall","Luleå","Trollhättan","Östersund","Mölndal","Kalmar","Kristianstad","Skövde","Sundbyberg","Lidingö","Karlskrona","Lidköping","Uddevalla","Varberg","Motala","Falun","Västerhaninge","Nacka","Kungälv","Strängnäs","Kungsbacka","Falkenberg","Piteå","Ljusdal","Mariestad","Huddinge","Sollentuna","Ängelholm","Vänersborg","Bjuv","Västervik","Åkersberga","Ystad","Eslöv","Trelleborg","Sigtuna","Boden","Hässleholm","Märsta","Arvika","Åmål","Skellefteå","Falköping","Sandviken","Katrineholm","Örkelljunga","Upplands Väsby","Vellinge","Säffle","Kristinehamn","Kungsör","Mullsjö","Vaxholm","Tidaholm","Örnsköldsvik","Kramfors","Åre","Ludvika","Karlskoga","Haparanda","Nynäshamn","Lycksele","Ånge","Sälen","Båstad","Hjo","Vimmerby","Hofors","Oskarshamn","Trosa","Hällefors","Eda","Grums","Värnamo","Flen","Färgelanda","Skara","Åtvidaberg","Sävsjö","Åsele","Vilhelmina","Ronneby","Ornskoldsvik","Vallentuna","Lerum","Östhammar","Markaryd","Kumla","Svenljunga","Lekeberg","Torsby","Vetlanda","Habo","Härnösand","Borgholm","Ljungby","Arboga","Tingsryd","Vårgårda","Bollnäs","Fagersta","Årjäng"]},
{ country: "Switzerland", cities: ["Bern", "Zurich", "Geneva", "Basel", "Lausanne"] },
{ country: "Syria", cities: ["Damascus", "Aleppo", "Homs", "Hama", "Latakia"] },

// --- U-W länder ---
{ country: "Uganda", cities: ["Kampala", "Nansana", "Kira", "Mbarara", "Gulu"] },
{ country: "Ukraine", cities: ["Kyiv", "Kharkiv", "Odesa", "Dnipro", "Donetsk"] },
{ country: "United Arab Emirates", cities: ["Abu Dhabi", "Dubai", "Sharjah", "Al Ain", "Ajman"] },
{ country: "United Kingdom", cities: ["London", "Birmingham", "Glasgow", "Liverpool", "Manchester"] },
{ country: "United States", cities: ["Washington, D.C.", "New York City", "Los Angeles", "Chicago", "Houston"] },
{ country: "Uruguay", cities: ["Montevideo", "Salto", "Ciudad de la Costa", "Paysandú", "Las Piedras"] },
{ country: "Uzbekistan", cities: ["Tashkent", "Samarkand", "Namangan", "Andijan", "Bukhara"] },

  // --- V-Z länder ---
{ country: "Vanuatu", cities: ["Port Vila", "Luganville", "Santo", "Lenakel", "Isangel"] },
{ country: "Vatican City", cities: ["Vatican City"] },
{ country: "Venezuela", cities: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"] },
{ country: "Vietnam", cities: ["Hanoi", "Ho Chi Minh City", "Haiphong", "Can Tho", "Da Nang"] },
{ country: "Yemen", cities: ["Sana'a", "Aden", "Taiz", "Al Hudaydah", "Ibb"] },
{ country: "Zambia", cities: ["Lusaka", "Ndola", "Kitwe", "Kabwe", "Chingola"] },
{ country: "Zimbabwe", cities: ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru"] }
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



