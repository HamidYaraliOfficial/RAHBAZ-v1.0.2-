// Vehicle catalogue. Every vehicle type has its own size, movement speed, drawing routine and score value.
// Row: [id, nameFa, nameEn, category, length(cells along travel axis), width(cells), art, defaultColor, speed, points]
// Colour indices: 0 blue 1 orange 2 yellow 3 green 4 red 5 purple 6 teal 7 pink 8 white 9 gray 10 navy
const ROWS = [
  // --- Motorcycles (1 cell)
  ['moto_city', 'موتورسیکلت شهری', 'City Motorcycle', 'moto', 1, 1, 'moto', 4, 1.35, 10],
  ['moto_sport', 'موتور اسپرت', 'Sport Bike', 'moto', 1, 1, 'moto', 0, 1.4, 12],
  ['moto_heavy', 'موتور سنگین', 'Heavy Cruiser', 'moto', 1, 1, 'moto', 10, 1.2, 14],
  ['scooter', 'اسکوتر', 'Scooter', 'moto', 1, 1, 'moto', 7, 1.3, 10],
  ['moto_courier', 'موتور پیک', 'Courier Bike', 'moto', 1, 1, 'moto', 1, 1.35, 12],
  ['moto_police', 'موتورسیکلت پلیس', 'Police Bike', 'moto', 1, 1, 'moto', 8, 1.4, 14],
  ['trike', 'موتور سه‌چرخ', 'Trike', 'moto', 1, 1, 'moto', 3, 1.1, 12],
  ['bicycle', 'دوچرخه', 'Bicycle', 'moto', 1, 1, 'moto', 2, 1.0, 8],
  // --- Cars (2 cells)
  ['hatch', 'هاچ‌بک', 'Hatchback', 'car', 2, 1, 'car', 0, 1.2, 14],
  ['sedan', 'سدان', 'Sedan', 'car', 2, 1, 'car', 9, 1.2, 14],
  ['mini', 'خودروی کوچک شهری', 'City Mini', 'car', 2, 1, 'car', 2, 1.25, 12],
  ['luxury', 'خودروی لوکس', 'Luxury Car', 'car', 2, 1, 'car', 10, 1.15, 18],
  ['sports', 'خودروی اسپرت', 'Sports Car', 'car', 2, 1, 'car', 4, 1.4, 18],
  ['suv', 'شاسی‌بلند', 'SUV', 'car', 2, 1, 'car', 3, 1.1, 16],
  ['crossover', 'کراس‌اوور', 'Crossover', 'car', 2, 1, 'car', 6, 1.15, 16],
  ['pickup', 'پیکاپ', 'Pickup', 'car', 2, 1, 'car', 1, 1.05, 16],
  ['wanet', 'وانت', 'Utility Truck', 'car', 2, 1, 'car', 9, 1.0, 14],
  ['taxi', 'تاکسی', 'Taxi', 'car', 2, 1, 'car', 2, 1.2, 14],
  ['racer', 'خودروی مسابقه‌ای', 'Race Car', 'car', 2, 1, 'car', 4, 1.5, 20],
  ['classic', 'خودروی کلاسیک', 'Classic Car', 'car', 2, 1, 'car', 8, 1.0, 18],
  ['ev', 'خودروی برقی', 'Electric Car', 'car', 2, 1, 'car', 6, 1.25, 16],
  ['police_car', 'خودروی پلیس', 'Police Car', 'car', 2, 1, 'car', 8, 1.3, 18],
  ['ambulance', 'آمبولانس', 'Ambulance', 'car', 2, 1, 'car', 8, 1.25, 22],
  ['fire_mini', 'ماشین آتش‌نشانی کوچک', 'Mini Fire Truck', 'car', 2, 1, 'car', 4, 1.15, 20],
  // --- Vans & minibuses
  ['van_city', 'ون شهری', 'City Van', 'van', 2, 1, 'van', 8, 1.1, 16],
  ['van_cargo', 'ون حمل بار', 'Cargo Van', 'van', 3, 1, 'van', 9, 1.0, 18],
  ['van_pass', 'ون مسافربری', 'Passenger Van', 'van', 3, 1, 'van', 0, 1.0, 18],
  ['van_police', 'ون پلیس', 'Police Van', 'van', 3, 1, 'van', 10, 1.0, 20],
  ['minibus_city', 'مینی‌بوس شهری', 'City Minibus', 'van', 3, 1, 'van', 3, 0.95, 20],
  ['minibus_school', 'مینی‌بوس مدرسه', 'School Minibus', 'van', 3, 1, 'van', 2, 0.95, 20],
  ['minibus_pass', 'مینی‌بوس مسافربری', 'Coach Minibus', 'van', 3, 1, 'van', 5, 0.95, 20],
  // --- Buses
  ['bus_city', 'اتوبوس شهری', 'City Bus', 'bus', 3, 1, 'bus', 0, 0.9, 24],
  ['bus_inter', 'اتوبوس بین‌شهری', 'Coach Bus', 'bus', 4, 1, 'bus', 5, 0.9, 28],
  ['bus_school', 'اتوبوس مدرسه', 'School Bus', 'bus', 3, 1, 'bus', 2, 0.9, 24],
  ['bus_ev', 'اتوبوس برقی', 'Electric Bus', 'bus', 3, 1, 'bus', 3, 0.95, 26],
  ['bus_tour', 'اتوبوس گردشگری', 'Tour Bus', 'bus', 4, 1, 'bus', 7, 0.9, 28],
  ['bus_double', 'اتوبوس دوطبقه', 'Double-Decker', 'bus', 4, 1, 'bus', 4, 0.85, 30],
  ['bus_artic', 'اتوبوس مفصلی', 'Articulated Bus', 'bus', 4, 1, 'bus', 1, 0.85, 30],
  // --- Trucks
  ['truck_small', 'کامیون کوچک', 'Small Truck', 'truck', 3, 1, 'truck', 1, 1.0, 20],
  ['truck_mid', 'کامیون متوسط', 'Medium Truck', 'truck', 3, 1, 'truck', 0, 0.95, 22],
  ['truck_heavy', 'کامیون سنگین', 'Heavy Truck', 'truck', 4, 1, 'truck', 10, 0.8, 28],
  ['truck_cargo', 'کامیون باری', 'Cargo Truck', 'truck', 3, 1, 'truck', 9, 0.9, 22],
  ['truck_reefer', 'کامیون یخچال‌دار', 'Refrigerated Truck', 'truck', 3, 1, 'truck', 8, 0.9, 24],
  ['truck_carcarrier', 'کامیون حمل خودرو', 'Car Carrier', 'truck', 4, 1, 'truck', 6, 0.8, 28],
  ['truck_tanker', 'کامیون مخزن‌دار', 'Tanker Truck', 'truck', 3, 1, 'truck', 9, 0.85, 26],
  ['truck_garbage', 'کامیون حمل زباله', 'Garbage Truck', 'truck', 3, 1, 'truck', 3, 0.85, 24],
  ['truck_dump', 'کامیون کمپرسی', 'Dump Truck', 'truck', 3, 1, 'truck', 2, 0.85, 26],
  ['truck_fire', 'کامیون آتش‌نشانی سنگین', 'Heavy Fire Truck', 'truck', 4, 1, 'truck', 4, 0.85, 30],
  ['truck_tow', 'کامیون امداد جاده‌ای', 'Tow Truck', 'truck', 3, 1, 'truck', 2, 0.95, 24],
  // --- Semi-trailers & tractors (single movable unit)
  ['tractor_unit', 'کشنده بدون بار', 'Tractor Unit', 'trailer', 3, 1, 'trailer', 0, 0.9, 24],
  ['semi', 'کشنده با تریلر', 'Semi-Trailer', 'trailer', 5, 1, 'trailer', 0, 0.75, 34],
  ['flatbed', 'تریلی کفی', 'Flatbed Trailer', 'trailer', 5, 1, 'trailer', 1, 0.75, 34],
  ['container', 'تریلی کانتینربر', 'Container Trailer', 'trailer', 5, 1, 'trailer', 6, 0.75, 36],
  ['reefer_trailer', 'تریلی یخچال‌دار', 'Reefer Trailer', 'trailer', 5, 1, 'trailer', 8, 0.75, 36],
  ['tanker_trailer', 'تریلی مخزن‌دار', 'Tanker Trailer', 'trailer', 5, 1, 'trailer', 9, 0.7, 38],
  ['car_trailer', 'تریلی حمل خودرو', 'Car Hauler', 'trailer', 5, 1, 'trailer', 5, 0.7, 38],
  ['heavy_hauler', 'تریلی حمل ماشین‌آلات سنگین', 'Heavy Hauler', 'trailer', 6, 1, 'trailer', 2, 0.65, 44],
  ['rigid_artic', 'کامیون مفصلی', 'Articulated Truck', 'trailer', 4, 1, 'trailer', 4, 0.8, 30],
  // --- Construction & industrial
  ['excavator', 'بیل مکانیکی', 'Excavator', 'machine', 2, 2, 'machine', 2, 0.7, 30],
  ['loader', 'لودر', 'Wheel Loader', 'machine', 2, 2, 'machine', 1, 0.8, 28],
  ['bulldozer', 'بولدوزر', 'Bulldozer', 'machine', 2, 2, 'machine', 2, 0.7, 30],
  ['forklift', 'لیفتراک', 'Forklift', 'machine', 2, 1, 'machine', 1, 1.0, 20],
  ['crane', 'جرثقیل متحرک', 'Mobile Crane', 'machine', 3, 2, 'machine', 2, 0.65, 40],
  ['roller', 'غلتک راه‌سازی', 'Road Roller', 'machine', 2, 2, 'machine', 2, 0.6, 28],
  ['mixer', 'ماشین بتن‌ساز', 'Concrete Mixer', 'machine', 3, 1, 'machine', 9, 0.8, 26],
  ['mining', 'کامیون معدن', 'Mining Truck', 'machine', 3, 2, 'machine', 2, 0.6, 40],
  ['tractor', 'تراکتور', 'Tractor', 'machine', 2, 1, 'machine', 3, 0.9, 20],
  ['harvester', 'ماشین کشاورزی', 'Harvester', 'machine', 3, 2, 'machine', 4, 0.65, 38],
  ['snowplow', 'ماشین برف‌روب', 'Snowplow', 'machine', 3, 1, 'machine', 1, 0.85, 26],
  ['ind_garbage', 'ماشین حمل زباله صنعتی', 'Industrial Waste Truck', 'machine', 3, 1, 'machine', 9, 0.8, 26],
  // --- Special service vehicles
  ['money', 'خودروی حمل پول', 'Armored Van', 'special', 3, 1, 'special', 9, 0.9, 24],
  ['city_service', 'خودروی سرویس شهری', 'City Service Van', 'special', 2, 1, 'special', 3, 1.1, 16],
  ['animal', 'ماشین حمل حیوانات', 'Animal Transporter', 'special', 3, 1, 'special', 8, 0.9, 22],
  ['road_service', 'خودروی خدمات جاده‌ای', 'Road Service Car', 'special', 2, 1, 'special', 2, 1.1, 18],
  ['rescue', 'ماشین امداد', 'Rescue Vehicle', 'special', 3, 1, 'special', 4, 1.0, 26],
];

export const TYPES = ROWS.map((r) => ({
  id: r[0], fa: r[1], en: r[2], cat: r[3], len: r[4], wid: r[5], art: r[6], col: r[7], spd: r[8], pts: r[9],
  imp: r[4] + r[5] - 1,
}));
export const TYPE_BY_ID = {};
TYPES.forEach((t) => { TYPE_BY_ID[t.id] = t; });
export const CATEGORIES = ['moto', 'car', 'van', 'bus', 'truck', 'trailer', 'machine', 'special'];
export const CAT_NAMES = {
  moto: ['موتورسیکلت‌ها', 'Motorcycles'], car: ['خودروهای سواری', 'Cars'], van: ['ون و مینی‌بوس', 'Vans & Minibuses'],
  bus: ['اتوبوس‌ها', 'Buses'], truck: ['کامیون‌ها', 'Trucks'], trailer: ['تریلی و کشنده', 'Semi-Trailers'],
  machine: ['ماشین‌آلات', 'Heavy Machinery'], special: ['وسایل خدماتی', 'Service Vehicles'],
};
export const byCat = (cat) => TYPES.filter((t) => t.cat === cat);
export const ids = (arr) => arr.map((s) => s);
