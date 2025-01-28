import React, { useState, useRef, useEffect } from "react";
import "./terminal.css";
import bg from "../assets/images/bg.gif"; // Background image
const Terminal = () => {
  const [logs, setLogs] = useState([
    "Welcome to the CUBE Terminal!",
    "Type 'help' for a list of commands.",
  ]);
  const [isLoading, setIsLoading] = useState(false); // State for loading effect
  const inputRef = useRef(null);
  const logsEndRef = useRef(null);

  const commands = {
    help: [
      { text: "Available commands:", className: "text-amber-500 font-bold" },
      {
        text: "  help                Show available commands",
        className: "text-green-400 font-press",
      },
      {
        text: "  clear               Clear the terminal",
        className: "text-green-400 font-press",
      },
      {
        text: "  CHECK [address]     Check token details (supply, distribution, mint authority)",
        className: "text-blue-400 font-press",
      },
      {
        text: "  TRENDING            Fetch top trending coins from Dextools",
        className: "text-purple-400 font-press",
      },
      {
        text: "  SOCIALS             Fetch SOCIAL INFO OF A TOKEN",
        className: "text-red-400 font-press",
      },
      {
        text: "  AUDIT               Fetch SECURITY AUDIT OF A TOKEN",
        className: "text-yellow-400 font-press",
      },
    ],
    clear: [],
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [logs]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const fetchDextoolsTrending = async (limit) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `Fetching top ${limit} trending coins from Dextools...`,
    ]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:3001/api/dextools/trending?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data from the backend.");
      }

      const data = await response.json();

      if (!data || !data.trending || data.trending.length === 0) {
        setLogs((prevLogs) => [
          ...prevLogs,
          "No trending coins found on Dextools.",
        ]);
        setIsLoading(false);
        return;
      }

      const coinLogs = data.trending.map((coin, index) => {
        const name = coin.name || "Unknown";
        const symbol = coin.symbol || "N/A";

        return `${index + 1}. Name: ${name} (${symbol})`;
      });

      setLogs((prevLogs) => [
        ...prevLogs,
        `Top ${limit} Trending Coins on Dextools:`,
        ...coinLogs,
      ]);
    } catch (error) {
      setLogs((prevLogs) => [
        ...prevLogs,
        `Error fetching trending coins: ${error.message}`,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = async (input) => {
    const sanitizedInput = input.trim();
    const [command, ...args] = sanitizedInput.split(" ");

    if (command === "help") {
      setLogs((prevLogs) => [
        ...prevLogs,
        ...commands.help.map((cmd, index) => (
          <div key={index} className={cmd.className}>
            {cmd.text}
          </div>
        )),
      ]);
    } else if (command === "clear") {
      setLogs([]);
    } else if (command === "check" && args.length === 1) {
      const tokenAddress = args[0];
      setLogs((prevLogs) => [
        ...prevLogs,
        `Fetching details for ${tokenAddress}...`,
      ]);
      setIsLoading(true); // Show loading effect

      try {
        const response = await fetch(
          `http://localhost:3001/api/token/${tokenAddress}`
        );
        const data = await response.json();

        if (data.error) {
          setTimeout(() => {
            setLogs((prevLogs) => [...prevLogs, `Error: ${data.error}`]);
            setIsLoading(false); // Hide loading effect
          }, 2000);
        } else {
          const {
            tokenSupply,
            largestAccounts,
            mintAuthority,
            freezeAuthority,
            liquidity,
          } = data;

          const topAccounts = largestAccounts.slice(0, 10);

          const holderLines = topAccounts.map((holder, index) => {
            const percentage = ((holder.uiAmount || 0) / tokenSupply) * 100;
            return `${index + 1}. Address: ${holder.address}, Amount: ${
              holder.uiAmountString || holder.uiAmount
            } (${percentage.toFixed(2)}%)`;
          });

          setTimeout(() => {
            setLogs((prevLogs) => [
              ...prevLogs,
              "Token Details:",
              `  Supply: ${tokenSupply}`,
              `  Mint Authority: ${mintAuthority ?? "Revoked or null"}`,
              `  Freeze Authority: ${freezeAuthority ?? "None"}`,
              `  Liquidity: ${liquidity}`,
              "Top 10 Largest Accounts:",
              ...holderLines,
            ]);
            setIsLoading(false); // Hide loading effect
          }, 2000);
        }
      } catch (error) {
        setTimeout(() => {
          setLogs((prevLogs) => [
            ...prevLogs,
            `Error fetching token details: ${error.message}`,
          ]);
          setIsLoading(false); // Hide loading effect
        }, 2000);
      }
    } else if (command === "trending") {
      setLogs((prevLogs) => [
        ...prevLogs,
        "Select the number of trending coins to display:",
        "1) Top 5",
        "2) Top 10",
        "3) Top 15",
      ]);

      const promptUserSelection = async () => {
        return new Promise((resolve) => {
          const inputHandler = (e) => {
            if (e.key === "Enter") {
              const selection = e.target.value.trim();
              e.target.value = ""; // Clear input
              inputRef.current.removeEventListener("keydown", inputHandler);
              resolve(selection);
            }
          };
          inputRef.current.addEventListener("keydown", inputHandler);
        });
      };

      const selectedOption = await promptUserSelection();

      const limitMap = {
        1: 5,
        2: 10,
        3: 15,
      };

      const limit = limitMap[selectedOption];
      if (limit) {
        setLogs((prevLogs) => [
          ...prevLogs,
          `Fetching top ${limit} trending coins...`,
        ]);
        fetchDextoolsTrending(limit);
      } else {
        setLogs((prevLogs) => [...prevLogs, "Invalid selection. Try again."]);
      }
    } else if (command === "socials") {
      setLogs((prevLogs) => [
        ...prevLogs,
        "Enter contract address to check socials:",
      ]);

      const promptUserInput = async () => {
        return new Promise((resolve) => {
          const inputHandler = (e) => {
            if (e.key === "Enter") {
              const contractAddress = e.target.value.trim();
              e.target.value = ""; // Clear input
              inputRef.current.removeEventListener("keydown", inputHandler);
              resolve(contractAddress);
            }
          };
          inputRef.current.addEventListener("keydown", inputHandler);
        });
      };

      const contractAddress = await promptUserInput();
      setLogs((prevLogs) => [
        ...prevLogs,
        `Fetching socials for contract: ${contractAddress}...`,
      ]);

      try {
        const response = await fetch(
          `http://localhost:3001/api/dextools/socials/${contractAddress}`
        );
        const data = await response.json();

        if (!data || !data.socials) {
          setLogs((prevLogs) => [
            ...prevLogs,
            "No social links found for the provided contract address.",
          ]);
          return;
        }

        const { telegram, twitter, website } = data.socials;
        setLogs((prevLogs) => [
          ...prevLogs,
          "Social Links:",
          `  Telegram: ${telegram || "N/A"}`,
          `  Twitter: ${twitter || "N/A"}`,
          `  Website: ${website || "N/A"}`,
        ]);
      } catch (error) {
        setLogs((prevLogs) => [
          ...prevLogs,
          `Error fetching socials: ${error.message}`,
        ]);
      }
    } else if (command === "audit") {
      setLogs((prevLogs) => [
        ...prevLogs,
        "Enter contract address to check audit:",
      ]);

      const promptUserInput = async () => {
        return new Promise((resolve) => {
          const inputHandler = (e) => {
            if (e.key === "Enter") {
              const contractAddress = e.target.value.trim();
              e.target.value = ""; // Clear input
              inputRef.current.removeEventListener("keydown", inputHandler);
              resolve(contractAddress);
            }
          };
          inputRef.current.addEventListener("keydown", inputHandler);
        });
      };

      const contractAddress = await promptUserInput();
      setLogs((prevLogs) => [
        ...prevLogs,
        `Fetching audit for contract: ${contractAddress}...`,
      ]);

      try {
        const response = await fetch(
          `http://localhost:3001/api/dextools/audit/${contractAddress}`
        );
        const data = await response.json();

        if (!data || !data.audit) {
          setLogs((prevLogs) => [
            ...prevLogs,
            "No audit information found for the provided contract address.",
          ]);
          return;
        }

        const {
          isHoneypot,
          isMintable,
          slippageModifiable,
          isContractRenounced,
          isPotentiallyScam,
        } = data.audit;

        setLogs((prevLogs) => [
          ...prevLogs,
          "Audit Information:",
          `  Is Honeypot: ${isHoneypot}`,
          `  Is Mintable: ${isMintable}`,
          `  Slippage Modifiable: ${slippageModifiable}`,
          `  Is Contract Renounced: ${isContractRenounced}`,
          `  Is Potentially Scam: ${isPotentiallyScam}`,
        ]);
      } catch (error) {
        setLogs((prevLogs) => [
          ...prevLogs,
          `Error fetching audit: ${error.message}`,
        ]);
      }
    } else {
      setLogs((prevLogs) => [
        ...prevLogs,
        `Unknown command: '${command}'`,
        "Type 'help' for a list of commands.",
      ]);
    }
  };

  return (
    <div
      className="relative flex justify-center items-center min-h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient Layer */}
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className="bg-black text-green-400 font-mono p-6 rounded-md shadow-lg w-full max-w-3xl bg-opacity-50 z-10 ">
        {/* Terminal Header */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-right">
            <div className="text-green-400 text-xl font-bold font-press">
              CUBE TERMINAL
            </div>
          </div>
        </div>

        {/* Scrollable Logs */}
        <div
          className="overflow-y-auto h-[600px] bg-black border bg-opacity-50 border-green-500 p-2 rounded-md 
            scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent scrollbar-thumb-rounded"
        >
          {logs.map((log, index) => (
            <div
              key={index}
              className={`leading-relaxed text-sm ${
                typeof log === "string"
                  ? log.startsWith("λ")
                    ? "text-green-400 font-press"
                    : "text-yellow-400 font-press"
                  : ""
              }`}
            >
              {log}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 mt-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>
                  {`.spinner_1KD7 {
                      animation: spinner_6QnB 1.2s infinite;
                      fill: white;
                    }
                    .spinner_MJg4 { animation-delay: .1s; }
                    .spinner_sj9X { animation-delay: .2s; }
                    .spinner_WwCl { animation-delay: .3s; }
                    .spinner_vy2J { animation-delay: .4s; }
                    .spinner_os1F { animation-delay: .5s; }
                    .spinner_l1Tw { animation-delay: .6s; }
                    .spinner_WNEg { animation-delay: .7s; }
                    .spinner_kugV { animation-delay: .8s; }
                    .spinner_4zOl { animation-delay: .9s; }
                    .spinner_7he2 { animation-delay: 1s; }
                    .spinner_SeO7 { animation-delay: 1.1s; }
                    @keyframes spinner_6QnB {
                      0%, 50% { animation-timing-function: cubic-bezier(0.27,.42,.37,.99); r: 0; }
                      25% { animation-timing-function: cubic-bezier(0.53,0,.61,.73); r: 2px; }
                    }`}
                </style>
                <circle className="spinner_1KD7" cx="12" cy="3" r="0" />
                <circle
                  className="spinner_1KD7 spinner_MJg4"
                  cx="16.50"
                  cy="4.21"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_SeO7"
                  cx="7.50"
                  cy="4.21"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_sj9X"
                  cx="19.79"
                  cy="7.50"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_7he2"
                  cx="4.21"
                  cy="7.50"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_WwCl"
                  cx="21.00"
                  cy="12.00"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_4zOl"
                  cx="3.00"
                  cy="12.00"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_vy2J"
                  cx="19.79"
                  cy="16.50"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_kugV"
                  cx="4.21"
                  cy="16.50"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_os1F"
                  cx="16.50"
                  cy="19.79"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_WNEg"
                  cx="7.50"
                  cy="19.79"
                  r="0"
                />
                <circle
                  className="spinner_1KD7 spinner_l1Tw"
                  cx="12"
                  cy="21"
                  r="0"
                />
              </svg>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Command Input */}
        <div className="mt-4 flex items-center">
          <span className="text-green-400">λ</span>
          <input
            type="text"
            ref={inputRef}
            className="ml-2 bg-transparent text-green-400 outline-none flex-grow font-press"
            placeholder="Type a command"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                const input = e.target.value.trim();
                setLogs((prevLogs) => [...prevLogs, `λ ${input}`]);
                handleCommand(input);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
