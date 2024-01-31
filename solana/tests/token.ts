import * as anchor from "@coral-xyz/anchor";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { Program } from "@coral-xyz/anchor";
import { Token } from "../target/types/token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";


describe("token", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  let user = Keypair.generate();

  const program = anchor.workspace.Token as Program<Token>;
  const [ourToken] = PublicKey.findProgramAddressSync(
    [Buffer.from("our_token")],
    program.programId
  );

  console.log("Mint at", ourToken.toString())

  const metadata = {
    name: "Our Token",
    symbol: "TOKENSOL",
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
  };

  let usdc: PublicKey;

  let userAtaUsdc: PublicKey;

  let vault = PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId)[0];

  let vaultAtaUsdc: PublicKey;

  // Helper function to confirm a transaction.
  const confirmTx = async (signature: string) => {
    const latestBlockhash = await anchor.getProvider().connection.getLatestBlockhash();
    await anchor.getProvider().connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      "confirmed"
    )
    return signature
  }



  it("Airdrop SOL to User", async () => {
    const tx = await anchor.getProvider().connection.requestAirdrop(user.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL).then(confirmTx);

    console.log("\n\nAirdrop to user successful! TxID: ", tx);
  });

  it("Create Our Token", async () => {
    // Derive the metadata account address.
    const [metadataAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        ourToken.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    try {
      const transactionSignature = await program.methods
        .createToken(metadata.name, metadata.symbol, metadata.uri)
        .accounts({
          payer: user.publicKey,
          mintAccount: ourToken,
          metadataAccount: metadataAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user])
        .rpc();
      console.log("Success!");
      console.log(`Transaction Signature: ${transactionSignature}`);

    }
    catch (error: unknown) {
      console.log("Token already created")
      // Token already exists
    }
    console.log(`Mint Address: ${ourToken}`);

  });

  it("Create mint and mint some tokens", async () => {
    usdc = await createMint(provider.connection, user, user.publicKey, null, 6);
    console.log("\n\USDC created: ", usdc.toBase58());

    // Get the user ATAs
    userAtaUsdc = (await getOrCreateAssociatedTokenAccount(provider.connection, user, usdc, user.publicKey)).address;
    console.log("\User ATA USDC created: ", userAtaUsdc.toBase58());

    // Mint some USDC to the user ATA
    const userMintA = await mintTo(provider.connection, user, usdc, userAtaUsdc, user, 1000000);
    console.log("\nMinted 1 USDC to user ATA - TxID: ", userMintA);

  })

  it("Do deposit", async () => {
    const userAtaOurToken = getAssociatedTokenAddressSync(ourToken, user.publicKey);

    vaultAtaUsdc = getAssociatedTokenAddressSync(usdc, vault, true);

    const tx = await program.methods.deposit(new anchor.BN(1000000))
      .accounts({
        user: user.publicKey,
        usdc: usdc,
        vault: vault,
        vaultAtaUsdc: vaultAtaUsdc,
        userAtaUsdc: userAtaUsdc,
        ourToken: ourToken,
        userAtaOurToken: userAtaOurToken,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,

      })
      .signers([user])
      .rpc();

    console.log("\n\Token deposit Created! TxID: ", tx);

    // Fetch and log details
    console.log("\nAmount deposited in the vault: ", (await provider.connection.getTokenAccountBalance(vaultAtaUsdc)).value.uiAmount, "  USDC");
    console.log("\User Our Tokens: ", (await provider.connection.getTokenAccountBalance(userAtaOurToken)).value.uiAmount, " Tokens");
    console.log("\User USDC tokens: ", (await provider.connection.getTokenAccountBalance(userAtaUsdc)).value.uiAmount, " Tokens");
  });


});