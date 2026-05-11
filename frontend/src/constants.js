export const TICKER_MAP = {
  // --- US & GLOBAL ---
  "AAPL": "Apple Inc.", "MSFT": "Microsoft Corp.", "GOOGL": "Alphabet (Google)",
  "AMZN": "Amazon.com Inc.", "TSLA": "Tesla, Inc.", "NVDA": "NVIDIA Corporation",
  "META": "Meta Platforms", "BRK-B": "Berkshire Hathaway", "V": "Visa Inc.",
  "DIS": "Walt Disney Co.", "NFLX": "Netflix, Inc.", "^GSPC": "S&P 500", "URTH": "MSCI World", "^FCHI": "CAC 40",
  
  // --- CAC 40 (Paris) ---
  "AC.PA": "Accor", "AI.PA": "Air Liquide", "AIR.PA": "Airbus", "ALO.PA": "Alstom", "MT.AS": "ArcelorMittal",
  "CS.PA": "AXA", "BNP.PA": "BNP Paribas", "EN.PA": "Bouygues", "CAP.PA": "Capgemini", 
  "CA.PA": "Carrefour", "ACA.PA": "Crédit Agricole", "BN.PA": "Danone", "DSY.PA": "Dassault Systèmes", 
  "EDEN.PA": "Edenred", "ENGI.PA": "Engie", "EL.PA": "EssilorLuxottica", "ERF.PA": "Eurofins Scientific", 
  "RMS.PA": "Hermès", "KER.PA": "Kering", "LR.PA": "Legrand", "OR.PA": "L'Oréal", 
  "MC.PA": "LVMH", "ML.PA": "Michelin", "ORA.PA": "Orange", "RI.PA": "Pernod Ricard", 
  "PUB.PA": "Publicis Groupe", "RNO.PA": "Renault", "SAF.PA": "Safran", "SGO.PA": "Saint-Gobain", 
  "SAN.PA": "Sanofi", "SU.PA": "Schneider Electric", "GLE.PA": "Société Générale", "STLAP.PA": "Stellantis", 
  "STMPA.PA": "STMicroelectronics", "TEP.PA": "Teleperformance", "HO.PA": "Thales", "TTE.PA": "TotalEnergies", 
  "VIE.PA": "Veolia", "DG.PA": "VINCI", "VIV.PA": "Vivendi", "OVH.PA": "OVHcloud",

  // --- AMUNDI & EUROPE ETFs ---
  "MSE.PA": "Amundi MSCI Europe (Acc)", 
  "C50.PA": "Amundi EURO STOXX 50 (Acc)",
  "ETZ.PA": "Amundi STOXX Europe 600 (Acc)",
  "LYP6.PA": "Lyxor STOXX Europe 600",
  "CW8.PA": "Amundi MSCI World (Acc)",
  "PUW.PA": "Amundi MSCI World (Dist)",
  "PMEH.PA": "Amundi PEA MSCI Europe",
  "PSP5.PA": "Amundi PEA S&P 500",
  "VWCE.DE": "Vanguard FTSE All-World",
  "IWDA.AS": "iShares MSCI World"
};

// Stable color assignment by ticker name

// Reserved (used only by helper for portfolio/benchmark)
const RESERVED_PORTFOLIO = '#10b981';
const RESERVED_BENCHMARK = '#3b82f6';

// Available for regular tickers (no emerald/blue collision)
export const CHART_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', 
  '#f97316', '#a855f7', '#14b8a6', '#facc15', '#0ea5e9'
];

export function getTickerColor(ticker, colors = CHART_COLORS) {
  if (ticker === "My Portfolio") return RESERVED_PORTFOLIO;
  if (["^GSPC", "URTH", "^FCHI"].includes(ticker)) return RESERVED_BENCHMARK;
  
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ((hash << 5) - hash) + ticker.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
}