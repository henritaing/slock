import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const PortfolioHealth = ({ marketData, portfolio }) => {
  // Check if we have data to avoid rendering errors
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const data = portfolio.map(item => {
    const tickerData = marketData?.[item.ticker];
    // Get the most recent price from the backend array
    const currentPrice = (Array.isArray(tickerData) && tickerData.length > 0) 
      ? tickerData[tickerData.length - 1].adj_close 
      : 0;
    
    // MATCHING YOUR INPUT: using item.buy_price
    const buyPrice = parseFloat(item.buy_price) || 0;
    const volume = parseFloat(item.volume) || 0;

    const pnl = (currentPrice - buyPrice) * volume;
    const pnlPercent = buyPrice !== 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;

    return {
      name: item.ticker,
      buyPrice: buyPrice,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2))
    };
  }).filter(d => d.currentPrice > 0);

  return (
    <div className="space-y-12">
      {/* Chart 1: Price Comparison */}
      <div>
        <p className="text-[15px] uppercase tracking-widest text-gray-500 mb-4 font-bold text-center">
          Price vs. Entry Basis
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                cursor={{ fill: '#ffffff', opacity: 0.05 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="buyPrice" name="Avg Buy Price" fill="#64748b" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="currentPrice" name="Current Price" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: PnL Performance */}
      <div>
        <p className="text-[15px] uppercase tracking-widest text-gray-500 mb-4 font-bold text-center">
          Unrealized Gain / Loss (€)
        </p>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                cursor={{ fill: '#ffffff', opacity: 0.05 }}
                // This formatter pulls the 'pnl' and 'pnlPercent' from the hovered data point
                formatter={(value, name, props) => {
                  const { pnl, pnlPercent } = props.payload;
                  return [
                    <span key="pnl-val" style={{ color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                      {pnl.toLocaleString()}€ ({pnlPercent > 0 ? '+' : ''}{pnlPercent}%)
                    </span>,
                    'Total Gain/Loss'
                  ];
                }}
              />
              
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="pnl">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      
      </div>
    </div>
  );
};

export default PortfolioHealth;