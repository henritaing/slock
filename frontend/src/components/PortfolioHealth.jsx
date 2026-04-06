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

      {/* --- CONDITIONAL: Beta & Alpha Cards --- */}
      {hasBenchmark && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Portfolio Beta</p>
            <p className="text-3xl font-mono font-bold text-emerald-500">
              {stats?.beta?.toFixed(2) || "1.00"}
            </p>
            <div className="h-1 w-full bg-zinc-800 mt-4 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-emerald-500 transition-all duration-1000" 
                 style={{ width: `${Math.min((stats?.beta || 1) * 50, 100)}%` }}
               />
            </div>
            <p className="text-[9px] text-zinc-400 mt-3 uppercase font-bold tracking-tighter">
              {stats?.beta > 1.1 ? "⚡ High Volatility" : stats?.beta < 0.9 ? "🛡️ Defensive Bias" : "⚖️ Market Correlation"}
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Alpha (Excess Return)</p>
            <p className={`text-3xl font-mono font-bold ${stats?.alpha >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats?.alpha > 0 ? '+' : ''}{stats?.alpha?.toFixed(2)}%
            </p>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < (stats?.alpha / 2) ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
            <p className="text-[9px] text-zinc-400 mt-3 uppercase font-bold tracking-tighter">
              {stats?.alpha > 0 ? "🔥 Beating Benchmark" : "🧊 Trailing Benchmark"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioHealth;