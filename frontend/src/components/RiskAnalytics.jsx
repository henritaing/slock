import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RiskAnalytics = ({ marketData, portfolio, viewMode }) => {
  if (!marketData || portfolio.length === 0) return null;

  const benchSymbols = { "^GSPC": "S&P 500", "URTH": "MSCI World", "^FCHI": "CAC 40" };
  const tickers = Object.keys(marketData);
  const benchTickers = Object.keys(benchSymbols);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // --- 1. DATA CLEANING & TRANSFORMATION ---
  // We filter out any rows where the primary ticker has null data (fixes the "April hole")
  const rawDates = marketData[tickers[0]] || [];
  
  const volComparisonData = rawDates.map((entry, idx) => {
    const dataPoint = { date: entry.date };
    const activeBench = tickers.find(t => benchTickers.includes(t));
    
    if (activeBench && marketData[activeBench][idx]?.volatility !== undefined) {
      dataPoint["Market Index"] = parseFloat((marketData[activeBench][idx].volatility * 100).toFixed(2));
    }

    if (viewMode === 'portfolio') {
      let totalValue = 0;
      let weightedVol = 0;
      portfolio.forEach(item => {
        const day = marketData[item.ticker]?.[idx];
        if (day?.volatility) {
          const val = day.adj_close * parseFloat(item.volume);
          totalValue += val;
          weightedVol += (val * day.volatility);
        }
      });
      dataPoint["My Portfolio"] = totalValue > 0 ? parseFloat(((weightedVol / totalValue) * 100).toFixed(2)) : 0;
    } else {
      tickers.forEach(t => {
        if (!benchTickers.includes(t) && marketData[t][idx]?.volatility) {
          dataPoint[t] = parseFloat((marketData[t][idx].volatility * 100).toFixed(2));
        }
      });
    }
    return dataPoint;
  }).filter(d => Object.keys(d).length > 1); // Remove empty rows/holes

  return (
    <div className="space-y-10">
      {/* RSI Grid - Now implicitly synced to the 'marketData' length returned by backend */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tickers.map(t => {
          const isBench = benchTickers.includes(t);
          const history = marketData[t];
          const lastRSI = history[history.length - 1]?.rsi;
          const color = lastRSI > 70 ? 'text-red-500' : lastRSI < 30 ? 'text-green-500' : 'text-gray-400';
          const signal = lastRSI >= 70 ? "Overbought" : lastRSI <= 30 ? "Oversold" : "Neutral";
          
          return (
            <div key={t} className={`p-3 rounded-lg border ${isBench ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800 bg-black/40'}`}>
              <p className="text-[12px] font-bold text-gray-500 mb-1">{isBench ? `⭐ ${benchSymbols[t]}` : t}</p>
              <p className={`text-lg font-mono font-bold ${color}`}>{lastRSI ? lastRSI.toFixed(1) : 'N/A'}</p>
              <p className="text-[10px] uppercase tracking-tighter opacity-60 font-bold">{signal}</p>

              <div className="h-10 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marketData[t]}>
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke={lastRSI > 70 ? "#ef4444" : lastRSI < 30 ? "#22c55e" : "#3b82f6"} 
                      strokeWidth={1.5} 
                      dot={false} 
                    />
                    {/* Reference lines for 30/70 */}
                    <YAxis hide domain={[0, 100]} /> 
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Volatility Chart */}
      <div className="h-[300px] w-full">
        <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest">Volatility comparison (%)</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#4b5563" 
              fontSize={10} 
              tickFormatter={(t) => t ? new Date(t).toLocaleDateString('en-US', {month:'short', year:'2-digit'}) : ""}
              minTickGap={40}
            />
            <YAxis 
              stroke="#4b5563" 
              fontSize={10} 
              tickFormatter={(v) => `${v}%`} 
              domain={[0, 'auto']} // Forces scale to start at 0
            />
            <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b' }} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '10px'}} />

            {Object.keys(volComparisonData[0] || {}).filter(k => k !== 'date').map((key, i) => {
              const isBench = key === "Market Index";
              const isPort = key === "My Portfolio";
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={isPort ? '#8b5cf6' : isBench ? '#fbbf24' : COLORS[i % COLORS.length]}
                  strokeWidth={isPort || isBench ? 3 : 1.5}
                  strokeDasharray={isBench ? "5 5" : "0"}
                  dot={false}
                  name={key}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskAnalytics;