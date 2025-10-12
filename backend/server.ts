import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";
import type { Contract } from "./contract.js";

const walletKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET!, "utf8")))
);

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(walletKeypair), { preflightCommitment: "confirmed" });
anchor.setProvider(provider);

const idl = JSON.parse(fs.readFileSync("./contract.json", "utf8"));

const programId = new PublicKey("8Kns8bTCHGWYh2MUcYb4p7tK6subWE9jkyZiWq2T5Tn7");

const program = new anchor.Program(idl, provider) as anchor.Program<Contract>;

const [oraclePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("oracle-state")],
  programId
);

async function fetchTopCities(limit = 12) {
  const res = await axios.get("https://api.parcllabs.com/v1/cities", {
    headers: { Authorization: `Bearer ${process.env.PARCL_API_KEY}` },
    params: { limit }
  });

  return res.data.items.map((c: any) => ({
    id: c.parcl_id,
    name: c.name,
    country: c.country,
    area: 0 
  }));
}

async function fetchCircleRate(parcl_id: number) {
  const res = await axios.get(`https://api.parcllabs.com/v1/price_feed/${parcl_id}`, {
    headers: { Authorization: `Bearer ${process.env.PARCL_API_KEY}` }
  });
  return res.data.pricefeed_market;
}

async function updateOracle(cities: any[]) {
    if(!program) return;
  for (const city of cities) {
    try {
      await program.methods
        .updateCityRate(city.name, new anchor.BN(city.rate))
        .accounts({
          admin: walletKeypair.publicKey,
          oracleState: oraclePda,
        })
        .rpc();
      console.log(`✅ Updated ${city.name}: ${city.rate}`);
    } catch (err: any) {
      console.log(`❌ Error updating ${city.name}:`, err.toString());
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

  console.log("Updating Oracle on devnet...");
  await updateOracle(cities);

  console.log("Done!");
}

cron.schedule("0 * * * *", () => {
  console.log("⏱ Running scheduled update...");
  main().catch(console.error);
});

main().catch(console.error);
