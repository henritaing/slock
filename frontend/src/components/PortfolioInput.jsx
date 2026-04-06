import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Calendar } from 'lucide-react';
import { TICKER_MAP } from '../constants';

const PortfolioInput = ({ displayPortfolio, setPortfolio, rawPortfolio, onSave }) => {
  const [newEntry, setNewEntry] = useState({ ticker: '', buy_price: '', volume: '', date: '' });
  const [editingTicker, setEditingTicker] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleTickerChange = (e) => {
    const val = e.target.value.toUpperCase();
    if (val.includes(" - ")) {
      const tickerOnly = val.split(" - ")[1];
      setNewEntry({ ...newEntry, ticker: tickerOnly });
    } else {
      setNewEntry({ ...newEntry, ticker: val });
    }
  };

  const addTicker = () => {
    if (!newEntry.ticker || !newEntry.volume) return;
    setPortfolio([...rawPortfolio, { 
      ...newEntry, 
      ticker: newEntry.ticker.trim(), 
      id: Date.now() 
    }]);
    setNewEntry({ ticker: '', buy_price: '', volume: '', date: '' });
  };

  const startEdit = (item) => {
    setEditingTicker(item.ticker);
    // When editing an aggregated item, we are actually editing the totals
    setEditValues({
      ticker: item.ticker,
      buy_price: Math.round(item.buy_price),
      volume: item.volume,
      date: item.date // This will be the earliest date
    });
  };

  const saveEdit = () => {
    // Strategy: Remove all old entries for this ticker and replace with one "cleaned" entry
    const filtered = rawPortfolio.filter(p => p.ticker.toUpperCase() !== editingTicker);
    setPortfolio([...filtered, { ...editValues, id: Date.now() }]);
    setEditingTicker(null);
  };

  const deleteTicker = (ticker) => {
    setPortfolio(rawPortfolio.filter(p => p.ticker.toUpperCase() !== ticker.toUpperCase()));
  };

  return (
    <div className="p-4 flex flex-col h-full bg-zinc-900">
      <div className="space-y-3 mb-8">
        <p className="text-[11px] font-black text-zinc-500 tracking-[0.2em] uppercase px-1">Quick Add</p>
        <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-zinc-800">
          <div className="relative">
            <input 
              list="ticker-options"
              placeholder="TICKER OR NAME..." 
              className="w-full bg-transparent border-b border-zinc-800 py-2 text-sm focus:border-emerald-500 outline-none uppercase font-mono text-white placeholder:text-zinc-700"
              value={newEntry.ticker}
              onChange={handleTickerChange}
            />
            <datalist id="ticker-options">
              {Object.entries(TICKER_MAP).map(([ticker, name]) => (
                <option key={ticker} value={`${name} - ${ticker}`} />
              ))}
            </datalist>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[9px] text-zinc-600 font-bold uppercase ml-1">Price (€)</label>
              <input type="number" className="w-full bg-transparent border-b border-zinc-800 py-1 text-sm text-white outline-none focus:border-emerald-500" value={newEntry.buy_price} onChange={(e) => setNewEntry({...newEntry, buy_price: e.target.value})} />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-zinc-600 font-bold uppercase ml-1">Shares</label>
              <input type="number" className="w-full bg-transparent border-b border-zinc-800 py-1 text-sm text-white outline-none focus:border-emerald-500" value={newEntry.volume} onChange={(e) => setNewEntry({...newEntry, volume: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-zinc-600 font-bold uppercase ml-1">Acquisition Month</label>
            <input type="month" className="w-full bg-zinc-800/50 border border-zinc-800 rounded mt-1 p-2 text-xs text-white outline-none focus:border-emerald-500" value={newEntry.date} onChange={(e) => setNewEntry({...newEntry, date: e.target.value})} />
          </div>

          <button onClick={addTicker} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all mt-2">
            Add to Sloth Stack
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        <p className="text-[11px] font-black text-zinc-500 tracking-[0.2em] uppercase mb-4 px-1">Active Positions</p>
        {displayPortfolio.map((item) => (
          <div key={item.ticker} className="group bg-zinc-900 border border-zinc-800/50 p-4 rounded-xl hover:border-emerald-500/40 transition-all">
            {editingTicker === item.ticker ? (
              <div className="space-y-3">
                <input className="w-full bg-black border border-zinc-700 p-2 text-xs font-mono rounded" value={editValues.ticker} readOnly />
                <div className="flex gap-2">
                  <input type="number" className="w-1/2 bg-black border border-zinc-700 p-2 text-xs rounded text-white" value={editValues.buy_price} onChange={(e) => setEditValues({...editValues, buy_price: e.target.value})} />
                  <input type="number" className="w-1/2 bg-black border border-zinc-700 p-2 text-xs rounded text-white" value={editValues.volume} onChange={(e) => setEditValues({...editValues, volume: e.target.value})} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button onClick={() => setEditingTicker(null)} className="text-zinc-500 text-[10px] uppercase font-bold">Cancel</button>
                  <button onClick={saveEdit} className="bg-emerald-600 px-3 py-1 rounded text-[10px] font-bold uppercase">Save Change</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-sm text-white">{item.ticker}</p>
                    <span className="text-[8px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase truncate max-w-[80px]">
                      {TICKER_MAP[item.ticker] || "Private"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    {item.volume.toLocaleString()} shares at {Math.round(item.buy_price)}€
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-500/70 font-bold italic">
                    <Calendar size={10} /> First Bought: {item.date || '---'}
                  </div>
                </div>
                <div className="flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="text-zinc-600 hover:text-white"><Edit2 size={12}/></button>
                  <button onClick={() => deleteTicker(item.ticker)} className="text-zinc-600 hover:text-red-500"><Trash2 size={12}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-zinc-800 mt-4">
        <button onClick={onSave} className="w-full bg-[#F5F2ED] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl">
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default PortfolioInput;