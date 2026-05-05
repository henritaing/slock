import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

const PortfolioHealth = ({ marketData, portfolio, stats, benchmark }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const data = portfolio.map(item => {
    const tickerInfo = marketData?.[item.ticker];
    const currentPrice = tickerInfo?.last_price || 0;
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

  // Check if benchmark is active
  const hasBenchmark = benchmark && benchmark !== 'None';

  return (
    <div className="space-y-12">
      {/* --- ALWAYS VISIBLE: Price & PnL Charts --- */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-black text-center">
          Price vs. Entry Basis
        </p>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
              <YAxis stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                itemStyle={{ fontSize: '12px' }}
                cursor={{ fill: '#ffffff', opacity: 0.03 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase' }} />
              <Bar dataKey="buyPrice" name="Avg Buy Price" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={25} />
              <Bar dataKey="currentPrice" name="Current Price" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-black text-center">
          Unrealized Gain / Loss (€)
        </p>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
              <YAxis stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                cursor={{ fill: '#ffffff', opacity: 0.03 }}
                formatter={(value, name, props) => {
                  const { pnl, pnlPercent } = props.payload;
                  return [
                    <span key="pnl-val" className={pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {pnl.toLocaleString()}€ ({pnlPercent > 0 ? '+' : ''}{pnlPercent}%)
                    </span>,
                    'Position PnL'
                  ];
                }}
              />
              <ReferenceLine y={0} stroke="#27272a" />
              <Bar dataKey="pnl">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? '#059669' : '#e11d48'} 
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