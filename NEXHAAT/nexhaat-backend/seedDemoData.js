/**
 * NexHaat demo seed data.
 *
 * Run once before the live demo:
 *
 *     cd nexhaat-backend
 *     npm run seed:demo          (or: node seedDemoData.js)
 *
 * The script is idempotent: every demo document is upserted / re-created under a
 * fixed id, so re-running it right before you present always gives the same
 * numbers.
 *
 * WHAT IT SEEDS (and the "aha" it produces)
 * ---------------------------------------------------------------------------
 * 1. Three markets priced so the HIGHEST listed price is NOT the best deal:
 *
 *      Market A  ₹2,150/q  <- highest price, 150 km  -> net ₹10,150
 *      Market B  ₹2,100/q        15 km             -> net ₹10,440  <- winner
 *      Market C  ₹1,900/q        40 km             -> net  ₹9,340
 *
 *    Ramesh's lot is 500 kg of Wheat = 5 quintals (the schema stores quintals).
 *    net = quantity_quintals x modal_price_per_quintal - (distance_km x ₹4/km)
 *    Market B wins because 4 x (150 - 15) = ₹540 of transport saving beats the
 *    ₹50/quintal x 5 quintals = ₹250 price premium Market A pays.
 *
 *    NOTE ON UNITS: recommendationController.js multiplies distance by
 *    TRANSPORT_RATE_PER_KM = 4, not ₹15/km. With a 5 quintal lot and ₹15/km the
 *    original ₹24/₹21/₹18-per-kg table flips by itself, but at ₹4/km it does
 *    not (₹1,500 price gap > ₹540 transport gap). The prices below are chosen
 *    so the ranking really does flip using the rate this backend actually uses.
 *
 * 2. Ramesh's Wheat lot (Task 1) and Sabina's Potato lot (a second listing).
 * 3. Northeast AgriTraders' Wheat requirement -> MATCHES Ramesh's lot.
 *    Dooars Fresh Produce Co.'s Onion requirement -> returns NOTHING.
 * 4. 11 days of price history per crop: Wheat rising ("trending up"),
 *    Potato falling ("trending down") - two opposite signals, so the trend
 *    feature is visibly computed rather than hard-coded.
 *
 * The script verifies all of the above against the real services before it
 * exits, and prints a cheat sheet for the person driving the demo.
 */

import { connectDb, disconnectDb } from "./config/mongo.js";
import User from "./models/User.js";
import Mandi from "./models/Mandi.js";
import MandiPrice from "./models/MandiPrice.js";
import FarmerLot from "./models/FarmerLot.js";
import BuyerRequirement from "./models/BuyerRequirement.js";
import { recommend } from "./controllers/recommendationController.js";
import { getPricePrediction } from "./services/pricePredictionService.js";
import { findMatchingLotsForRequirement } from "./services/farmerBuyerMatching.js";

// ---------------------------------------------------------------------------
// 1. Demo configuration
// ---------------------------------------------------------------------------

// Mirrors recommendationController.js (TRANSPORT_RATE_PER_KM) and
// nexhaat-frontend/src/utils/constants.ts. Used both for the printed
// expectations and as a tripwire: if the backend rate ever changes, the demo
// numbers below stop being true and the verification step fails.
const TRANSPORT_RATE_PER_KM = 4;

// Ramesh's farm near Alipurduar. Type these two numbers into the "Best Mandi"
// form during the demo.
const FARMER_LOCATION = { latitude: 26.49, longitude: 89.55 };

// Demo GPS points sit on Ramesh's latitude so the Haversine distance the
// backend calculates comes out at exactly 15 / 40 / 150 km. They are demo
// coordinates for the pitch, not the real mandi premises.
// The "Market A/B/C - " prefixes also keep the live Agmarknet refresh from ever
// matching these mandis (names are compared canonically), so the live price
// feed cannot overwrite the seeded demo prices mid-presentation.
const DEMO_MARKETS = [
  {
    mandi_name: "Market A - Cooch Behar Mandi",
    district: "Cooch Behar",
    latitude: 26.49,
    longitude: 91.0572, // 150.0 km away - furthest, but the highest price
    prices: { Wheat: 2150, Potato: 1450 },
  },
  {
    mandi_name: "Market B - Alipurduar Local Mandi",
    district: "Alipurduar",
    latitude: 26.49,
    longitude: 89.7007, // 15.0 km away - nearest, moderate price
    prices: { Wheat: 2100, Potato: 1700 },
  },
  {
    mandi_name: "Market C - Falakata Mandi",
    district: "Alipurduar",
    latitude: 26.49,
    longitude: 89.9519, // 40.0 km away - low price
    prices: { Wheat: 1900, Potato: 1250 },
  },
];

// 11 daily points, oldest first, last one = today (the price /api/recommend
// picks up as "latest"). Wheat climbs ~13%, Potato slides ~15%, both far beyond
// the 2% threshold in pricePredictionService.js.
const WHEAT_RAMP = [0.88, 0.892, 0.904, 0.916, 0.928, 0.94, 0.952, 0.964, 0.976, 0.988, 1.0];
const POTATO_RAMP = [1.18, 1.162, 1.144, 1.126, 1.108, 1.09, 1.072, 1.054, 1.036, 1.018, 1.0];
const RAMP_BY_CROP = { Wheat: WHEAT_RAMP, Potato: POTATO_RAMP };
const HISTORY_POINTS = WHEAT_RAMP.length;

// Fixed UUID v4 ids keep the seed idempotent and satisfy the frontend's
// `lot_id: z.string().uuid()` validation on the Best Mandi form.
const IDS = {
  ramesh: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  sabina: "9c858901-8a57-4791-81fe-4c455b099bc9",
  agriTraders: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  dooars: "16fd2706-8baf-433b-82eb-8c7fada847da",
  wheatLot: "4d1a2b3c-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  potatoLot: "7e2f1a4b-6c8d-4e9f-a1b2-3c4d5e6f7a8b",
  wheatRequirement: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
  onionRequirement: "8c9d0e1f-2a3b-4c5d-8e9f-0a1b2c3d4e5f",
};

const DEMO_PHONES = ["9800000001", "9800000002", "9800000003", "9800000004"];

// Shared location string. farmerBuyerMatching.js matches a requirement to a lot
// by comparing `lot.location` with `requirement.location` (case/space
// insensitive), so these two MUST stay identical or the match demo breaks.
const LOT_LOCATION = "Alipurduar";
// ---------------------------------------------------------------------------
// 2. Seeding
// ---------------------------------------------------------------------------

const isoDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const seriesFor = (todayPrice, ramp) => ramp.map((factor) => Math.round(todayPrice * factor));

// Removes only the demo documents (never the whole database, and never the
// CSV-seeded mandis), so the seed can be re-run safely on a shared cluster.
const resetDemoData = async () => {
  const demoMarketNames = DEMO_MARKETS.map((market) => market.mandi_name);
  const existingMarkets = await Mandi.find({ mandi_name: { $in: demoMarketNames } }).select("_id").lean();

  await Promise.all([
    User.deleteMany({ _id: { $in: Object.values(IDS) } }),
    User.deleteMany({ phone: { $in: DEMO_PHONES } }),
    FarmerLot.deleteMany({ _id: { $in: [IDS.wheatLot, IDS.potatoLot] } }),
    BuyerRequirement.deleteMany({ _id: { $in: [IDS.wheatRequirement, IDS.onionRequirement] } }),
    MandiPrice.deleteMany({ mandi_id: { $in: existingMarkets.map((market) => market._id) } }),
    Mandi.deleteMany({ _id: { $in: existingMarkets.map((market) => market._id) } }),
  ]);
};

const seedUsers = async () => {
  const users = [
    {
      _id: IDS.ramesh,
      name: "Ramesh Roy",
      phone: "9800000001",
      role: "FARMER",
      district: "Alipurduar",
      state: "West Bengal",
      latitude: FARMER_LOCATION.latitude,
      longitude: FARMER_LOCATION.longitude,
    },
    {
      _id: IDS.sabina,
      name: "Sabina Khatun",
      phone: "9800000002",
      role: "FARMER",
      district: "Alipurduar",
      state: "West Bengal",
      latitude: 26.5,
      longitude: 89.4,
    },
    {
      _id: IDS.agriTraders,
      name: "Northeast AgriTraders",
      phone: "9800000003",
      role: "BUYER",
      district: "Alipurduar",
      state: "West Bengal",
    },
    {
      _id: IDS.dooars,
      name: "Dooars Fresh Produce Co.",
      phone: "9800000004",
      role: "BUYER",
      district: "Alipurduar",
      state: "West Bengal",
    },
  ];

  await User.insertMany(users.map((user) => ({ is_verified: true, trust_score: 100, ...user })));
};

const seedLots = async () => {
  await FarmerLot.insertMany([
    {
      _id: IDS.wheatLot,
      farmer_id: IDS.ramesh,
      commodity: "Wheat",
      variety: LOT_LOCATION,
      location: LOT_LOCATION,
      quantity_quintals: 5, // 500 kg
      quality_grade: "Grade-A",
      harvest_date: null,
      expected_price: 2100,
      status: "LISTED",
    },
    {
      _id: IDS.potatoLot,
      farmer_id: IDS.sabina,
      commodity: "Potato",
      variety: LOT_LOCATION,
      location: LOT_LOCATION,
      quantity_quintals: 8, // 800 kg
      quality_grade: "Grade-B",
      harvest_date: null,
      expected_price: 1700,
      status: "LISTED",
    },
  ]);
};

const seedRequirements = async () => {
  await BuyerRequirement.insertMany([
    {
      _id: IDS.wheatRequirement,
      buyer_id: IDS.agriTraders,
      crop: "Wheat",
      quantity_quintals: 4,
      quality_grade: "Grade-A",
      location: LOT_LOCATION, // must equal the lot's location to match
      offered_price_per_quintal: 2000,
      status: "OPEN",
    },
    {
      _id: IDS.onionRequirement,
      buyer_id: IDS.dooars,
      crop: "Onion", // nothing on the platform sells Onion -> empty state demo
      quantity_quintals: 3,
      quality_grade: "Grade-A",
      location: LOT_LOCATION,
      offered_price_per_quintal: 1500,
      status: "OPEN",
    },
  ]);
};

const seedMarkets = async () => {
  const operations = [];

  for (const market of DEMO_MARKETS) {
    const mandi = await Mandi.findOneAndUpdate(
      { mandi_name: market.mandi_name, district: market.district },
      {
        mandi_name: market.mandi_name,
        district: market.district,
        latitude: market.latitude,
        longitude: market.longitude,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    for (const [crop, todayPrice] of Object.entries(market.prices)) {
      seriesFor(todayPrice, RAMP_BY_CROP[crop]).forEach((price, index) => {
        operations.push({
          updateOne: {
            filter: { mandi_id: mandi._id, crop, price_date: isoDaysAgo(HISTORY_POINTS - 1 - index) },
            update: { $set: { modal_price_per_quintal: price } },
            upsert: true,
          },
        });
      });
    }
  }

  await MandiPrice.bulkWrite(operations);
};
// ---------------------------------------------------------------------------
// 3. Verification - drives the real services/controllers, so the numbers
//    printed below are exactly what the live demo will show.
// ---------------------------------------------------------------------------

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
  return condition;
};

const callRecommend = async () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  await recommend(
    {
      body: {
        lot_id: IDS.wheatLot,
        latitude: FARMER_LOCATION.latitude,
        longitude: FARMER_LOCATION.longitude,
        max_distance_km: 200,
      },
      // Same shape the auth middleware puts on req.user (farmer-auth + role).
      user: { id: IDS.ramesh, state: "West Bengal", district: "Alipurduar" },
    },
    res
  );

  return res;
};

const verifyRecommendation = async () => {
  const res = await callRecommend();
  if (res.statusCode !== 200) {
    problems.push(`POST /api/recommend returned HTTP ${res.statusCode}: ${res.payload?.message}`);
    return;
  }

  const options = res.payload.all_options || [];
  const best = options[0];
  const bestByPrice = [...options].sort((a, b) => b.modal_price_per_quintal - a.modal_price_per_quintal)[0];

  console.log(`\n[BEST MANDI] Ramesh Roy - ${res.payload.listing.quantity_quintals} quintals of ${res.payload.listing.crop}`);
  console.table(options.map((option) => ({
    Mandi: option.mandi_name,
    "Modal (Rs/q)": option.modal_price_per_quintal,
    "Distance (km)": option.distance_km,
    "Gross (Rs)": option.gross_earnings,
    "Transport (Rs)": option.transport_cost,
    "Net (Rs)": option.net_profit,
    Viable: option.is_viable,
  })));

  const distances = options.map((option) => option.distance_km).sort((a, b) => a - b);
  check(options.length === 3, `expected 3 mandi options, got ${options.length}`);
  check(res.payload.transport_rate_per_km === TRANSPORT_RATE_PER_KM, `backend transport rate is ₹${res.payload.transport_rate_per_km}/km but this seed scripts its numbers for ₹${TRANSPORT_RATE_PER_KM}/km`);
  options.forEach((option) => {
    const expectedNet = Math.round((option.gross_earnings - option.distance_km * TRANSPORT_RATE_PER_KM) * 100) / 100;
    check(option.net_profit === expectedNet, `${option.mandi_name}: net ${option.net_profit} should be gross ${option.gross_earnings} - ${option.distance_km} km x ₹${TRANSPORT_RATE_PER_KM} = ${expectedNet}`);
  });
  check(distances.join(",") === "15,40,150", `expected demo distances 15/40/150 km, got ${distances.join(", ")}`);
  check(bestByPrice?.mandi_name === "Market A - Cooch Behar Mandi", `the highest listed price should be Market A, got ${bestByPrice?.mandi_name}`);
  check(best?.mandi_name === "Market B - Alipurduar Local Mandi", `NexHaat should rank Market B first, got ${best?.mandi_name}`);
  check(bestByPrice?.modal_price_per_quintal > best?.modal_price_per_quintal, "Market A must list a HIGHER price than Market B for the demo to land");
  check(best?.net_profit === 10440, `Market B net should be Rs 10440, got ${best?.net_profit}`);
  check(bestByPrice?.net_profit === 10150, `Market A net should be Rs 10150, got ${bestByPrice?.net_profit}`);
  check(res.payload.net_profit_at_best_mandi === best?.net_profit, "best_mandi and net_profit_at_best_mandi disagree");
  check(best?.net_profit > bestByPrice?.net_profit, "the highest-priced market must NET LESS than Market B");

  console.log(`  Naive pick (highest price) : ${bestByPrice?.mandi_name} @ Rs ${bestByPrice?.modal_price_per_quintal}/q -> net Rs ${bestByPrice?.net_profit}`);
  console.log(`  NexHaat recommendation     : ${best?.mandi_name} @ Rs ${best?.modal_price_per_quintal}/q -> net Rs ${best?.net_profit}`);
  console.log(`  Extra money in Ramesh's pocket: Rs ${((best?.net_profit || 0) - (bestByPrice?.net_profit || 0)).toFixed(2)}`);
  console.log(`  Price source shown in the UI  : ${res.payload.price_source} (live matches: ${res.payload.live_price_matches})`);
};

const verifyTrends = async () => {
  const wheat = await getPricePrediction("Wheat");
  const potato = await getPricePrediction("Potato");

  console.log("\n[PRICE TREND]");
  console.log(`  Wheat : ${wheat.signal}  (prev avg Rs ${wheat.previous_avg} -> current avg Rs ${wheat.current_avg}, ${wheat.change_pct > 0 ? "+" : ""}${wheat.change_pct}%, ${wheat.data_points} points)`);
  console.log(`  Potato: ${potato.signal}  (prev avg Rs ${potato.previous_avg} -> current avg Rs ${potato.current_avg}, ${potato.change_pct}%, ${potato.data_points} points)`);

  check(wheat.success === true && wheat.signal === "trending up", `Wheat should read "trending up", got "${wheat.signal}"`);
  check(potato.success === true && potato.signal === "trending down", `Potato should read "trending down", got "${potato.signal}"`);
};

const verifyMatching = async () => {
  const wheatMatch = await findMatchingLotsForRequirement(IDS.wheatRequirement);
  const onionMatch = await findMatchingLotsForRequirement(IDS.onionRequirement);

  console.log("\n[BUYER MATCHING]");
  console.log(`  Northeast AgriTraders (Wheat)    -> ${wheatMatch.matches.length} match(es): ${wheatMatch.matches.map((lot) => `${lot.crop} lot by ${lot.farmer_name} (${lot.quantity_quintals} q, ${lot.location})`).join("; ") || "none"}`);
  console.log(`  Dooars Fresh Produce Co. (Onion) -> ${onionMatch.matches.length} match(es) (intentional empty state)`);

  check(wheatMatch.matches.length === 1 && wheatMatch.matches[0].id === IDS.wheatLot, `Wheat requirement should match exactly Ramesh's lot, got ${wheatMatch.matches.length} match(es)`);
  check(onionMatch.matches.length === 0, `Onion requirement should match nothing, got ${onionMatch.matches.length} match(es)`);
};

// ---------------------------------------------------------------------------
// 4. Run it
// ---------------------------------------------------------------------------

const printCheatSheet = () => {
  console.log(`
==============================================================
 NEXHAAT DEMO CHEAT SHEET
==============================================================
 OTPs are returned by POST /api/auth/send-otp and logged by
 server.js as "NexHaat demo OTP for <phone>: <otp>".

 Farmer  - Ramesh Roy            phone 9800000001
   My Farm     : the Wheat lot (500 kg = 5 quintals, Grade-A).
   Best Mandi  : pick that lot, latitude 26.49, longitude 89.55,
                 max distance 200 km.
                 -> Market A shows the HIGHEST price, yet Market B
                    is ranked first on NET realization.
   Market      : crop "Wheat" (add "Potato" for the second set).
   Price Trend : "Wheat"  -> trending up   (UI advises waiting)
                 "Potato" -> trending down (UI advises selling now)

 Farmer  - Sabina Khatun         phone 9800000002
   My Farm     : the 800 kg Potato lot.

 Buyer   - Northeast AgriTraders phone 9800000003
   Buyer Requirements -> My Requirements -> matches on the Wheat
   requirement return Ramesh's lot.

 Buyer   - Dooars Fresh Produce  phone 9800000004
   The Onion requirement returns ZERO matches (empty state).

 Re-run this seed any time with: npm run seed:demo
==============================================================
`);
};

const main = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("WARNING: MONGODB_URI is not set - this seed will land in the in-memory database and vanish when the script exits.");
  }

  await connectDb();

  console.log("Clearing previous demo documents (demo records only)...");
  await resetDemoData();

  await seedUsers();
  await seedLots();
  await seedRequirements();
  await seedMarkets();
  console.log("Demo data written.");

  await verifyRecommendation();
  await verifyTrends();
  await verifyMatching();

  if (problems.length) {
    console.error("\nDEMO SEED VERIFICATION FAILED:");
    problems.forEach((problem) => console.error(`  - ${problem}`));
    console.error("The live demo would NOT show the numbers above. Fix the data before presenting.");
    process.exitCode = 1;
  } else {
    console.log("\nAll demo checks passed: ranking flip, trend signals and match/no-match behave as scripted.");
    printCheatSheet();
  }

  await disconnectDb();
};

main().catch(async (error) => {
  console.error("Demo seed failed:", error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});