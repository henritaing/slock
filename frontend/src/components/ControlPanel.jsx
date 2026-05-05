import React from 'react';
import { RefreshCw } from 'lucide-react';

const ControlPanel = ({ 
  viewMode, setViewMode, 
  benchmark, setBenchmark, 
  period, setPeriod, 
  onSync 
}) => {
  return (
    <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
      {/* View Switcher */}
      <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
        <button 
          onClick={() => setViewMode('portfolio')} 
          className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${viewMode === 'portfolio' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-emerald-500'}`}
        >
          PORTFOLIO
        </button>
        <button 
          onClick={() => setViewMode('detailed')} 
          className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${viewMode === 'detailed' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-emerald-500'}`}
        >
          STOCKS
        </button>
      </div>

      {/* Benchmark Selector */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Benchmark</span>
        <select 
          value={benchmark} 
          onChange={(e) => setBenchmark(e.target.value)} 
          className="bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="None">None</option>
          <option value="SP500">S&P 500</option>
          <option value="MSCI World">MSCI World</option>
          <option value="CAC40">CAC 40</option>
        </select>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Horizon</span>
        <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
          {['6', '12', 'max'].map((p) => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)} 
              className={`px-4 py-1.5 text-[10px] font-black rounded-md transition-all ${period === p ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-emerald-400'}`}
            >
              {p.toUpperCase()}{p !== 'max' && 'M'}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 ml-auto">
        <button 
          onClick={() => onSync(true)} 
          className="p-2.5 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white hover:bg-zinc-700 transition-all active:scale-90"
          title="Force Data Refresh"
        >
          <RefreshCw size={16} />
        </button>
        <button 
          onClick={() => onSync(false)} 
          className="bg-[#F5F2ED] text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
        >
          Update Analysis
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;