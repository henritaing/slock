import React, { useMemo } from 'react';

const BENCHMARK_DATA = {
  'SP500': { 'Technology': 29.5, 'Healthcare': 12.6, 'Financials': 13.0, 'Consumer Cyclical': 10.5, 'Communication Services': 8.9, 'Industrials': 8.5 },
  'MSCI World': { 'Technology': 23.0, 'Financials': 15.2, 'Healthcare': 12.1, 'Industrials': 11.0, 'Consumer Cyclical': 10.8 },
  'CAC40': { 'Consumer Defensive': 32.0, 'Industrials': 22.0, 'Financials': 12.0, 'Healthcare': 9.0, 'Technology': 8.0 }
};

const SectorComparison = ({ marketData, portfolio, benchmark }) => {
  // Hide if no benchmark or "None" is selected
  if (!benchmark || benchmark === "None") return null;

  const comparison = useMemo(() => {
    const userSectors = {};
    let totalValue = 0;

    portfolio.forEach(item => {
      const info = marketData[item.ticker];
      const sector = info?.sector || 'Other';
      const price = info?.last_price || 0;
      const val = item.volume * price;
      
      userSectors[sector] = (userSectors[sector] || 0) + val;
      totalValue += val;
    });

    const activeBench = BENCHMARK_DATA[benchmark] || {};
    
    // Compare top 5 sectors from the benchmark or user
    const allSectors = Array.from(new Set([...Object.keys(userSectors), ...Object.keys(activeBench)]));
    
    return allSectors.map(name => {
      const userWeight = totalValue > 0 ? (userSectors[name] / totalValue) * 100 : 0;
      const benchWeight = activeBench[name] || 0;
      return {
        name,
        userWeight: parseFloat(userWeight.toFixed(1)),
        benchWeight: benchWeight,
        diff: parseFloat((userWeight - benchWeight).toFixed(1))
      };
    })
    .filter(s => s.userWeight > 0 || s.benchWeight > 0)
    .sort((a, b) => b.userWeight - a.userWeight)
    .slice(0, 5); // Keep it compact
  }, [marketData, portfolio, benchmark]);

  return (
    <div className="flex flex-col justify-center space-y-4 border-l border-zinc-800 pl-6 ml-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {benchmark} Alignment
        </span>
      </div>
      
      {comparison.map(s => (
        <div key={s.name} className="space-y-1">
          <div className="flex justify-between text-[9px] font-bold uppercase">
            <span className="text-zinc-500">{s.name}</span>
            <span className={Math.abs(s.diff) > 10 ? 'text-orange-500' : 'text-zinc-400'}>
              {s.diff > 0 ? '+' : ''}{s.diff}%
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            {/* User Weight Bar */}
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-600 transition-all duration-1000"
              style={{ width: `${s.userWeight}%` }}
            />
            {/* Benchmark Target Marker */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-white/40 z-10"
              style={{ left: `${s.benchWeight}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-[8px] text-zinc-600 italic mt-2">
        White markers indicate {benchmark} average weights.
      </p>
    </div>
  );
};

export default SectorComparison;