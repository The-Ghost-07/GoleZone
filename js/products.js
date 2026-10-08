/* ===== GoalZone product data =====
   A normal global array (no fetch / modules) so index.html works by double-click.
   All image paths are created by img() below - replace that one function
   (or the images[] of any product) when you have real photos in images/. */

function img(text) { return "https://placehold.co/600x600?text=" + encodeURIComponent(text); }

// Local product photo: put your file at images/products/<id>.jpg (or .png/.webp - see below)
function prodImg(id) { return "images/products/" + id + ".jpg"; }

// Categories: slug is used in URLs (products.html?category=jerseys)
const CATEGORIES = [
  { slug: "jerseys",   name: "Jerseys",                    icon: "" },
  { slug: "boots",     name: "Football Boots / Studs",     icon: "" },
  { slug: "turf",      name: "Turf & Futsal Shoes",        icon: "" },
  { slug: "shin-pads", name: "Shin Pads",                  icon: "" },
  { slug: "gloves",    name: "Goalkeeper Gloves & Kits",   icon: "" },
  { slug: "footballs", name: "Footballs",                  icon: "⚽" },
  { slug: "apparel",   name: "Socks, Shorts & Track Suits",icon: "" },
  { slug: "bags",      name: "Bags & Bottles",             icon: "" },
  { slug: "training",  name: "Training Gear",              icon: "" },
  { slug: "goals",     name: "Goal Posts, Nets & Pumps",   icon: "" },
  { slug: "supports",  name: "Armbands, Supports & Tapes", icon: "" },
  { slug: "fan",       name: "Fan Merchandise",            icon: "" }
];
const CLUBS = ["Real Madrid","Barcelona","Man United","Man City","Liverpool","Arsenal","Chelsea","PSG","Bayern","Juventus","AC Milan","Inter"];
const NATIONS = ["India","Argentina","Brazil","France","Portugal","England","Germany","Spain"];
const BRANDS = ["Nike","Adidas","Puma","Mizuno","Nivia","Vector X"];

/* One row per product (short on purpose - easy to add your own):
   [name, category, subCategory, brand, club, nation, price, mrp, rating, reviews, flags]
   flags: "b" = best seller, "d" = deal of the day */
const RAW = [
  ["Real Madrid Home Jersey 24/25","jerseys","Home Kit","Adidas","Real Madrid","",1799,3999,4.6,1280,"bd"],
  ["FC Barcelona Home Jersey 24/25","jerseys","Home Kit","Nike","Barcelona","",1799,3999,4.5,1105,"b"],
  ["Manchester United Home Jersey","jerseys","Home Kit","Adidas","Man United","",1699,3799,4.4,930,""],
  ["Manchester City Home Jersey","jerseys","Home Kit","Puma","Man City","",1699,3799,4.5,760,"d"],
  ["Liverpool Home Jersey","jerseys","Home Kit","Nike","Liverpool","",1749,3899,4.6,845,"b"],
  ["Arsenal Home Jersey","jerseys","Home Kit","Adidas","Arsenal","",1649,3699,4.3,610,""],
  ["Chelsea Away Jersey","jerseys","Away Kit","Nike","Chelsea","",1599,3599,4.2,540,""],
  ["PSG Third Kit Jersey","jerseys","Third Kit","Nike","PSG","",1899,4199,4.4,470,"d"],
  ["Bayern Munich Home Jersey","jerseys","Home Kit","Adidas","Bayern","",1699,3799,4.5,390,""],
  ["Juventus Away Jersey","jerseys","Away Kit","Adidas","Juventus","",1599,3599,4.1,310,""],
  ["AC Milan Home Jersey","jerseys","Home Kit","Puma","AC Milan","",1649,3699,4.3,280,""],
  ["Inter Milan Home Jersey","jerseys","Home Kit","Nike","Inter","",1649,3699,4.4,335,""],
  ["India National Team Home Jersey","jerseys","Home Kit","Nivia","","India",999,1999,4.7,2050,"b"],
  ["Argentina Home Jersey (Fan)","jerseys","Home Kit","Adidas","","Argentina",1899,4299,4.8,3020,"bd"],
  ["Brazil Home Jersey (Fan)","jerseys","Home Kit","Nike","","Brazil",1799,3999,4.5,1450,""],
  ["France Home Jersey (Player)","jerseys","Home Kit","Nike","","France",3499,7999,4.6,420,""],
  ["Portugal Home Jersey","jerseys","Home Kit","Nike","","Portugal",1799,3999,4.6,1670,"b"],
  ["England Away Jersey","jerseys","Away Kit","Nike","","England",1699,3799,4.3,380,""],
  ["Nike Mercurial Vapor FG Boots","boots","FG","Nike","","",4999,9999,4.5,860,"b"],
  ["Adidas Predator Accuracy FG Boots","boots","FG","Adidas","","",4499,8999,4.4,640,""],
  ["Puma Future Z SG Boots","boots","SG","Puma","","",3999,7999,4.3,310,"d"],
  ["Mizuno Morelia Neo AG Boots","boots","AG","Mizuno","","",5499,10999,4.6,205,""],
  ["Nivia Carbonite Football Studs","boots","FG","Nivia","","",1299,2499,4.1,1900,"b"],
  ["Vector X Striker Football Studs","boots","FG","Vector X","","",999,1999,4.0,1220,"d"],
  ["Nike Tiempo Turf Shoes","turf","Turf","Nike","","",3299,6499,4.4,410,""],
  ["Adidas Futsal Indoor Shoes","turf","Futsal","Adidas","","",2799,5499,4.3,350,""],
  ["Nivia Shin Guards Pro","shin-pads","Shin Guard","Nivia","","",349,699,4.2,2600,"b"],
  ["Adidas Match Shin Pads","shin-pads","Shin Guard","Adidas","","",899,1799,4.5,720,""],
  ["Nike GK Match Gloves","gloves","GK Gloves","Nike","","",2499,4999,4.5,290,""],
  ["Vector X GK Gloves + Kit","gloves","GK Kit","Vector X","","",799,1599,4.0,510,"d"],
  ["Adidas Champions League Match Ball (Size 5)","footballs","Match","Adidas","","",2999,5999,4.7,930,"b"],
  ["Nivia Trainer Football (Size 5)","footballs","Training","Nivia","","",599,1199,4.3,4100,"bd"],
  ["Street Football (Size 4)","footballs","Street","Vector X","","",449,899,4.1,860,""],
  ["Nike Football Socks (Pair)","apparel","Socks","Nike","","",499,999,4.4,780,""],
  ["Puma Training Shorts","apparel","Shorts","Puma","","",799,1599,4.3,540,""],
  ["Adidas Track Suit","apparel","Track Suit","Adidas","","",2499,4999,4.4,610,"d"],
  ["Nike Kit Bag (Large)","bags","Kit Bag","Nike","","",1499,2999,4.4,470,""],
  ["Nivia Sports Water Bottle 750ml","bags","Bottle","Nivia","","",249,499,4.2,1500,""],
  ["Training Cones Set (50 pcs)","training","Cones","Vector X","","",399,799,4.3,990,"b"],
  ["Agility Ladder 6m","training","Agility","Nivia","","",599,1199,4.2,610,""],
  ["Training Bibs (Pack of 10)","training","Bibs","Nivia","","",699,1399,4.1,340,""],
  ["Foldable Goal Post (Pair)","goals","Goal Post","Vector X","","",3499,6999,4.2,150,""],
  ["Football Goal Net (Pair)","goals","Nets","Nivia","","",1299,2599,4.0,220,""],
  ["Double-Action Ball Pump","goals","Pump","Nivia","","",249,499,4.3,2300,"b"],
  ["Captain Armband","supports","Armband","Adidas","","",199,399,4.5,840,""],
  ["Ankle Support Brace","supports","Ankle Support","Nivia","","",349,699,4.2,760,""],
  ["Sports Tape Roll (Pack of 3)","supports","Tape","Vector X","","",299,599,4.1,420,""],
  ["Team Scarf - Red","fan","Scarf","Nivia","","",399,799,4.2,310,""],
  ["Fan Cap","fan","Cap","Nike","","",449,899,4.3,260,""],
  ["Football Legends Poster Set","fan","Poster","Nivia","","",299,599,4.4,180,""]
];

// Turn each row into a full product object with all the required fields
const PRODUCTS = RAW.map(function (r, i) {
  const [name, category, subCategory, brand, club, nation, price, mrp, rating, reviewCount, flags] = r;
  const isShoe = category === "boots" || category === "turf";
  return {
    id: i + 1, name, category, subCategory, brand, club, nation, price, mrp,
    discountPercent: Math.round((1 - price / mrp) * 100),
    rating, reviewCount,
    sizes: category === "jerseys" || category === "apparel" ? ["S","M","L","XL","XXL"]
         : isShoe ? ["UK 5","UK 6","UK 7","UK 8","UK 9","UK 10","UK 11","UK 12"] : [],
    colors: ["Black", "Green", "White"],
    images: [prodImg(i + 1)], // one photo per product
    description: name + " - quality football gear from " + brand + " for training and match day.",
    bulletPoints: ["Durable, high-quality material", "Designed for football players", "Easy to clean and maintain"],
    stock: 5 + (i * 7) % 40,
    isBestSeller: flags.indexOf("b") > -1,
    isDeal: flags.indexOf("d") > -1,
    createdAt: new Date(2025, 0, 1 + i * 6).toISOString()
  };
});