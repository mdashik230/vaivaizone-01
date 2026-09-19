export interface LocationItem {
  en: string;
  bn: string;
}

export interface DivisionData {
  en: string;
  bn: string;
  districts: DistrictData[];
}

export interface DistrictData {
  en: string;
  bn: string;
  divisionEn: string;
  upazilas: LocationItem[];
}

// Complete data for all 8 Divisions, 64 Districts, and every Upazila/Thana in Bangladesh
export const BD_DIVISIONS: LocationItem[] = [
  { en: "Dhaka", bn: "ঢাকা" },
  { en: "Chattogram", bn: "চট্টগ্রাম" },
  { en: "Rajshahi", bn: "রাজশাহী" },
  { en: "Khulna", bn: "খুলনা" },
  { en: "Barishal", bn: "বরিশাল" },
  { en: "Sylhet", bn: "সিলেট" },
  { en: "Rangpur", bn: "রংপুর" },
  { en: "Mymensingh", bn: "ময়মনসিংহ" }
];

export const BD_DISTRICTS: Record<string, LocationItem[]> = {
  "Dhaka": [
    { en: "Dhaka", bn: "ঢাকা" },
    { en: "Gazipur", bn: "গাজীপুর" },
    { en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
    { en: "Tangail", bn: "টাঙ্গাইল" },
    { en: "Manikganj", bn: "মানিকগঞ্জ" },
    { en: "Munshiganj", bn: "মুন্সীগঞ্জ" },
    { en: "Narsingdi", bn: "নরসিংদী" },
    { en: "Faridpur", bn: "ফরিদপুর" },
    { en: "Gopalganj", bn: "গোপালগঞ্জ" },
    { en: "Madaripur", bn: "মাদারীপুর" },
    { en: "Rajbari", bn: "রাজবাড়ী" },
    { en: "Shariatpur", bn: "শরীয়তপুর" },
    { en: "Kishoreganj", bn: "কিশোরগঞ্জ" }
  ],
  "Chattogram": [
    { en: "Chattogram", bn: "চট্টগ্রাম" },
    { en: "Cox's Bazar", bn: "কক্সবাজার" },
    { en: "Cumilla", bn: "কুমিল্লা" },
    { en: "Feni", bn: "ফেনী" },
    { en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া" },
    { en: "Noakhali", bn: "নোয়াখালী" },
    { en: "Lakshmipur", bn: "লক্ষ্মীপুর" },
    { en: "Chandpur", bn: "চাঁদপুর" },
    { en: "Khagrachhari", bn: "খাগড়াছড়ি" },
    { en: "Rangamati", bn: "রাঙ্গামাটি" },
    { en: "Bandarban", bn: "বান্দরবান" }
  ],
  "Rajshahi": [
    { en: "Rajshahi", bn: "রাজশাহী" },
    { en: "Bogura", bn: "বগুড়া" },
    { en: "Pabna", bn: "পাবনা" },
    { en: "Naogaon", bn: "নওগাঁ" },
    { en: "Joypurhat", bn: "জয়পুরহাট" },
    { en: "Chapai Nawabganj", bn: "চাঁপাইনবাবগঞ্জ" },
    { en: "Natore", bn: "নাটোর" },
    { en: "Sirajganj", bn: "সিরাজগঞ্জ" }
  ],
  "Khulna": [
    { en: "Khulna", bn: "খুলনা" },
    { en: "Jashore", bn: "যশোর" },
    { en: "Satkhira", bn: "সাতক্ষীরা" },
    { en: "Bagerhat", bn: "বাগেরহাট" },
    { en: "Kushtia", bn: "কুষ্টিয়া" },
    { en: "Meherpur", bn: "মেহেরপুর" },
    { en: "Chuadanga", bn: "চুয়াডাঙ্গা" },
    { en: "Jhenaidah", bn: "ঝিনাইদহ" },
    { en: "Magura", bn: "মাগুরা" },
    { en: "Narail", bn: "নড়াইল" }
  ],
  "Barishal": [
    { en: "Barishal", bn: "বরিশাল" },
    { en: "Patuakhali", bn: "পটুয়াখালী" },
    { en: "Bhola", bn: "ভোলা" },
    { en: "Pirojpur", bn: "পিরোজপুর" },
    { en: "Barguna", bn: "বরগুনা" },
    { en: "Jhalokathi", bn: "ঝালকাঠি" }
  ],
  "Sylhet": [
    { en: "Sylhet", bn: "সিলেট" },
    { en: "Moulvibazar", bn: "মৌলভীবাজার" },
    { en: "Habiganj", bn: "হবিগঞ্জ" },
    { en: "Sunamganj", bn: "সুনামগঞ্জ" }
  ],
  "Rangpur": [
    { en: "Rangpur", bn: "রংপুর" },
    { en: "Dinajpur", bn: "দিনাজপুর" },
    { en: "Gaibandha", bn: "গাইবান্ধা" },
    { en: "Kurigram", bn: "কুড়িগ্রাম" },
    { en: "Nilphamari", bn: "নীলফামারী" },
    { en: "Panchagarh", bn: "পঞ্চগড়" },
    { en: "Thakurgaon", bn: "ঠাকুরগাঁও" },
    { en: "Lalmonirhat", bn: "লালমনিরহাট" }
  ],
  "Mymensingh": [
    { en: "Mymensingh", bn: "ময়মনসিংহ" },
    { en: "Netrokona", bn: "নেত্রকোণা" },
    { en: "Sherpur", bn: "শেরপুর" },
    { en: "Jamalpur", bn: "জামালপুর" }
  ]
};

export const BD_UPAZILAS: Record<string, LocationItem[]> = {
  // --- DHAKA DIVISION (13 DISTRICTS) ---
  "Dhaka": [
    { en: "Savar", bn: "সাভার" },
    { en: "Dhamrai", bn: "ধামরাই" },
    { en: "Keraniganj", bn: "কেরানীগঞ্জ" },
    { en: "Nawabganj", bn: "নবাবগঞ্জ" },
    { en: "Dohar", bn: "দোহার" },
    { en: "Adabor", bn: "আদাবর" },
    { en: "Badda", bn: "বাড্ডা" },
    { en: "Bangshal", bn: "বংশাল" },
    { en: "Biman Bandar", bn: "বিমানবন্দর" },
    { en: "Cantonment", bn: "ক্যান্টনমেন্ট" },
    { en: "Chawkbazar", bn: "চকবাজার" },
    { en: "Dakshinkhan", bn: "দক্ষিণখান" },
    { en: "Darus Salam", bn: "দারুস সালাম" },
    { en: "Demra", bn: "ডেমরা" },
    { en: "Dhanmondi", bn: "ধানমন্ডি" },
    { en: "Gandaria", bn: "গেন্ডারিয়া" },
    { en: "Gulshan", bn: "গুলশান" },
    { en: "Hatirjheel", bn: "হাতিরঝিল" },
    { en: "Hazaribagh", bn: "হাজারীবাগ" },
    { en: "Jatrabari", bn: "যাত্রাবাড়ী" },
    { en: "Kadamtali", bn: "কদমতলী" },
    { en: "Kafrul", bn: "কাফরুল" },
    { en: "Kalabagan", bn: "কলাবাগান" },
    { en: "Kamrangirchar", bn: "কামরাঙ্গীরচর" },
    { en: "Khilgaon", bn: "খিলগাঁও" },
    { en: "Khilkhet", bn: "খিলক্ষেত" },
    { en: "Kotwali", bn: "কোতোয়ালী" },
    { en: "Lalbagh", bn: "লালবাগ" },
    { en: "Mirpur", bn: "মিরপুর" },
    { en: "Mohammadpur", bn: "মোহাম্মদপুর" },
    { en: "Motijheel", bn: "মতিঝিল" },
    { en: "New Market", bn: "নিউ মার্কেট" },
    { en: "Pallabi", bn: "পল্লবী" },
    { en: "Paltan", bn: "পল্টন" },
    { en: "Ramna", bn: "রমনা" },
    { en: "Rampura", bn: "রামপুরা" },
    { en: "Sabujbagh", bn: "সবুজবাগ" },
    { en: "Shah Ali", bn: "শাহ আলী" },
    { en: "Shahbagh", bn: "শাহবাগ" },
    { en: "Sher-e-Bangla Nagar", bn: "শেরেবাংলা নগর" },
    { en: "Shyampur", bn: "শ্যামপুর" },
    { en: "Sutrapur", bn: "সূত্রাপুর" },
    { en: "Tejgaon", bn: "তেজগাঁও" },
    { en: "Tejgaon Industrial Area", bn: "তেজগাঁও শিল্পাঞ্চল" },
    { en: "Turag", bn: "তুরাগ" },
    { en: "Uttara", bn: "উত্তরা" },
    { en: "Uttar Khan", bn: "উত্তরখান" },
    { en: "Vatara", bn: "ভাটারা" },
    { en: "Wari", bn: "ওয়ারী" }
  ],
  "Gazipur": [
    { en: "Gazipur Sadar", bn: "গাজীপুর সদর" },
    { en: "Kaliakair", bn: "কালিয়াকৈর" },
    { en: "Kaliganj", bn: "কালীগঞ্জ" },
    { en: "Kapasia", bn: "কাপাসিয়া" },
    { en: "Sreepur", bn: "শ্রীপুর" },
    { en: "Tongi", bn: "টঙ্গী" }
  ],
  "Narayanganj": [
    { en: "Narayanganj Sadar", bn: "নারায়ণগঞ্জ সদর" },
    { en: "Bandar", bn: "বন্দর" },
    { en: "Araihazar", bn: "আড়াইহাজার" },
    { en: "Sonargaon", bn: "সোনারগাঁও" },
    { en: "Rupganj", bn: "রূপগঞ্জ" },
    { en: "Siddhirganj", bn: "সিদ্ধিরগঞ্জ" },
    { en: "Fatullah", bn: "ফতুল্লা" }
  ],
  "Tangail": [
    { en: "Tangail Sadar", bn: "টাঙ্গাইল সদর" },
    { en: "Sakhipur", bn: "সখিপুর" },
    { en: "Basail", bn: "বাসাইল" },
    { en: "Madhupur", bn: "মধুপুর" },
    { en: "Ghatail", bn: "ঘাটাইল" },
    { en: "Kalihati", bn: "কালিহাতী" },
    { en: "Nagarpur", bn: "নাগরপুর" },
    { en: "Mirzapur", bn: "মির্জাপুর" },
    { en: "Gopalpur", bn: "গোপালপুর" },
    { en: "Delduar", bn: "দেলদুয়ার" },
    { en: "Bhuapur", bn: "ভূঞাপুর" },
    { en: "Dhanbari", bn: "ধনবাড়ী" }
  ],
  "Manikganj": [
    { en: "Manikganj Sadar", bn: "মানিকগঞ্জ সদর" },
    { en: "Singair", bn: "সিংগাইর" },
    { en: "Shivalaya", bn: "শিবালয়" },
    { en: "Saturia", bn: "সাটুরিয়া" },
    { en: "Harirampur", bn: "হরিরামপুর" },
    { en: "Gheor", bn: "ঘিওর" },
    { en: "Daulatpur", bn: "দৌলতপুর" }
  ],
  "Munshiganj": [
    { en: "Munshiganj Sadar", bn: "মুন্সীগঞ্জ সদর" },
    { en: "Sreenagar", bn: "শ্রীনগর" },
    { en: "Sirajdikhan", bn: "সিরাজদিখান" },
    { en: "Louhajang", bn: "লৌহজং" },
    { en: "Gazaria", bn: "গজারিয়া" },
    { en: "Tongibari", bn: "টংগিবাড়ী" }
  ],
  "Narsingdi": [
    { en: "Narsingdi Sadar", bn: "নরসিংদী সদর" },
    { en: "Belabo", bn: "বেলাবো" },
    { en: "Monohardi", bn: "মনোহরদী" },
    { en: "Palash", bn: "পলাশ" },
    { en: "Raipura", bn: "রায়পুরা" },
    { en: "Shibpur", bn: "শিবপুর" }
  ],
  "Faridpur": [
    { en: "Faridpur Sadar", bn: "ফরিদপুর সদর" },
    { en: "Bhanga", bn: "ভাঙ্গা" },
    { en: "Boalmari", bn: "বোয়ালমারী" },
    { en: "Alfadanga", bn: "আলফাডাঙ্গা" },
    { en: "Madhukhali", bn: "মধুখালী" },
    { en: "Nagarkanda", bn: "নগরকান্দা" },
    { en: "Sadarpur", bn: "সদরপুর" },
    { en: "Charbhadrasan", bn: "চরভদ্রাসন" },
    { en: "Saltha", bn: "সালথা" }
  ],
  "Gopalganj": [
    { en: "Gopalganj Sadar", bn: "গোপালগঞ্জ সদর" },
    { en: "Kashiani", bn: "কাশিয়ানী" },
    { en: "Kotalipara", bn: "কোটালীপাড়া" },
    { en: "Muksudpur", bn: "মুকসুদপুর" },
    { en: "Tungipara", bn: "টুঙ্গিপাড়া" }
  ],
  "Madaripur": [
    { en: "Madaripur Sadar", bn: "মাদারীপুর সদর" },
    { en: "Shibchar", bn: "শিবচর" },
    { en: "Kalkini", bn: "কালকিনি" },
    { en: "Rajoir", bn: "রাজৈর" },
    { en: "Dasar", bn: "ডাসার" }
  ],
  "Rajbari": [
    { en: "Rajbari Sadar", bn: "রাজবাড়ী সদর" },
    { en: "Goalanda", bn: "গোয়ালন্দ" },
    { en: "Pangsha", bn: "পাংশা" },
    { en: "Baliakandi", bn: "বালিয়াকান্দি" },
    { en: "Kalukhali", bn: "কালুখালী" }
  ],
  "Shariatpur": [
    { en: "Shariatpur Sadar", bn: "শরীয়তপুর সদর" },
    { en: "Damudya", bn: "ডামুড্যা" },
    { en: "Naria", bn: "নড়িয়া" },
    { en: "Bhedarganj", bn: "ভেদরগঞ্জ" },
    { en: "Gosairhat", bn: "গোসাইরহাট" },
    { en: "Zanjira", bn: "জাজিরা" },
    { en: "Shakhipur", bn: "সখিপুর" }
  ],
  "Kishoreganj": [
    { en: "Kishoreganj Sadar", bn: "কিশোরগঞ্জ সদর" },
    { en: "Bajitpur", bn: "বাজিতপুর" },
    { en: "Bhairab", bn: "ভৈরব" },
    { en: "Hossainpur", bn: "হোসেনপুর" },
    { en: "Itna", bn: "ইটনা" },
    { en: "Karimganj", bn: "করিমগঞ্জ" },
    { en: "Katiadi", bn: "কটিয়াদী" },
    { en: "Kuliarchar", bn: "কুলিয়ারচর" },
    { en: "Mithamain", bn: "মিঠামইন" },
    { en: "Nikli", bn: "নিকলী" },
    { en: "Pakundia", bn: "পাকুন্দিয়া" },
    { en: "Tarail", bn: "তাড়াইল" },
    { en: "Ashtagram", bn: "অষ্টগ্রাম" }
  ],

  // --- CHATTOGRAM DIVISION (11 DISTRICTS) ---
  "Chattogram": [
    { en: "Chattogram Sadar (Kotwali)", bn: "কোতোয়ালী/চট্টগ্রাম সদর" },
    { en: "Anwara", bn: "আনোয়ারা" },
    { en: "Banshkhali", bn: "বাঁশখালী" },
    { en: "Boalkhali", bn: "বোয়ালখালী" },
    { en: "Chandanaish", bn: "চন্দনাইশ" },
    { en: "Fatikchhari", bn: "ফটিকছড়ি" },
    { en: "Hathazari", bn: "হাটহাজারী" },
    { en: "Lohagara", bn: "লোহাগাড়া" },
    { en: "Mirsharai", bn: "মীরসরাই" },
    { en: "Patiya", bn: "পটিয়া" },
    { en: "Rangunia", bn: "রাঙ্গুনিয়া" },
    { en: "Raozan", bn: "রাউজান" },
    { en: "Sandwip", bn: "সন্দ্বীপ" },
    { en: "Satkania", bn: "সাতকানিয়া" },
    { en: "Sitakunda", bn: "সীতাকুণ্ড" },
    { en: "Karnaphuli", bn: "কর্ণফুলী" },
    { en: "Double Mooring", bn: "ডবল মুরিং" },
    { en: "Pahartali", bn: "পাহাড়তলী" },
    { en: "Panchlaish", bn: "পাঁচলাইশ" },
    { en: "Bakalia", bn: "বাকলিয়া" },
    { en: "Bayezid", bn: "বায়োজিদ" },
    { en: "Halishahar", bn: "হালিশহর" },
    { en: "Khulshi", bn: "খুলশী" },
    { en: "Patenga", bn: "পতেঙ্গা" },
    { en: "Bandar (Chattogram)", bn: "বন্দর (চট্টগ্রাম)" }
  ],
  "Cox's Bazar": [
    { en: "Cox's Bazar Sadar", bn: "কক্সবাজার সদর" },
    { en: "Chakaria", bn: "চকোরিয়া" },
    { en: "Kutubdia", bn: "কুতুবদিয়া" },
    { en: "Maheshkhali", bn: "মহেশখালী" },
    { en: "Ramu", bn: "রামু" },
    { en: "Teknaf", bn: "টেকনাফ" },
    { en: "Ukhia", bn: "উখিয়া" },
    { en: "Pekua", bn: "পেকুয়া" },
    { en: "Eidgaon", bn: "ঈদগাঁও" }
  ],
  "Cumilla": [
    { en: "Cumilla Adarsha Sadar", bn: "কুমিল্লা আদর্শ সদর" },
    { en: "Cumilla Sadar Dakshin", bn: "কুমিল্লা সদর দক্ষিণ" },
    { en: "Barura", bn: "বরুড়া" },
    { en: "Brahmanpara", bn: "ব্রাহ্মণপাড়া" },
    { en: "Burichang", bn: "বুড়িচং" },
    { en: "Chandina", bn: "চান্দিনা" },
    { en: "Chauddagram", bn: "চৌদ্দগ্রাম" },
    { en: "Daudkandi", bn: "দাউদকান্দি" },
    { en: "Debidwar", bn: "দেবিদ্বার" },
    { en: "Homna", bn: "হোমনা" },
    { en: "Laksam", bn: "লাকসাম" },
    { en: "Muradnagar", bn: "মুরাদনগর" },
    { en: "Nangalkot", bn: "নাঙ্গলকোট" },
    { en: "Titas", bn: "তিতাস" },
    { en: "Meghna", bn: "মেঘনা" },
    { en: "Monohargonj", bn: "মনোহরগঞ্জ" },
    { en: "Lalmai", bn: "লালমাই" }
  ],
  "Feni": [
    { en: "Feni Sadar", bn: "ফেনী সদর" },
    { en: "Chhagalnaiya", bn: "ছাগলনাইয়া" },
    { en: "Daganbhuiyan", bn: "দাগনভূঞা" },
    { en: "Parshuram", bn: "পরশুরাম" },
    { en: "Sonagazi", bn: "সোনাগাজী" },
    { en: "Fulgazi", bn: "ফুলগাজী" }
  ],
  "Brahmanbaria": [
    { en: "Brahmanbaria Sadar", bn: "ব্রাহ্মণবাড়িয়া সদর" },
    { en: "Ashuganj", bn: "আশুগঞ্জ" },
    { en: "Akhaura", bn: "আখাউড়া" },
    { en: "Bancharampur", bn: "বাঞ্ছারামপুর" },
    { en: "Bijoynagar", bn: "বিজয়নগর" },
    { en: "Kasba", bn: "কসবা" },
    { en: "Nabinagar", bn: "নবীনগর" },
    { en: "Nasirnagar", bn: "নাসিরনগর" },
    { en: "Sarail", bn: "সরাইল" }
  ],
  "Noakhali": [
    { en: "Noakhali Sadar", bn: "নোয়াখালী সদর" },
    { en: "Begumganj", bn: "বেগমগঞ্জ" },
    { en: "Chatkhil", bn: "চাটখিল" },
    { en: "Companiganj", bn: "কোম্পানীগঞ্জ" },
    { en: "Hatiya", bn: "হাতিয়া" },
    { en: "Senbagh", bn: "সেনবাগ" },
    { en: "Sonaimuri", bn: "সোনাইমুড়ী" },
    { en: "Subarnachar", bn: "সুবর্ণচর" },
    { en: "Kabirhat", bn: "কবিরহাট" }
  ],
  "Lakshmipur": [
    { en: "Lakshmipur Sadar", bn: "লক্ষ্মীপুর সদর" },
    { en: "Raipur", bn: "রায়পুর" },
    { en: "Ramganj", bn: "রামগঞ্জ" },
    { en: "Ramgati", bn: "রামগতি" },
    { en: "Kamalnagar", bn: "কমলনগর" }
  ],
  "Chandpur": [
    { en: "Chandpur Sadar", bn: "চাঁদপুর সদর" },
    { en: "Faridganj", bn: "ফরিদগঞ্জ" },
    { en: "Haimchar", bn: "হাইমচর" },
    { en: "Haziganj", bn: "হাজীগঞ্জ" },
    { en: "Kachua", bn: "কচুয়া" },
    { en: "Matlab Dakshin", bn: "মতলব দক্ষিণ" },
    { en: "Matlab Uttar", bn: "মতলব উত্তর" },
    { en: "Shahrasti", bn: "শাহরাস্তি" }
  ],
  "Khagrachhari": [
    { en: "Khagrachhari Sadar", bn: "খাগড়াছড়ি সদর" },
    { en: "Dighinala", bn: "দীঘিনালা" },
    { en: "Lakshmichhari", bn: "লক্ষ্মীছড়ি" },
    { en: "Mahalchhari", bn: "মহালছড়ি" },
    { en: "Manikchhari", bn: "মানিকছড়ি" },
    { en: "Matiranga", bn: "মাটিরাঙ্গা" },
    { en: "Panchhari", bn: "পানছড়ি" },
    { en: "Ramgarh", bn: "রামগড়" },
    { en: "Guimara", bn: "গুইমারা" }
  ],
  "Rangamati": [
    { en: "Rangamati Sadar", bn: "রাঙ্গামাটি সদর" },
    { en: "Baghaichhari", bn: "বাঘাইছড়ি" },
    { en: "Barkal", bn: "বরকল" },
    { en: "Belaichhari", bn: "বিলাইছড়ি" },
    { en: "Jurachhari", bn: "জুরাছড়ি" },
    { en: "Kaptai", bn: "কাপ্তাই" },
    { en: "Kawkhali", bn: "কাউখালী" },
    { en: "Langadu", bn: "লংগদু" },
    { en: "Naniarchar", bn: "নানিয়ারচর" },
    { en: "Rajasthali", bn: "রাজস্থলী" }
  ],
  "Bandarban": [
    { en: "Bandarban Sadar", bn: "বান্দরবান সদর" },
    { en: "Alikadam", bn: "আলীকদম" },
    { en: "Lama", bn: "লামা" },
    { en: "Naikhongchhari", bn: "নাইক্ষ্যংছড়ি" },
    { en: "Rowangchhari", bn: "রোয়াংছড়ি" },
    { en: "Ruma", bn: "রুমা" },
    { en: "Thanchi", bn: "থানচি" }
  ],

  // --- RAJSHAHI DIVISION (8 DISTRICTS) ---
  "Rajshahi": [
    { en: "Boalia (Rajshahi Sadar)", bn: "বোয়ালিয়া (রাজশাহী সদর)" },
    { en: "Bagha", bn: "বাঘা" },
    { en: "Bagmara", bn: "বাগমারা" },
    { en: "Charghat", bn: "চারঘাট" },
    { en: "Durgapur", bn: "দুর্গাপুর" },
    { en: "Godagari", bn: "গোদাগাড়ী" },
    { en: "Mohanpur", bn: "মোহনপুর" },
    { en: "Paba", bn: "পবা" },
    { en: "Puthia", bn: "পুঠিয়া" },
    { en: "Tanore", bn: "তানোর" },
    { en: "Motihar", bn: "মতিহার" },
    { en: "Rajpara", bn: "রাজপাড়া" },
    { en: "Shah Makhdum", bn: "শাহ মখদুম" }
  ],
  "Bogura": [
    { en: "Bogura Sadar", bn: "বগুড়া সদর" },
    { en: "Adamdighi", bn: "আদমদীঘি" },
    { en: "Dhunat", bn: "ধুনট" },
    { en: "Dhupchanchia", bn: "দুপচাঁচিয়া" },
    { en: "Gabtali", bn: "গাবতলী" },
    { en: "Kahaloo", bn: "কাহালু" },
    { en: "Nandigram", bn: "নন্দীগ্রাম" },
    { en: "Sariakandi", bn: "সারিয়াকান্দি" },
    { en: "Shajahanpur", bn: "শাহজাহানপুর" },
    { en: "Sherpur", bn: "শেরপুর" },
    { en: "Shibganj", bn: "শিবগঞ্জ" },
    { en: "Sonatola", bn: "সোনাতলা" }
  ],
  "Pabna": [
    { en: "Pabna Sadar", bn: "পাবনা সদর" },
    { en: "Atgharia", bn: "আটঘরিয়া" },
    { en: "Bera", bn: "বেড়া" },
    { en: "Bhangura", bn: "ভাঙ্গুড়া" },
    { en: "Chatmohar", bn: "চাটমোহর" },
    { en: "Faridpur", bn: "ফরিদপুর" },
    { en: "Ishwardi", bn: "ঈশ্বরদী" },
    { en: "Santhia", bn: "সাঁথিয়া" },
    { en: "Sujanagar", bn: "সুজানগর" }
  ],
  "Naogaon": [
    { en: "Naogaon Sadar", bn: "নওগাঁ সদর" },
    { en: "Atrai", bn: "আত্রাই" },
    { en: "Badalgachhi", bn: "বদলগাছী" },
    { en: "Dhamoirhat", bn: "ধামইরহাট" },
    { en: "Manda", bn: "মান্দা" },
    { en: "Mohadevpur", bn: "মহাদেবপুর" },
    { en: "Niamatpur", bn: "নিয়ামতপুর" },
    { en: "Patnitala", bn: "পত্নীতলা" },
    { en: "Porsha", bn: "পোরশা" },
    { en: "Raninagar", bn: "রাণীনগর" },
    { en: "Sapahar", bn: "সাপাহার" }
  ],
  "Joypurhat": [
    { en: "Joypurhat Sadar", bn: "জয়পুরহাট সদর" },
    { en: "Akkelpur", bn: "আক্কেলপুর" },
    { en: "Kalai", bn: "কালাই" },
    { en: "Khetlal", bn: "ক্ষেতলাল" },
    { en: "Panchbibi", bn: "পাঁচবিবি" }
  ],
  "Chapai Nawabganj": [
    { en: "Chapai Nawabganj Sadar", bn: "চাঁপাইনবাবগঞ্জ সদর" },
    { en: "Bholahat", bn: "ভোলাহাট" },
    { en: "Gomastapur", bn: "গোমস্তাপুর" },
    { en: "Nachole", bn: "নাচোল" },
    { en: "Shibganj", bn: "শিবগঞ্জ" }
  ],
  "Natore": [
    { en: "Natore Sadar", bn: "নাটোর সদর" },
    { en: "Bagatipara", bn: "বাগাতিপাড়া" },
    { en: "Baraigram", bn: "বড়াইগ্রাম" },
    { en: "Gurudaspur", bn: "গুরুদাসপুর" },
    { en: "Lalpur", bn: "লালপুর" },
    { en: "Singra", bn: "সিংড়া" },
    { en: "Naldanga", bn: "নলডাঙ্গা" }
  ],
  "Sirajganj": [
    { en: "Sirajganj Sadar", bn: "সিরাজগঞ্জ সদর" },
    { en: "Belkuchi", bn: "বেলকুচি" },
    { en: "Chauhali", bn: "চৌহালী" },
    { en: "Kamarkhanda", bn: "কামারখন্দ" },
    { en: "Kazipur", bn: "কাজীপুর" },
    { en: "Raiganj", bn: "রায়গঞ্জ" },
    { en: "Shahjadpur", bn: "শাহজাদপুর" },
    { en: "Tarash", bn: "তাড়াশ" },
    { en: "Ullapara", bn: "উল্লাপাড়া" }
  ],

  // --- KHULNA DIVISION (10 DISTRICTS) ---
  "Khulna": [
    { en: "Khulna Sadar", bn: "খুলনা সদর" },
    { en: "Batiaghata", bn: "বটিয়াঘাটা" },
    { en: "Dacope", bn: "দাকোপ" },
    { en: "Dumuria", bn: "ডুমুরিয়া" },
    { en: "Dighalia", bn: "দিঘলিয়া" },
    { en: "Koyra", bn: "কয়রা" },
    { en: "Paikgachha", bn: "পাইকগাছা" },
    { en: "Phultala", bn: "ফুলতলা" },
    { en: "Rupsha", bn: "রূপসা" },
    { en: "Terokhada", bn: "তেরখাদা" },
    { en: "Daulatpur", bn: "দৌলতপুর" },
    { en: "Khalishpur", bn: "খালিশপুর" },
    { en: "Khan Jahan Ali", bn: "খানজাহান আলী" },
    { en: "Sonadanga", bn: "সোনাডাঙ্গা" },
    { en: "Harintana", bn: "হরিণটানা" }
  ],
  "Jashore": [
    { en: "Jashore Sadar", bn: "যশোর সদর" },
    { en: "Abhaynagar", bn: "অভয়নগর" },
    { en: "Bagherpara", bn: "বাঘারপাড়া" },
    { en: "Chaugachha", bn: "চৌগাছা" },
    { en: "Jhikargachha", bn: "ঝিকরগাছা" },
    { en: "Keshabpur", bn: "কেশবপুর" },
    { en: "Manirampur", bn: "মণিরামপুর" },
    { en: "Sharsha", bn: "শার্শা" }
  ],
  "Satkhira": [
    { en: "Satkhira Sadar", bn: "সাতক্ষীরা সদর" },
    { en: "Assasuni", bn: "আশাশুনি" },
    { en: "Debhata", bn: "দেবহাটা" },
    { en: "Kalaroa", bn: "কলারোয়া" },
    { en: "Kaliganj", bn: "কালীগঞ্জ" },
    { en: "Shyamnagar", bn: "শ্যামনগর" },
    { en: "Tala", bn: "তালা" }
  ],
  "Bagerhat": [
    { en: "Bagerhat Sadar", bn: "বাগেরহাট সদর" },
    { en: "Chitalmari", bn: "চিতলমারী" },
    { en: "Fakirhat", bn: "ফকিরহাট" },
    { en: "Kachua", bn: "কচুয়া" },
    { en: "Mollahat", bn: "মোল্লাহাট" },
    { en: "Mongla", bn: "মোংলা" },
    { en: "Morrelganj", bn: "মোড়েলগঞ্জ" },
    { en: "Rampal", bn: "রামপাল" },
    { en: "Sarankhola", bn: "শরণখোলা" }
  ],
  "Kushtia": [
    { en: "Kushtia Sadar", bn: "কুষ্টিয়া সদর" },
    { en: "Bheramara", bn: "ভেড়ামারা" },
    { en: "Daulatpur", bn: "দৌলতপুর" },
    { en: "Khoksa", bn: "খোকসা" },
    { en: "Kumarkhali", bn: "কুমারখালী" },
    { en: "Mirpur", bn: "মিরপুর" }
  ],
  "Meherpur": [
    { en: "Meherpur Sadar", bn: "মেহেরপুর সদর" },
    { en: "Gangni", bn: "গাংনী" },
    { en: "Mujibnagar", bn: "মুজিবনগর" }
  ],
  "Chuadanga": [
    { en: "Chuadanga Sadar", bn: "চুয়াডাঙ্গা সদর" },
    { en: "Alamdanga", bn: "আলমডাঙ্গা" },
    { en: "Damurhuda", bn: "দামুড়হুদা" },
    { en: "Jibannagar", bn: "জীবননগর" }
  ],
  "Jhenaidah": [
    { en: "Jhenaidah Sadar", bn: "ঝিনাইদহ সদর" },
    { en: "Harinakundu", bn: "হরিণাকুণ্ডু" },
    { en: "Kaliganj", bn: "কালীগঞ্জ" },
    { en: "Kotchandpur", bn: "কোটচাঁদপুর" },
    { en: "Maheshpur", bn: "মহেশপুর" },
    { en: "Shailkupa", bn: "শৈলকুপা" }
  ],
  "Magura": [
    { en: "Magura Sadar", bn: "মাগুরা সদর" },
    { en: "Mohammadpur", bn: "মহম্মদপুর" },
    { en: "Shalikha", bn: "শালিখা" },
    { en: "Sreepur", bn: "শ্রীপুর" }
  ],
  "Narail": [
    { en: "Narail Sadar", bn: "নড়াইল সদর" },
    { en: "Kalia", bn: "কালিয়া" },
    { en: "Lohagara", bn: "লোহাগাড়া" }
  ],

  // --- BARISHAL DIVISION (6 DISTRICTS) ---
  "Barishal": [
    { en: "Barishal Sadar (Kotwali)", bn: "বরিশাল সদর (কোতোয়ালী)" },
    { en: "Agailjhara", bn: "আগৈলঝাড়া" },
    { en: "Babuganj", bn: "বাবুগঞ্জ" },
    { en: "Bakerganj", bn: "বাকেরগঞ্জ" },
    { en: "Banaripara", bn: "বানারীপাড়া" },
    { en: "Gaurnadi", bn: "গৌরনদী" },
    { en: "Hizla", bn: "হিজলা" },
    { en: "Mehendiganj", bn: "মেহেন্দিগঞ্জ" },
    { en: "Muladi", bn: "মুলাদী" },
    { en: "Wazirpur", bn: "উজিরপুর" }
  ],
  "Patuakhali": [
    { en: "Patuakhali Sadar", bn: "পটুয়াখালী সদর" },
    { en: "Bauphal", bn: "বাউফল" },
    { en: "Dashmina", bn: "দশমিনা" },
    { en: "Galachipa", bn: "গলাচিপা" },
    { en: "Kalapara", bn: "কলাপাড়া" },
    { en: "Mirzaganj", bn: "মির্জাগঞ্জ" },
    { en: "Rangabali", bn: "রাঙ্গাবালী" },
    { en: "Dumki", bn: "দুমকি" }
  ],
  "Bhola": [
    { en: "Bhola Sadar", bn: "ভোলা সদর" },
    { en: "Burhanuddin", bn: "বোরহানউদ্দিন" },
    { en: "Char Fasson", bn: "চরফ্যাশন" },
    { en: "Daulatkhan", bn: "দৌলতখান" },
    { en: "Lalmohan", bn: "লালমোহন" },
    { en: "Manpura", bn: "মনপুরা" },
    { en: "Tazumuddin", bn: "তজুমদ্দিন" }
  ],
  "Pirojpur": [
    { en: "Pirojpur Sadar", bn: "পিরোজপুর সদর" },
    { en: "Bhandaria", bn: "ভাণ্ডারিয়া" },
    { en: "Kawkhali", bn: "কাউখালী" },
    { en: "Mathbaria", bn: "মঠবাড়িয়া" },
    { en: "Nazirpur", bn: "নাজিরপুর" },
    { en: "Nesarabad (Swarupkathi)", bn: "স্বরূপকাঠি (নেছারাবাদ)" },
    { en: "Indurkani (Zianagar)", bn: "ইন্দুরকানী (জিয়ানগর)" }
  ],
  "Barguna": [
    { en: "Barguna Sadar", bn: "বরগুনা সদর" },
    { en: "Amtali", bn: "আমতলী" },
    { en: "Bamna", bn: "বামনা" },
    { en: "Betagi", bn: "বেতাগী" },
    { en: "Patharghata", bn: "পাথরঘাটা" },
    { en: "Taltali", bn: "তালতলী" }
  ],
  "Jhalokathi": [
    { en: "Jhalokathi Sadar", bn: "ঝালকাঠি সদর" },
    { en: "Kathalia", bn: "কাঠালিয়া" },
    { en: "Nalchity", bn: "নলছিটি" },
    { en: "Rajapur", bn: "রাজাপুর" }
  ],

  // --- SYLHET DIVISION (4 DISTRICTS) ---
  "Sylhet": [
    { en: "Sylhet Sadar", bn: "সিলেট সদর" },
    { en: "Beanibazar", bn: "বিয়ানীবাজার" },
    { en: "Bishwanath", bn: "বিশ্বনাথ" },
    { en: "Dakshin Surma", bn: "দক্ষিণ সুরমা" },
    { en: "Fenchuganj", bn: "ফেঞ্চুগঞ্জ" },
    { en: "Golapganj", bn: "গোলাপগঞ্জ" },
    { en: "Gowainghat", bn: "গোয়াইনঘাট" },
    { en: "Jaintiapur", bn: "জৈন্তাপুর" },
    { en: "Kanaighat", bn: "কানাইঘাট" },
    { en: "Companiganj", bn: "কোম্পানীগঞ্জ" },
    { en: "Zakiganj", bn: "জকিগঞ্জ" },
    { en: "Osmani Nagar", bn: "ওসমানীনগর" }
  ],
  "Moulvibazar": [
    { en: "Moulvibazar Sadar", bn: "মৌলভীবাজার সদর" },
    { en: "Barlekha", bn: "বড়লেখা" },
    { en: "Juri", bn: "জুড়ী" },
    { en: "Kamalganj", bn: "কমলগঞ্জ" },
    { en: "Kulaura", bn: "কুলাউড়া" },
    { en: "Rajnagar", bn: "রাজনগর" },
    { en: "Sreemangal", bn: "শ্রীমঙ্গল" }
  ],
  "Habiganj": [
    { en: "Habiganj Sadar", bn: "হবিগঞ্জ সদর" },
    { en: "Ajmiriganj", bn: "আজমিরীগঞ্জ" },
    { en: "Bahubal", bn: "বাহুবল" },
    { en: "Baniyachong", bn: "বানিয়াচং" },
    { en: "Chunarughat", bn: "চুনারুঘাট" },
    { en: "Lakhai", bn: "লাখাই" },
    { en: "Madhabpur", bn: "মাধবপুর" },
    { en: "Nabiganj", bn: "নবীগঞ্জ" },
    { en: "Sayestaganj", bn: "শায়েস্তাগঞ্জ" }
  ],
  "Sunamganj": [
    { en: "Sunamganj Sadar", bn: "সুনামগঞ্জ সদর" },
    { en: "Bishwamvarpur", bn: "বিশ্বম্ভরপুর" },
    { en: "Chhatak", bn: "ছাতক" },
    { en: "Derai", bn: "দিরাই" },
    { en: "Dharamapasha", bn: "ধর্মপাশা" },
    { en: "Dowarabazar", bn: "দোয়ারাবাজার" },
    { en: "Jagannathpur", bn: "জগন্নাথপুর" },
    { en: "Jamalganj", bn: "জামালগঞ্জ" },
    { en: "Sullah", bn: "শাল্লা" },
    { en: "Tahirpur", bn: "তাহিরপুর" },
    { en: "Shantiganj", bn: "শান্তিগঞ্জ" },
    { en: "Madhyanagar", bn: "মধ্যনগর" }
  ],

  // --- RANGPUR DIVISION (8 DISTRICTS) ---
  "Rangpur": [
    { en: "Rangpur Sadar", bn: "রংপুর সদর" },
    { en: "Badarganj", bn: "বদরগঞ্জ" },
    { en: "Gangachhara", bn: "গঙ্গাচড়া" },
    { en: "Kaunia", bn: "কাউনিয়া" },
    { en: "Mithapukur", bn: "মিঠাপুকুর" },
    { en: "Pirgachha", bn: "পীরগাছা" },
    { en: "Pirganj", bn: "পীরগঞ্জ" },
    { en: "Taraganj", bn: "তারাগঞ্জ" }
  ],
  "Dinajpur": [
    { en: "Dinajpur Sadar", bn: "দিনাজপুর সদর" },
    { en: "Birampur", bn: "বিরামপুর" },
    { en: "Birganj", bn: "বীরগঞ্জ" },
    { en: "Birol", bn: "বিরল" },
    { en: "Bochaganj", bn: "বোচাগঞ্জ" },
    { en: "Chirirbandar", bn: "চিরিরবন্দর" },
    { en: "Phulbari", bn: "ফুলবাড়ী" },
    { en: "Ghoraghat", bn: "ঘোড়াঘাট" },
    { en: "Hakimpur", bn: "হাকিমপুর" },
    { en: "Kaharole", bn: "কাহারোল" },
    { en: "Khansama", bn: "খানসামা" },
    { en: "Nawabganj", bn: "নবাবগঞ্জ" },
    { en: "Parbatipur", bn: "পার্বতীপুর" }
  ],
  "Gaibandha": [
    { en: "Gaibandha Sadar", bn: "গাইবান্ধা সদর" },
    { en: "Gobindaganj", bn: "গোবিন্দগঞ্জ" },
    { en: "Palashbari", bn: "পলাশবাড়ী" },
    { en: "Sadullapur", bn: "সাদুল্লাপুর" },
    { en: "Sughatta", bn: "সাঘাটা" },
    { en: "Sundarganj", bn: "সুন্দরগঞ্জ" },
    { en: "Fulchhari", bn: "ফুলছড়ি" }
  ],
  "Kurigram": [
    { en: "Kurigram Sadar", bn: "কুড়িগ্রাম সদর" },
    { en: "Bhurungamari", bn: "ভুরুঙ্গামারী" },
    { en: "Char Rajibpur", bn: "চর রাজিবপুর" },
    { en: "Chilmari", bn: "চিলমারী" },
    { en: "Nageshwari", bn: "নাগেশ্বরী" },
    { en: "Phulbari", bn: "ফুলবাড়ী" },
    { en: "Rajarhat", bn: "রাজারহাট" },
    { en: "Rowmari", bn: "রৌমারী" },
    { en: "Ulipur", bn: "উলিপুর" }
  ],
  "Nilphamari": [
    { en: "Nilphamari Sadar", bn: "নীলফামারী সদর" },
    { en: "Dimla", bn: "ডিমলা" },
    { en: "Domar", bn: "ডোমার" },
    { en: "Jaldhaka", bn: "জলঢাকা" },
    { en: "Kishoreganj", bn: "কিশোরগঞ্জ" },
    { en: "Syedpur", bn: "সৈয়দপুর" }
  ],
  "Panchagarh": [
    { en: "Panchagarh Sadar", bn: "পঞ্চগড় সদর" },
    { en: "Atwari", bn: "আটোয়ারী" },
    { en: "Boda", bn: "বোদা" },
    { en: "Debiganj", bn: "দেবীগঞ্জ" },
    { en: "Tetulia", bn: "তেঁতুলিয়া" }
  ],
  "Thakurgaon": [
    { en: "Thakurgaon Sadar", bn: "ঠাকুরগাঁও সদর" },
    { en: "Baliadangi", bn: "বালিয়াডাঙ্গী" },
    { en: "Haripur", bn: "হরিপুর" },
    { en: "Pirganj", bn: "পীরগঞ্জ" },
    { en: "Ranisankail", bn: "রাণীশংকৈল" }
  ],
  "Lalmonirhat": [
    { en: "Lalmonirhat Sadar", bn: "লালমনিরহাট সদর" },
    { en: "Aditmari", bn: "আদিতমারী" },
    { en: "Hatibandha", bn: "হাতীবান্ধা" },
    { en: "Kaliganj", bn: "কালীগঞ্জ" },
    { en: "Patgram", bn: "পাটগ্রাম" }
  ],

  // --- MYMENSINGH DIVISION (4 DISTRICTS) ---
  "Mymensingh": [
    { en: "Mymensingh Sadar", bn: "ময়মনসিংহ সদর" },
    { en: "Bhaluka", bn: "ভালুকা" },
    { en: "Dhobaura", bn: "ধোবাউড়া" },
    { en: "Fulbaria", bn: "ফুলবাড়ীয়া" },
    { en: "Gaffargaon", bn: "গফরগাঁও" },
    { en: "Gauripur", bn: "গৌরীপুর" },
    { en: "Haluaghat", bn: "হালুয়াঘাট" },
    { en: "Ishwarganj", bn: "ঈশ্বরগঞ্জ" },
    { en: "Muktagacha", bn: "মুক্তাগাছা" },
    { en: "Nandail", bn: "নান্দাইল" },
    { en: "Phulpur", bn: "ফুলপুর" },
    { en: "Trishal", bn: "ত্রিশাল" },
    { en: "Tara Khanda", bn: "তারাকান্দা" }
  ],
  "Netrokona": [
    { en: "Netrokona Sadar", bn: "নেত্রকোণা সদর" },
    { en: "Atpara", bn: "আটপাড়া" },
    { en: "Barhatta", bn: "বারহাট্টা" },
    { en: "Durgapur", bn: "দুর্গাপুর" },
    { en: "Khaliajuri", bn: "খালিয়াজুড়ী" },
    { en: "Kalmakanda", bn: "কলমাকান্দা" },
    { en: "Kendua", bn: "কেন্দুয়া" },
    { en: "Madan", bn: "মদন" },
    { en: "Mohanganj", bn: "মোহনগঞ্জ" },
    { en: "Purbadhala", bn: "পূর্বধলা" }
  ],
  "Sherpur": [
    { en: "Sherpur Sadar", bn: "শেরপুর সদর" },
    { en: "Jhenaigati", bn: "ঝিনাইগাতী" },
    { en: "Nakla", bn: "নকলা" },
    { en: "Nalitabari", bn: "নালিতাবাড়ী" },
    { en: "Sreebardi", bn: "শ্রীবরদী" }
  ],
  "Jamalpur": [
    { en: "Jamalpur Sadar", bn: "জামালপুর সদর" },
    { en: "Bakshiganj", bn: "বকশীগঞ্জ" },
    { en: "Dewanganj", bn: "দেওয়ানগঞ্জ" },
    { en: "Islampur", bn: "ইসলামপুর" },
    { en: "Madarganj", bn: "মাদারগঞ্জ" },
    { en: "Melandaha", bn: "মেলান্দহ" },
    { en: "Sarishabari", bn: "সরিষাবাড়ী" }
  ]
};

// Convenience simplified structure compatible with existing code
export const BD_LOCATIONS = {
  divisions: BD_DIVISIONS.map(d => d.en),
  districts: Object.fromEntries(
    Object.entries(BD_DISTRICTS).map(([div, distList]) => [div, distList.map(d => d.en)])
  ),
  upazilas: Object.fromEntries(
    Object.entries(BD_UPAZILAS).map(([dist, upList]) => [dist, upList.map(u => u.en)])
  )
};

// Helper function to get localized display label
export const getLocationLabel = (item: LocationItem, language: 'bn' | 'en' = 'bn'): string => {
  if (language === 'bn') {
    return `${item.bn} (${item.en})`;
  }
  return item.en;
};
