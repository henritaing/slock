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
          
          {Object.keys(chartData[0] || {}).filter(k => k !== 'date').map((ticker, i) => {
            const isBench = benchSymbols.includes(ticker);
            const isPort = ticker === "My Portfolio";
            
            // 3. LOGIC FOR HIGHLIGHTING
            // A line is highlighted if: nothing is selected OR it is the specific ticker selected
            const isHighlighted = selectedTickers.length === 0 || selectedTickers.includes(ticker);
            
            return (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                // If not highlighted, stroke becomes a dark grey (#27272a)
                stroke={isPort ? '#10b981' : isHighlighted ? colors[i % colors.length] : '#27272a'}
                // If not highlighted, line becomes very thin and faint
                strokeWidth={isHighlighted ? (isPort || isBench ? 3 : 2) : 1}
                strokeOpacity={isHighlighted ? 1 : 0.15}
                strokeDasharray={isBench ? "5 5" : "0"}
                dot={false}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;