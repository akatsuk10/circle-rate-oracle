import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";
import type { Contract } from "./contract.js";
import bs58 from "bs58";
import { BN } from "bn.js";

const secretBase58 = process.env.ANCHOR_WALLET!;
const secretKey = bs58.decode(secretBase58);
const walletKeypair = Keypair.fromSecretKey(secretKey);

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(walletKeypair),
  { preflightCommitment: "confirmed" }
);
anchor.setProvider(provider);

const idl = JSON.parse(fs.readFileSync("./contract.json", "utf8"));

const programId = new PublicKey("8Kns8bTCHGWYh2MUcYb4p7tK6subWE9jkyZiWq2T5Tn7");

const program = new anchor.Program(idl, provider) as anchor.Program<Contract>;

const [oraclePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle-state")],
  programId
);

async function fetchTopCities(limit = 12) {
  try {
    const res = await axios.get(
      `https://api.parcllabs.com/v1/search/markets?location_type=CITY&sort_by=PARCL_EXCHANGE_MARKET&sort_order=DESC`,
      {
        headers: {
          Authorization: `${process.env.PARCL_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    const items = res.data.items || [];

    return items
      .slice(0, limit)
      .map(
        (c: {
          parcl_id: any;
          name: any;
          country: any;
          total_population: any;
          state_abbreviation: any;
        }) => ({
          id: c.parcl_id,
          name: c.name,
          country: c.country,
          area: c.total_population ?? 0,
        })
      );
  } catch (err: any) {
    console.error("Failed to fetch cities:", err.response?.data || err.message);
    return [];
  }
}

async function fetchCircleRate(parcl_id: number) {
  const res = await axios.get(
    `https://api.parcllabs.com/v1/price_feed/${parcl_id}/price_feed`,
    {
      headers: {
        Authorization: `${process.env.PARCL_API_KEY}`,
        Accept: "application/json",
      },
    }
  );

  const items = res.data.items;
  if (!items || items.length === 0) {
    throw new Error(`No price feed data for ${parcl_id}`);
  }

  const latest = items[0];
  return {
    rate: latest.price_feed,
    timestamp: new Date(latest.date).getTime() / 1000,
  };
}

async function fetchOracleCities(): Promise<Set<string>> {
  try {
    const cities: any[] = await program.methods
      .getCityList()
      .accounts({ oracleState: oraclePda })
      .view();

    const cityNames = new Set(cities.map((c) => c.cityName));
    return cityNames;
  } catch (err) {
    console.error("Failed to fetch Oracle cities:", err);
    return new Set();
  }
}

async function upsertOracleCities(cities: any[]) {
  const existingCities = await fetchOracleCities();

  for (const city of cities) {
    const rateValue = Math.floor(city.rate.rate * 100);

    try {
      if (existingCities.has(city.name)) {
        await program.methods
          .updateCityRate(city.name, new BN(rateValue))
          .accounts({
            admin: walletKeypair.publicKey,
            oracleState: oraclePda,
          })
          .rpc();
        console.log(`Updated ${city.name}: ${rateValue}`);
      } else {
        // Add new city
        await program.methods
          .addCity(
            city.name,
            new BN(city.area),
            new BN(rateValue),
            city.country
          )
          .accounts({
            admin: walletKeypair.publicKey,
            oracleState: oraclePda,
          })
          .rpc();
        console.log(`Added new city: ${city.name}`);
      }
    } catch (err: any) {
      console.log(`Error processing ${city.name}:`, err.toString());
    }
  }
}

async function main() {
  console.log("Fetching top cities...");
  const cities = await fetchTopCities();

  console.log("Fetching rates...");
  for (const city of cities) {
    city.rate = await fetchCircleRate(city.id);
  }

  console.log("Upserting Oracle on devnet...");
  await upsertOracleCities(cities);

  console.log("Done!");
}
cron.schedule("0 0 * * *", () => {
  console.log("Running scheduled update...");
  main().catch(console.error);
});

main().catch(console.error);
