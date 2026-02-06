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
{ country: "Sweden", cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås", "Södertälje", "Eskilstuna", "Karlstad", "Täby", "Växjö", "Halmstad", "Sundsvall", "Luleå", "Trollhättan", "Östersund", "Mölndal", "Kalmar", "Kristianstad", "Skövde", "Sundbyberg", "Lidingö", "Karlskrona", "Lidköping", "Uddevalla", "Varberg", "Motala", "Falun", "Västerhaninge", "Nacka", "Kungälv", "Strängnäs", "Kungsbacka", "Falkenberg", "Piteå", "Ljusdal", "Mariestad", "Huddinge", "Sollentuna", "Ängelholm", "Vänersborg", "Bjuv", "Västervik", "Åkersberga", "Ystad", "Eslöv", "Trelleborg", "Sigtuna", "Botkyrka", "Norrtälje", "Boden", "Hässleholm", "Märsta", "Arvika", "Åmål", "Skellefteå", "Falköping", "Sandviken", "Katrineholm", "Örkelljunga", "Upplands Väsby", "Vellinge", "Säffle", "Kristinehamn", "Kungsör", "Mullsjö", "Vaxholm", "Tidaholm", "Örnsköldsvik", "Kramfors", "Åre", "Ludvika", "Karlskoga", "Haparanda", "Nynäshamn", "Lycksele", "Ånge", "Sälen", "Båstad", "Hjo", "Vimmerby", "Hofors", "Oskarshamn", "Trosa", "Hällefors", "Eda", "Grums", "Värnamo", "Flen", "Färgelanda", "Skara", "Åtvidaberg", "Sävsjö", "Åsele", "Vilhelmina", "Ronneby", "Ornskoldsvik", "Vallentuna", "Lerum", "Östhammar", "Markaryd", "Kumla", "Svenljunga", "Lekeberg", "Torsby", "Vetlanda", "Habo", "Härnösand", "Borgholm", "Ljungby", "Nybro", "Arboga", "Tingsryd", "Vårgårda", "Bollnäs", "Fagersta", "Årjäng", "Vårby", "Gislaved", "Kisa", "Hultsfred", "Robertsfors", "Hylte", "Katrineholm", "Åmål", "Katrineholm", "Katrineholm", "Västervik", "Skövde", "Skara", "Skellefteå", "Haparanda", "Karlshamn", "Mora", "Munkedal", "Strömstad", "Mariannelund", "Kil", "Vännäs", "Älvängen", "Alingsås", "Hässleholm", "Arboga", "Vellinge", "Åmål", "Bjuv", "Mullsjö", "Hässleholm", "Gnosjö", "Sävsjö", "Borlänge", "Boden", "Kramfors", "Sollefteå", "Ånge", "Vilhelmina", "Vilhelmina", "Lycksele", "Lycksele", "Örnsköldsvik", "Östersund", "Luleå", "Kiruna", "Gällivare", "Piteå", "Skellefteå", "Umeå", "Sundsvall", "Hudiksvall", "Sveg", "Härnösand", "Örnsköldsvik", "Fagersta", "Sala", "Avesta", "Hedemora", "Ludvika", "Falun", "Borlänge", "Mora", "Orsa", "Rättvik", "Västerås", "Köping", "Arboga", "Katrineholm", "Eskilstuna", "Strängnäs", "Södertälje", "Norrtälje", "Täby", "Sollentuna", "Upplands Väsby", "Sundbyberg", "Solna", "Stockholm", "Nacka", "Vallentuna", "Värmdö", "Haninge", "Botkyrka", "Huddinge", "Tyresö", "Täby", "Danderyd", "Lidingö", "Sigtuna", "Knivsta", "Upplands-Bro", "Håbo", "Enköping", "Heby", "Uppsala", "Gävle", "Sundsvall", "Västervik", "Kalmar", "Karlskrona", "Karlshamn", "Ronneby", "Borgholm", "Oskarshamn", "Västervik", "Vimmerby", "Eksjö", "Vetlanda", "Växjö", "Ljungby", "Hässleholm", "Kristianstad", "Malmö", "Lund", "Helsingborg", "Ängelholm", "Båstad", "Trelleborg", "Ystad", "Simrishamn", "Hörby", "Hässleholm", "Osby", "Markaryd", "Värnamo", "Gislaved", "Gnosjö", "Jönköping", "Nässjö", "Vaggeryd", "Mullsjö", "Habo", "Tranås", "Motala", "Linköping", "Norrköping", "Mjölby", "Vadstena", "Åtvidaberg", "Finspång", "Söderköping", "Valdemarsvik", "Västervik", "Vimmerby", "Oskarshamn", "Växjö", "Alvesta", "Tingsryd", "Ljungby", "Markaryd", "Älmhult", "Hässleholm", "Kristianstad", "Hörby", "Bjuv", "Åstorp", "Helsingborg", "Höganäs", "Malmö", "Lund", "Eslöv", "Trelleborg", "Ystad", "Simrishamn", "Karlskrona", "Ronneby", "Borgholm", "Kalmar", "Västervik", "Vimmerby"] },
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

// ===== Styling for validation (JS only) =====
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

// ===== LIVE VALIDATION =====
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

// ===== Add Food =====
addFoodForm.onsubmit = async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  // Check mute before posting
  if (currentUserData?.muteUntil && currentUserData.muteUntil.toDate() > new Date()) {
    const muteUntilDate = currentUserData.muteUntil.toDate();
    showCustomAlert(`You are muted until ${muteUntilDate.toLocaleString()}`);
    return; // Block post
  }

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
  if (hasError) return;

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
