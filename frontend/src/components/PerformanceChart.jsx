import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ marketData, portfolio, viewMode }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const tickers = Object.keys(marketData);
  const benchSymbols = ["^GSPC", "URTH", "^FCHI"];

  const chartData = marketData[tickers[0]].map((entry, index) => {
    const dataPoint = { date: entry.date };
    
    if (viewMode === 'portfolio') {
      let totalValue = 0;
      let weightedReturn = 0;

      portfolio.forEach(item => {
        const day = marketData[item.ticker]?.[index];
        if (day) {
          const val = day.adj_close * parseFloat(item.volume);
          totalValue += val;
          weightedReturn += (val * day.cum_return);
        }
      });

      dataPoint["My Portfolio"] = totalValue > 0 ? parseFloat(((weightedReturn / totalValue) * 100).toFixed(2)) : 0;
      
      const activeBench = tickers.find(t => benchSymbols.includes(t));
      if (activeBench) {
        dataPoint[activeBench] = parseFloat((marketData[activeBench][index]?.cum_return * 100).toFixed(2));
      }
    } else {
      tickers.forEach(ticker => {
        if (marketData[ticker][index]) {
          dataPoint[ticker] = parseFloat((marketData[ticker][index].cum_return * 100).toFixed(2));
        }
      });
    }
    return dataPoint;
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b' }}
            formatter={(val) => [`${val}%`, ""]}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          {Object.keys(chartData[0] || {}).filter(k => k !== 'date').map((ticker, i) => {
            const isBench = benchSymbols.includes(ticker);
            const isPort = ticker === "My Portfolio";
            return (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={isPort ? '#8b5cf6' : isBench ? '#fbbf24' : COLORS[i % COLORS.length]}
                strokeWidth={isPort || isBench ? 3 : 1.5}
                strokeDasharray={isBench ? "5 5" : "0"}
                dot={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;