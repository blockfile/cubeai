const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // Ensure node-fetch is installed
const axios = require("axios"); // Using axios for requests
// 1) Import the Solana web3 library
const { Connection, PublicKey } = require("@solana/web3.js");

const app = express();
const PORT = 3001;

// 3) Build a Connection object
const connection = new Connection(RPC_URL, "confirmed");

// Middleware
app.use(cors());
app.use(bodyParser.json());

/**
 * GET /api/token/:address
 * Fetches:
 *  - Token supply
 *  - Largest token accounts (distribution)
 *  - Mint Authority + Freeze Authority
 */
app.get("/api/token/:address", async (req, res) => {
  const tokenMintAddress = req.params.address.trim();

  try {
    // 1) Get token supply
    const supplyResult = await connection.getTokenSupply(
      new PublicKey(tokenMintAddress)
    );
    const tokenSupply = supplyResult.value.uiAmount || 0;

    // 2) Get largest token accounts (distribution)
    const largestAccountsResult = await connection.getTokenLargestAccounts(
      new PublicKey(tokenMintAddress)
    );
    const largestAccounts = largestAccountsResult.value || [];

    // 3) Get mint info (to see mint authority, freeze authority, decimals, etc.)
    const mintInfoResult = await connection.getParsedAccountInfo(
      new PublicKey(tokenMintAddress)
    );
    const parsedInfo = mintInfoResult.value?.data?.parsed?.info || {};

    const mintAuthority = parsedInfo.mintAuthority || null;
    const freezeAuthority = parsedInfo.freezeAuthority || null;

    // 4) Prepare response
    const responseData = {
      tokenSupply,
      largestAccounts,
      mintAuthority,
      freezeAuthority,
      liquidity: "N/A - requires DEX-specific data",
    };

    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching token details:", error);
    return res.status(500).json({ error: "Failed to fetch token details." });
  }
});

/**
 * GET /api/trending
 * Fetch trending coins from Dextools API
 */
app.get("/api/dextools/trending", async (req, res) => {
  try {
    console.log("Fetching Solana trending pools from Dextools...");

    const limit = parseInt(req.query.limit) || 5; // Default to top 5 if no limit is provided

    const response = await axios.get(
      "https://public-api.dextools.io/trial/v2/ranking/solana/hotpools",
      {
        headers: {
          "x-api-key": DEXTOOLS_API_KEY,
          Accept: "application/json",
        },
      }
    );

    console.log("Raw response data:", response.data);

    if (
      !response.data ||
      !response.data.data ||
      response.data.data.length === 0
    ) {
      return res
        .status(404)
        .json({ error: "No trending pools found for Solana." });
    }

    const trendingPools = response.data.data.slice(0, limit).map((pool) => {
      const mainTokenName = pool.mainToken?.name || "Unknown";
      const mainTokenSymbol = pool.mainToken?.symbol || "N/A";
      const sideTokenName = pool.sideToken?.name || "Unknown";
      const sideTokenSymbol = pool.sideToken?.symbol || "N/A";

      return {
        name: `${mainTokenName}/${sideTokenName}`,
        symbol: `${mainTokenSymbol}/${sideTokenSymbol}`,
        price: pool.mainToken?.priceUsd
          ? `$${Number(pool.mainToken.priceUsd).toFixed(2)}`
          : "N/A",
        volume: pool.mainToken?.volumeUsd
          ? `$${Number(pool.mainToken.volumeUsd).toLocaleString()}`
          : "N/A",
        url: pool.url || "N/A",
      };
    });

    console.log("Processed trending pools:", trendingPools);
    res.json({ trending: trendingPools });
  } catch (error) {
    console.error("Error fetching Solana trending pools:", error.message);

    if (error.response) {
      console.error("Error response data:", error.response.data);
      res.status(error.response.status).json({ error: error.response.data });
    } else {
      res.status(500).json({ error: "Failed to fetch data from Dextools API" });
    }
  }
});
app.get("/api/dextools/socials/:contractAddress", async (req, res) => {
  const { contractAddress } = req.params;
  console.log("Fetching socials for contract address:", contractAddress);

  try {
    const response = await axios.get(
      `https://public-api.dextools.io/trial/v2/token/solana/${contractAddress}`,
      {
        headers: {
          "x-api-key": DEXTOOLS_API_KEY,
          Accept: "application/json",
        },
      }
    );

    console.log("Dextools API Response:", response.data);

    const socials = response.data?.data?.socialInfo || {};
    const { telegram, twitter, website } = socials;

    if (!telegram && !twitter && !website) {
      return res.status(404).json({ error: "No social links found." });
    }

    res.json({ socials: { telegram, twitter, website } });
  } catch (error) {
    console.error("Error fetching socials:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch socials." });
  }
});

app.get("/api/dextools/audit/:contractAddress", async (req, res) => {
  const { contractAddress } = req.params;
  console.log("Fetching audit for contract address:", contractAddress);

  try {
    const response = await axios.get(
      `https://public-api.dextools.io/trial/v2/token/solana/${contractAddress}/audit`,
      {
        headers: {
          "x-api-key": DEXTOOLS_API_KEY,
          Accept: "application/json",
        },
      }
    );

    console.log("Dextools Audit API Response:", response.data);

    const auditData = response.data?.data || {};
    const {
      isHoneypot = "no",
      isMintable = "no",
      slippageModifiable = "no",
      isContractRenounced = "no",
      isPotentiallyScam = "no",
    } = auditData;

    res.json({
      audit: {
        isHoneypot,
        isMintable,
        slippageModifiable,
        isContractRenounced,
        isPotentiallyScam,
      },
    });
  } catch (error) {
    console.error("Error fetching audit:", error.message);
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch audit information." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
