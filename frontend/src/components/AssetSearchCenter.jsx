import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, ZoomIn, RotateCcw } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { TICKER_MAP } from '../constants';
import axios from 'axios';
import { API_BASE } from '../api';

const AssetSearchCenter = ({ onConfirm, onCancel, initialData }) => {
  const debounceRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const [selection, setSelection] = useState({
    ticker: initialData?.ticker || '',
    name: initialData?.name || '',
    price: initialData?.buy_price || 0,
    date: initialData?.date || '',
    volume: initialData?.volume || 10
  });

  const [zoomData, setZoomData] = useState({ refAreaLeft: '', refAreaRight: '', left: 'dataMin', right: 'dataMax' });

  const handleSearch = async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    setSelection({ ticker: ticker, name: TICKER_MAP[ticker], price: 0, date: '', volume: 10 });
    setZoomData({ refAreaLeft: '', refAreaRight: '', left: 'dataMin', right: 'dataMax' });

    try {
      const res = await axios.get(`${API_BASE}/preview/${ticker}`);
      setPreviewData(res.data.history || []);
    } catch (e) {
      console.error("Search failed", e.response?.data);
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData?.ticker) {
      handleSearch(initialData.ticker);
    }
  }, [initialData?.ticker]);

  const zoom = () => {
    let { refAreaLeft, refAreaRight } = zoomData;
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setZoomData(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }));
      return;
    }
    if (new Date(refAreaLeft) > new Date(refAreaRight)) {
      [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];
    }
    setZoomData(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '', left: refAreaLeft, right: refAreaRight }));
  };

  const resetZoom = () => setZoomData({ refAreaLeft: '', refAreaRight: '', left: 'dataMin', right: 'dataMax' });

  const filteredData = useMemo(() => {
    if (zoomData.left === 'dataMin') return previewData;
    return previewData.filter(d => d.date >= zoomData.left && d.date <= zoomData.right);
  }, [previewData, zoomData]);

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col p-12 animate-in fade-in duration-500 overflow-y-auto">
      <button onClick={onCancel} className="absolute top-8 right-12 text-zinc-500 hover:text-white transition-colors z-[110]">
        <X size={32} strokeWidth={1} />
      </button>

      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <div className="text-center mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Market Discovery</h2>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input 
              autoFocus
              placeholder="START TYPING NAME OR TICKER..."
              list="search-tickers"
              className="w-full bg-transparent border-b-2 border-zinc-800 py-4 pl-14 pr-4 text-3xl font-mono focus:border-emerald-500 outline-none uppercase transition-all text-white"
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  if (val.includes(" - ")) {
                    const tickerOnly = val.split(" - ")[1].trim();
                    handleSearch(tickerOnly);
                  } else if (TICKER_MAP[val]) {
                    handleSearch(val.trim());
                  }
                }, 300);
              }}
            />
            <datalist id="search-tickers">
              {Object.entries(TICKER_MAP).map(([ticker, name]) => (
                <option key={ticker} value={`${name} - ${ticker}`} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex-1 bg-zinc-900/20 border border-zinc-800 rounded-3xl p-8 relative flex flex-col min-h-[500px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-mono text-xs animate-pulse">SYNCHRONIZING RECORDS...</div>
          ) : previewData.length > 0 ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-white">{selection.ticker}</h3>
                  <p className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em]">{TICKER_MAP[selection.ticker]}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={resetZoom} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"><RotateCcw size={16}/></button>
                </div>
              </div>

              <div className="flex-1 cursor-crosshair select-none relative">
                {selection.date && (
                  <div className="absolute top-0 left-0 z-[50] bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 flex items-center gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-70">Locked Date</p>
                      <p className="text-sm font-mono font-bold">{selection.date}</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-70">Price</p>
                      <p className="text-sm font-mono font-bold">{(selection.price || 0).toFixed(2)}€</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelection(prev => ({...prev, date: '', price: 0})); }}
                      className="ml-2 hover:bg-black/20 p-1 rounded-full transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={filteredData}
                      onMouseDown={e => {
                        if (e) setZoomData(prev => ({ ...prev, refAreaLeft: e.activeLabel, refAreaRight: '' }));
                      }}
                      onMouseMove={e => {
                        if (e && zoomData.refAreaLeft && e.activeLabel && e.activeLabel !== zoomData.refAreaLeft) {
                          setZoomData(prev => ({ ...prev, refAreaRight: e.activeLabel }));
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!zoomData.refAreaRight) {
                          const label = e?.activeLabel || zoomData.refAreaLeft;
                          const point = filteredData.find(d => d.date === label);
                          if (point) {
                            setSelection(prev => ({ 
                              ...prev, 
                              date: point.date, 
                              price: parseFloat(point.adj_close) || 0 
                            }));
                          }
                          setZoomData(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }));
                          return;
                        }
                        zoom();
                      }}
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="date" hide domain={[zoomData.left, zoomData.right]} />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      pointerEvents="none"
                      wrapperStyle={{ zIndex: 40 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-950 border border-emerald-500/30 p-4 rounded-xl shadow-2xl pointer-events-none">
                              <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">{payload[0].payload.date}</p>
                              <p className="text-xl font-mono font-bold text-white">{payload[0].value.toFixed(2)}€</p>
                              <p className="text-[8px] text-emerald-500 font-bold uppercase mt-2">
                                {selection.date ? "Click to move lock" : "Click to lock entry"}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {selection.date && (
                      <ReferenceLine x={selection.date} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="adj_close" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                    />
                    {zoomData.refAreaLeft && zoomData.refAreaRight && (
                      <ReferenceArea x1={zoomData.refAreaLeft} x2={zoomData.refAreaRight} strokeOpacity={0.3} fill="#10b981" fillOpacity={0.1} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-30">
              <ZoomIn size={64} strokeWidth={1} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.5em]">Awaiting Selection</p>
            </div>
          )}
        </div>

        <div className={`mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-500 relative z-[110] ${selection.ticker ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest font-mono">Position Size</span>
              <span className="text-3xl font-mono font-bold text-white">{selection.volume} <span className="text-xs text-zinc-600">SHARES</span></span>
            </div>
            <input 
              type="range" min="1" max="1000" step="1"
              value={selection.volume}
              onChange={(e) => {
                e.stopPropagation();
                setSelection(prev => ({ ...prev, volume: parseInt(e.target.value) }));
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
          </div>

          <button 
            disabled={!selection.date}
            onClick={() => onConfirm(selection)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 shadow-xl"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add to Portfolio</span>
            {selection.date ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold">€{(selection.price * selection.volume).toLocaleString()}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </div>
            ) : (
              <span className="text-[10px] font-bold opacity-50 italic uppercase">Select Date on Chart</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetSearchCenter;