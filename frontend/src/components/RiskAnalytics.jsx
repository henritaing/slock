import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RiskAnalytics = ({ marketData, portfolio, viewMode, colors, selectedTickers, onTickerClick }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const benchSymbols = { "^GSPC": "S&P 500", "URTH": "MSCI World", "^FCHI": "CAC 40" };
  const tickers = Object.keys(marketData);
  const benchTickers = Object.keys(benchSymbols);

  // --- 1. DATA PREPARATION: Extract RSI Data ---
  // This creates the missing rsiData object the component was looking for
  const rsiData = {};
  tickers.forEach(ticker => {
    rsiData[ticker] = marketData[ticker]?.history?.map(h => ({
      date: h.date,
      rsi: h.rsi
    })) || [];
  });

  // --- 2. DATA TRANSFORMATION: Volatility ---
  const firstTickerData = marketData[tickers[0]];
  const rawHistory = firstTickerData?.history || [];
  
  const volComparisonData = rawHistory.map((entry, idx) => {
    const dataPoint = { date: entry.date };
    const activeBench = tickers.find(t => benchTickers.includes(t));
    
    if (activeBench) {
      const benchDay = marketData[activeBench]?.history?.[idx];
      if (benchDay?.volatility !== undefined) {
        // FIX: Use activeBench (e.g., "^FCHI") as the key, not "Market Index"
        dataPoint[activeBench] = parseFloat((benchDay.volatility * 100).toFixed(2));
      }
    }

    if (viewMode === 'portfolio') {
      let totalValue = 0;
      let weightedVol = 0;
      portfolio.forEach(item => {
        const day = marketData[item.ticker]?.history?.[idx];
        if (day?.volatility) {
          const val = day.adj_close * parseFloat(item.volume);
          totalValue += val;
          weightedVol += (val * day.volatility);
        }
      });
      dataPoint["My Portfolio"] = totalValue > 0 ? parseFloat(((weightedVol / totalValue) * 100).toFixed(2)) : 0;
    } else {
      tickers.forEach(t => {
        const tickerDay = marketData[t]?.history?.[idx];
        if (!benchTickers.includes(t) && tickerDay?.volatility) {
          dataPoint[t] = parseFloat((tickerDay.volatility * 100).toFixed(2));
        }
      });
    }
    return dataPoint;
  }).filter(d => Object.keys(d).length > 1);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* 3. RSI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tickers.map(t => {
          const isBench = !!benchSymbols[t];
          const tickerHistory = rsiData[t] || [];
          const lastRSI = tickerHistory.length > 0 ? tickerHistory[tickerHistory.length - 1].rsi : null;
          
          const isSelected = selectedTickers.length === 0 || selectedTickers.includes(t);
          
          const colorClass = lastRSI > 70 ? 'text-red-500' : lastRSI < 30 ? 'text-emerald-500' : 'text-zinc-400';
          const signal = lastRSI > 70 ? 'Overbought' : lastRSI < 30 ? 'Oversold' : 'Neutral';

          return (
            <div 
              key={t} 
              onClick={() => onTickerClick(t)}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer hover:border-zinc-600
                ${isSelected 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-20 grayscale scale-95 border-transparent'
                }
                ${isBench 
                  ? 'border-amber-500/30 bg-amber-500/5' 
                  : 'border-zinc-800 bg-zinc-900/20'
                }`}
            >
              <p className="text-[10px] font-black text-zinc-500 mb-1 uppercase tracking-tighter">
                {isBench ? `⭐ ${benchSymbols[t] || t}` : t}
              </p>
              
              <p className={`text-xl font-mono font-bold ${colorClass}`}>
                {lastRSI ? lastRSI.toFixed(1) : '—'}
              </p>
              
              <p className="text-[8px] uppercase font-black tracking-widest opacity-40">
                {signal}
              </p>

              <div className="h-12 w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tickerHistory}>
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke={lastRSI > 70 ? "#e11d48" : lastRSI < 30 ? "#10b981" : "#3f3f46"} 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false}
                    />
                    <YAxis hide domain={[0, 100]} /> 
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Volatility Chart */}
      <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
        <p className="text-[10px] text-zinc-500 font-black uppercase mb-6 tracking-[0.2em] text-center">
          Annualized Volatility Trend (%)
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#3f3f46" 
                fontSize={10} 
                tickFormatter={(t) => t ? new Date(t).toLocaleDateString('en-US', {month:'short', year:'2-digit'}) : ""}
                minTickGap={40}
              />
              <YAxis 
                stroke="#3f3f46" 
                fontSize={10} 
                tickFormatter={(v) => `${v}%`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                itemStyle={{ fontSize: '11px' }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle" 
                onClick={(e) => onTickerClick(e.value)}
                wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', paddingBottom: '20px', cursor: 'pointer'}} 
              />

              {Object.keys(volComparisonData[0] || {}).filter(k => k !== 'date').map((key, i) => {
                const isHighlighted = selectedTickers.length === 0 || selectedTickers.includes(key);
                const isPort = key === "My Portfolio";
                const isBench = benchTickers.includes(key); // Check if this line is a benchmark

                // Define your colors
                let strokeColor = colors[i % colors.length]; // Default
                if (isPort) strokeColor = '#10b981';         // Portfolio Green
                if (isBench) strokeColor = '#3b82f6';        // Benchmark Blue (CAC40/S&P500)

                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    // Use the new logic: Highlighted ? Specific Color : Dark Gray
                    stroke={isHighlighted ? strokeColor : '#27272a'}
                    strokeOpacity={isHighlighted ? 1 : 0.1}
                    strokeWidth={isHighlighted ? (isPort || isBench ? 3 : 2) : 1}
                    dot={false}
                    style={{ transition: 'all 0.3s ease' }}
                    // Use dashed line for benchmark to make it even more distinct
                    strokeDasharray={isBench ? "5 5" : "0"}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalytics;