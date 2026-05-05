import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ marketData, portfolio, viewMode, colors, selectedTickers, onTickerClick }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const tickers = Object.keys(marketData);
  const benchSymbols = ["^GSPC", "URTH", "^FCHI"];
  
  // NEW: Point to .history for the iteration
  const firstTickerHistory = marketData[tickers[0]]?.history || [];

  const chartData = firstTickerHistory.map((entry, index) => {
    const dataPoint = { date: entry.date };
    
    if (viewMode === 'portfolio') {
      let totalValue = 0;
      let weightedReturn = 0;

      portfolio.forEach(item => {
        // NEW: Access .history[index]
        const day = marketData[item.ticker]?.history?.[index];
        if (day) {
          const val = day.adj_close * parseFloat(item.volume);
          totalValue += val;
          weightedReturn += (val * day.cum_return);
        }
      });

      dataPoint["My Portfolio"] = totalValue > 0 ? parseFloat(((weightedReturn / totalValue) * 100).toFixed(2)) : 0;
      
      const activeBench = tickers.find(t => benchSymbols.includes(t));
      if (activeBench) {
        // NEW: Access .history[index]
        const benchDay = marketData[activeBench]?.history?.[index];
        dataPoint[activeBench] = benchDay ? parseFloat((benchDay.cum_return * 100).toFixed(2)) : 0;
      }
    } else {
      tickers.forEach(ticker => {
        // NEW: Access .history[index]
        const tickerDay = marketData[ticker]?.history?.[index];
        if (tickerDay) {
          dataPoint[ticker] = parseFloat((tickerDay.cum_return * 100).toFixed(2));
        }
      });
    }
    return dataPoint;
  });

  return (
    <div className="h-[400px] w-full mt-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-black text-center">
          Cumulative Monthly Returns (%)
        </p>
      <ResponsiveContainer width="100%" height="100%">
        
        <LineChart data={chartData}> 
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#4b5563" 
            fontSize={11} 
            tickFormatter={(t) => t ? new Date(t).toLocaleDateString('en-US', {month:'short', year:'2-digit'}) : ""}
            minTickGap={30}
          />
          <YAxis stroke="#4b5563" fontSize={11} tickFormatter={(v) => `${v}%`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
            // Change this line:
            formatter={(val, name) => [`${val}%`, name]} 
          />
          {/* 2. ADD onClick to the Legend */}
          <Legend 
            iconType="circle" 
            wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase', cursor: 'pointer' }} 
            onClick={(e) => onTickerClick(e.value)}
          />
          
          {chartData && chartData.length > 0 && 
            Object.keys(chartData[0])
              .filter(k => k !== 'date')
              .map((ticker, i) => {
                const isBench = benchSymbols.includes(ticker);
                const isPort = ticker === "My Portfolio";
                
                // SAFETY: Use optional chaining for selectedTickers
                const isHighlighted = !selectedTickers || selectedTickers.length === 0 || selectedTickers.includes(ticker);
                
                // Determine the base color
                let strokeColor = (colors && colors.length > 0) ? colors[i % colors.length] : '#888888';
                if (isPort) strokeColor = '#10b981';
                
                return (
                  <Line
                    key={ticker}
                    type="monotone"
                    dataKey={ticker}
                    // Highlight logic
                    stroke={isHighlighted ? strokeColor : '#27272a'}
                    strokeWidth={isHighlighted ? (isPort || isBench ? 3 : 2) : 1}
                    strokeOpacity={isHighlighted ? 1 : 0.15}
                    strokeDasharray={isBench ? "5 5" : "0"}
                    dot={false}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    // Performance boost: disable animation for multi-line charts
                    isAnimationActive={false}
                  />
                );
              })
          }
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;