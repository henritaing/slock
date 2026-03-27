import React, { useState } from 'react';
import { Plus, Trash2, Save, Edit2, Check, X } from 'lucide-react';

const PortfolioInput = ({ portfolio, setPortfolio, onSave }) => {
  const [newEntry, setNewEntry] = useState({ ticker: '', buy_price: '', volume: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const addTicker = () => {
    if (!newEntry.ticker) return;
    setPortfolio([...portfolio, { ...newEntry, id: Date.now() }]);
    setNewEntry({ ticker: '', buy_price: '', volume: '' });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValues(item);
  };

  const saveEdit = () => {
    setPortfolio(portfolio.map(item => item.id === editingId ? editValues : item));
    setEditingId(null);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="space-y-3 mb-8">
        <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Quick Add</p>
        <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-gray-800">
          <input 
            placeholder="TICKER" 
            className="w-full bg-transparent border-b border-gray-700 py-1 text-sm focus:border-blue-500 outline-none uppercase font-mono"
            value={newEntry.ticker}
            onChange={(e) => setNewEntry({...newEntry, ticker: e.target.value.toUpperCase()})}
          />
          <div className="flex gap-2">
            <input 
              type="number" placeholder="Price" 
              className="w-1/2 bg-transparent border-b border-gray-700 py-1 text-sm outline-none"
              value={newEntry.buy_price}
              onChange={(e) => setNewEntry({...newEntry, buy_price: e.target.value})}
            />
            <input 
              type="number" placeholder="Vol" 
              className="w-1/2 bg-transparent border-b border-gray-700 py-1 text-sm outline-none"
              value={newEntry.volume}
              onChange={(e) => setNewEntry({...newEntry, volume: e.target.value})}
            />
          </div>
          <button onClick={addTicker} className="w-full mt-2 bg-blue-600 py-2 rounded text-[10px] font-black uppercase tracking-tighter hover:bg-blue-500">
            Add Position
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-2">My Holdings</p>
        {portfolio.map((item) => (
          <div key={item.id} className="group bg-gray-800/20 border border-gray-800 p-3 rounded-lg hover:border-blue-500/50 transition-all">
            {editingId === item.id ? (
              <div className="space-y-2">
                <input 
                  className="w-full bg-black border border-gray-700 p-1 text-xs font-mono"
                  value={editValues.ticker}
                  onChange={(e) => setEditValues({...editValues, ticker: e.target.value.toUpperCase()})}
                />
                <div className="flex gap-1">
                  <input type="number" className="w-1/2 bg-black border border-gray-700 p-1 text-xs" value={editValues.buy_price} onChange={(e) => setEditValues({...editValues, buy_price: e.target.value})} />
                  <input type="number" className="w-1/2 bg-black border border-gray-700 p-1 text-xs" value={editValues.volume} onChange={(e) => setEditValues({...editValues, volume: e.target.value})} />
                </div>
                <div className="flex gap-4 justify-end pt-1">
                  <button onClick={saveEdit} className="text-green-500 hover:scale-110 transition-transform"><Check size={16}/></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500 hover:scale-110 transition-transform"><X size={16}/></button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold text-sm text-blue-400">{item.ticker}</p>
                  <p className="text-[10px] text-gray-500">{item.volume} units @ {item.buy_price}€</p>
                </div>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="text-gray-500 hover:text-white"><Edit2 size={14}/></button>
                  <button onClick={() => setPortfolio(portfolio.filter(p => p.id !== item.id))} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-800">
        <button onClick={onSave} className="w-full bg-brand-beige text-brand-black py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:invert transition-all">
          Sync Market Data
        </button>
      </div>
    </div>
  );
};

export default PortfolioInput;