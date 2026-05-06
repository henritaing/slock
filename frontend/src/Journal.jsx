import React from 'react';

const { useState, useEffect, useCallback } = React;

const API = 'http://127.0.0.1:8000/api';

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Badge = ({ type }) => {
  const styles = {
    earnings:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    exdividend:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dividend:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const labels = { earnings: 'Earnings', exdividend: 'Ex-Div', dividend: 'Dividend' };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${styles[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
      {labels[type] || type}
    </span>
  );
};

const JournalCard = ({ entry, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    reason: entry.reason || '',
    notes: entry.notes || '',
    target_price: entry.target_price || '',
    target_date: entry.target_date || '',
  });

  const handleSave = async () => {
    await fetch(`${API}/journal/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSave();
    setEditing(false);
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-black text-zinc-100">{entry.ticker}</p>
          <p className="text-xs text-zinc-500">{fmt(entry.created_at)} · Bought at <span className="text-emerald-400 font-mono">{entry.bought_at?.toFixed(2)}€</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-lg">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={() => onDelete(entry.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 px-3 py-1 border border-red-500/20 rounded-lg">
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            rows={3}
            placeholder="Why did you buy this?"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none outline-none focus:border-emerald-500/50"
          />
          <textarea
            rows={2}
            placeholder="Ongoing notes..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none outline-none focus:border-emerald-500/50"
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Target price (€)"
              value={form.target_price}
              onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
              className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            />
            <input
              type="month"
              value={form.target_date}
              onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
              className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            />
          </div>
          <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">Save</button>
        </div>
      ) : (
        <div className="space-y-2">
          {entry.reason && <p className="text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-2">Thesis</span>{entry.reason}</p>}
          {entry.notes && <p className="text-xs text-zinc-400"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-2">Notes</span>{entry.notes}</p>}
          {(entry.target_price || entry.target_date) && (
            <div className="flex gap-4 pt-1">
              {entry.target_price && <p className="text-xs"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-1">Target</span><span className="text-emerald-400 font-mono">{parseFloat(entry.target_price).toFixed(2)}€</span></p>}
              {entry.target_date && <p className="text-xs"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-1">By</span><span className="text-zinc-300">{entry.target_date}</span></p>}
            </div>
          )}
          {!entry.reason && !entry.notes && !entry.target_price && (
            <p className="text-xs text-zinc-600 italic">No notes yet. Click Edit to add your thesis.</p>
          )}
        </div>
      )}
    </div>
  );
};

const WatchlistCard = ({ item, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    entry_target: item.entry_target || '',
    thesis: item.thesis || '',
  });

  const handleSave = async () => {
    await fetch(`${API}/watchlist/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSave();
    setEditing(false);
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-base font-black text-zinc-100">{item.ticker}</p>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 px-3 py-1 border border-emerald-500/20 rounded-lg">
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={() => onDelete(item.id)} className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 px-3 py-1 border border-red-500/20 rounded-lg">
            Delete
          </button>
        </div>
      </div>
      {editing ? (
        <div className="space-y-3">
          <input type="number" placeholder="Entry target (€)" value={form.entry_target}
            onChange={e => setForm(f => ({ ...f, entry_target: e.target.value }))}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
          />
          <textarea rows={3} placeholder="Why are you watching this?" value={form.thesis}
            onChange={e => setForm(f => ({ ...f, thesis: e.target.value }))}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none outline-none focus:border-emerald-500/50"
          />
          <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">Save</button>
        </div>
      ) : (
        <div className="space-y-1">
          {item.entry_target && <p className="text-xs"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-1">Entry</span><span className="text-emerald-400 font-mono">{parseFloat(item.entry_target).toFixed(2)}€</span></p>}
          {item.thesis && <p className="text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-widest text-[9px] font-black mr-2">Thesis</span>{item.thesis}</p>}
          {!item.entry_target && !item.thesis && <p className="text-xs text-zinc-600 italic">No notes yet.</p>}
        </div>
      )}
    </div>
  );
};

export default function Journal({ portfolio = [], navigateTo }) {
  const [entries, setEntries] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [activeTab, setActiveTab] = useState('journal');
  const [newWatch, setNewWatch] = useState({ ticker: '', entry_target: '', thesis: '' });
  const [loading, setLoading] = useState(true);

  const tickers = [...new Set(portfolio.map(p => p.ticker))];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [j, w] = await Promise.all([
        fetch(`${API}/journal`).then(r => r.json()),
        fetch(`${API}/watchlist`).then(r => r.json()),
      ]);
      setEntries(j);
      setWatchlist(w);

      if (tickers.length > 0) {
        const e = await fetch(`${API}/earnings?tickers=${tickers.join(',')}`).then(r => r.json());
        const flat = Object.entries(e).flatMap(([ticker, events]) =>
          events.map(ev => ({ ...ev, ticker }))
        ).sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        setEarnings(flat);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tickers.join(',')]);

  // Auto-create journal entries for lots that don't have one yet
  const syncLotEntries = useCallback(async (currentEntries) => {
    const existingLotIds = new Set(currentEntries.map(e => e.lot_id));
    const missing = portfolio.filter(lot => !existingLotIds.has(String(lot.id)));
    for (const lot of missing) {
      await fetch(`${API}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lot_id: String(lot.id),
          ticker: lot.ticker.toUpperCase(),
          bought_at: parseFloat(lot.buy_price) || 0,
        })
      });
    }
    if (missing.length > 0) fetchAll();
  }, [portfolio, fetchAll]);

  useEffect(() => {
    fetchAll().then(() => {
      fetch(`${API}/journal`).then(r => r.json()).then(j => syncLotEntries(j));
    });
  }, []);

  const deleteEntry = async (id) => {
    await fetch(`${API}/journal/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const deleteWatchlist = async (id) => {
    await fetch(`${API}/watchlist/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const addWatchlist = async () => {
    if (!newWatch.ticker) return;
    await fetch(`${API}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newWatch, ticker: newWatch.ticker.toUpperCase() })
    });
    setNewWatch({ ticker: '', entry_target: '', thesis: '' });
    fetchAll();
  };

  const tabs = ['journal', 'watchlist', 'earnings'];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">
              <span className="text-emerald-500">Investment</span> Journal
            </h1>
            <p className="text-xs text-zinc-500 mt-1">Track your thesis, watchlist, and upcoming events.</p>
          </div>
          <button onClick={() => navigateTo('dashboard')} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 px-4 py-2 border border-zinc-800 rounded-lg">
            ← Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {tab === 'journal' ? 'My Trades' : tab === 'watchlist' ? 'Watchlist' : 'Earnings Calendar'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-zinc-500 text-xs uppercase tracking-widest py-20">Loading...</p>
        ) : (
          <>
            {/* Journal Tab */}
            {activeTab === 'journal' && (
              <div className="space-y-4">
                {entries.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-20">No trades yet. Add stocks to your portfolio to get started.</p>
                )}
                {entries.map(e => (
                  <JournalCard key={e.id} entry={e} onSave={fetchAll} onDelete={deleteEntry} />
                ))}
              </div>
            )}

            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
              <div className="space-y-4">
                {/* Add new */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Add to Watchlist</p>
                  <div className="flex gap-3">
                    <input placeholder="Ticker (e.g. NVDA)" value={newWatch.ticker}
                      onChange={e => setNewWatch(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                      className="w-32 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                    />
                    <input type="number" placeholder="Entry target (€)" value={newWatch.entry_target}
                      onChange={e => setNewWatch(f => ({ ...f, entry_target: e.target.value }))}
                      className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <textarea rows={2} placeholder="Why are you watching this?" value={newWatch.thesis}
                    onChange={e => setNewWatch(f => ({ ...f, thesis: e.target.value }))}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 resize-none outline-none focus:border-emerald-500/50"
                  />
                  <button onClick={addWatchlist} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">Add</button>
                </div>

                {watchlist.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-10">No watchlist items yet.</p>
                )}
                {watchlist.map(w => (
                  <WatchlistCard key={w.id} item={w} onSave={fetchAll} onDelete={deleteWatchlist} />
                ))}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-3">
                {earnings.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-20">No earnings data. Sync your portfolio first.</p>
                )}
                {earnings.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-zinc-100 w-16">{ev.ticker}</p>
                      <Badge type={ev.event_type} />
                    </div>
                    <p className="text-xs font-mono text-zinc-300">{fmt(ev.event_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}