import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import { PublicKey, SystemProgram } from "@solana/web3.js";

describe("contract", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Contract as Program<Contract>;

  let oracleStatePda: PublicKey;
  const admin = (provider.wallet as anchor.Wallet).publicKey;

  const cityName = "Delhi";
  const cityRate = new anchor.BN(5000);
  const updatedRate = new anchor.BN(8000);
  const cityArea = new anchor.BN(1000);
  const country = "India";

  before(async () => {
    [oracleStatePda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("oracle-state")],
      program.programId
    );

    try {
      await program.methods
        .initialize(admin)
        .accounts({
          //@ts-ignore
          oracleState: oracleStatePda,
          admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
    }
  });

  it("Add a new city", async () => {
    const tx = await program.methods
      .addCity(cityName, cityArea, cityRate, country)
      .accounts({
        admin,
        oracleState: oracleStatePda,
      })
      .rpc();

    console.log("City added. TX:", tx);

    const state = await program.account.oracleState.fetch(oracleStatePda);
    console.log("Oracle state:", state);
    const added = state.circleRates.find((c: any) => c.cityName === cityName);
    if (!added) throw new Error("City was not added");
  });

  it("Should not allow duplicate city", async () => {
    try {
      await program.methods
        .addCity(cityName, cityArea, cityRate, country)
        .accounts({
          admin,
          oracleState: oracleStatePda,
        })
        .rpc();
      throw new Error("Duplicate city added but should have failed");
    } catch (err) {
      console.log("Duplicate check passed:", err.error.errorMessage);
    }
  });

  it("Update city rate", async () => {
    const tx = await program.methods
      .updateCityRate(cityName, updatedRate)
      .accounts({
        admin,
        oracleState: oracleStatePda,
      })
      .rpc();

    console.log("City rate updated. TX:", tx);
    const state = await program.account.oracleState.fetch(oracleStatePda);
    const updated = state.circleRates.find((c: any) => c.cityName === cityName);
    if (Number(updated.rate) !== Number(updatedRate)) {
      throw new Error("City rate not updated properly");
    }
  });

  it("Get single city rate", async () => {
    const rate = await program.methods
      .getCircleRate(cityName)
      .accounts({
        oracleState: oracleStatePda,
      })
      .view();

    console.log("Got rate for", cityName, ":", rate.toString());
    if (Number(rate) !== Number(updatedRate)) {
      throw new Error("Rate mismatch");
    }
  });

  it("Get city list", async () => {
    const list = await program.methods
      .getCityList()
      .accounts({
        oracleState: oracleStatePda,
      })
      .view();

    console.log("City list:", list);
    if (list.length === 0) throw new Error("City list should not be empty");
  });
});
