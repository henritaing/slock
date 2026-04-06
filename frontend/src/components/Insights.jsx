import React, { useMemo, useState, useEffect } from 'react';
import { Target, TrendingDown, BookOpen, AlertCircle } from 'lucide-react';

const BENCHMARK_DATA = {
  'SP500': { 'Technology': 29.5, 'Healthcare': 12.6, 'Financials': 13.0, 'Consumer Cyclical': 10.5, 'Communication Services': 8.9 },
  'MSCI World': { 'Technology': 23.0, 'Financials': 15.2, 'Healthcare': 12.1, 'Industrials': 11.0, 'Consumer Cyclical': 10.8 },
  'CAC40': { 'Consumer Defensive': 32.0, 'Industrials': 22.0, 'Financials': 12.0, 'Healthcare': 9.0, 'Technology': 8.0 },
  'None': {}
};

const Insights = ({ marketData, portfolio, benchmark }) => {
  const [note, setNote] = useState(localStorage.getItem('sloth_journal') || "");

  useEffect(() => {
    localStorage.setItem('sloth_journal', note);
  }, [note]);

  const analysis = useMemo(() => {
    const userSectors = {};
    let totalValue = 0;

    portfolio.forEach(item => {
      const info = marketData[item.ticker];
      const sector = info?.sector || 'Other';
      const history = info?.history || [];
      const price = history.length > 0 ? history[history.length - 1].adj_close : 0;
      const val = item.volume * price;
      
      userSectors[sector] = (userSectors[sector] || 0) + val;
      totalValue += val;
    });

    const activeBench = BENCHMARK_DATA[benchmark] || {};
    
    return Object.entries(userSectors).map(([name, val]) => {
      const userWeight = (val / totalValue) * 100;
      const benchWeight = activeBench[name] || 0;
      return {
        name,
        userWeight: parseFloat(userWeight.toFixed(1)),
        benchWeight: benchWeight,
        diff: parseFloat((userWeight - benchWeight).toFixed(1))
      };
    }).sort((a, b) => b.userWeight - a.userWeight);
  }, [marketData, portfolio, benchmark]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Allocation Benchmarking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-8">
            <Target className="text-emerald-500" size={20} />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Sector Benchmarking vs {benchmark}</h3>
          </div>
          
          <div className="space-y-6">
            {analysis.map(s => (
              <div key={s.name} className="group">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-zinc-300">{s.name}</span>
                  <div className="flex gap-4">
                    <span className="text-zinc-500">Target: {s.benchWeight}%</span>
                    <span className={s.diff > 10 ? 'text-orange-500' : 'text-emerald-500'}>
                      Actual: {s.userWeight}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${s.diff > 10 ? 'bg-orange-600' : 'bg-emerald-600'}`}
                    style={{ width: `${s.userWeight}%` }}
                  />
                  {/* Benchmark Marker */}
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-white/40 z-10"
                    style={{ left: `${s.benchWeight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Simple Insights Panel */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-emerald-500" size={20} />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Sloth Signals</h3>
          </div>
          <div className="flex-1 space-y-4">
            {analysis.filter(s => Math.abs(s.diff) > 15).map(s => (
              <div key={s.name} className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                <p className="text-[11px] font-bold text-orange-200">
                  Heavy Overweight in {s.name}.
                </p>
                <p className="text-[10px] text-orange-200/60 mt-1">
                  You are {s.diff}% above {benchmark}. This concentration increases volatility.
                </p>
              </div>
            ))}
            {analysis.length === 0 && <p className="text-xs text-zinc-600 italic">Analysis will appear once tickers are synced.</p>}
          </div>
        </div>
      </div>

      {/* 3. Monthly Journaling */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="text-emerald-500" size={20} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Investor Journal</h3>
        </div>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why did you make these moves today? (e.g., 'Added LVMH because I believe in the luxury moats despite China concerns...')"
          className="w-full bg-black/40 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 focus:border-emerald-500/50 outline-none min-h-[200px] font-serif leading-relaxed"
        />
        <div className="mt-4 text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-right">
          Autosaved to Local Storage
        </div>
      </div>
    </div>
  );
};

export default Insights;