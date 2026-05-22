import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { LayoutDashboard, RefreshCw } from 'lucide-react';

// Add at the top, alongside other imports:
import { API_BASE } from './api';   

// Shared Constants
import { CHART_COLORS } from './constants';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import DashboardHeader from './components/layout/DashboardHeader';
import ControlPanel from './components/ControlPanel';

// Feature Components
import DistributionChart from './components/DistributionChart';
import PerformanceChart from './components/PerformanceChart';
import PortfolioHealth from './components/PortfolioHealth';
import SectorComparison from './components/SectorPerformance';
import RiskAnalytics from './components/RiskAnalytics';
import AssetSearchCenter from './components/AssetSearchCenter';
import LandingPage from './LandingPage';
import Journal from './Journal';

const App = () => {
  // --- NAVIGATION & UI STATE ---
  const [view, setView] = useState('landing'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- DATA STATE ---
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('slock_portfolio');
    return saved ? JSON.parse(saved) : [];
  });
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editingAsset, setEditingAsset] = useState(null);
  
  // --- FILTER & ANALYSIS STATE ---
  const [viewMode, setViewMode] = useState('portfolio');
  const [benchmark, setBenchmark] = useState('None');
  const [period, setPeriod] = useState('12'); 
  const [selectedTickers, setSelectedTickers] = useState([]);

  // --- MEMORIZED LOGIC (The "Engine") ---
  const displayPortfolio = useMemo(() => {
    const aggregated = portfolio.reduce((acc, item) => {
      const ticker = item.ticker.toUpperCase();
      const vol = parseFloat(item.volume) || 0;
      const price = parseFloat(item.buy_price) || 0;
      const dateValue = item.date ? new Date(item.date).getTime() : new Date().getTime();

      if (!acc[ticker]) {
        acc[ticker] = { ...item, ticker, volume: vol, buy_price: price, first_bought: dateValue };
      } else {
        const totalVol = acc[ticker].volume + vol;
        acc[ticker].buy_price = ((acc[ticker].volume * acc[ticker].buy_price) + (vol * price)) / totalVol;
        acc[ticker].volume = totalVol;
        acc[ticker].first_bought = Math.min(acc[ticker].first_bought, dateValue);
      }
      return acc;
    }, {});
    return Object.values(aggregated);
  }, [portfolio]);

  const totals = useMemo(() => {
    if (!marketData) return { invested: 0, current: 0, pnl: 0 };
    return displayPortfolio.reduce((acc, item) => {
      const currentPrice = marketData[item.ticker]?.last_price || 0;
      const currentVal = item.volume * currentPrice;
      const investedVal = item.volume * item.buy_price;
      return {
        invested: acc.invested + investedVal,
        current: acc.current + currentVal,
        pnl: acc.pnl + (currentVal - investedVal)
      };
    }, { invested: 0, current: 0, pnl: 0 });
  }, [displayPortfolio, marketData]);

  // --- API ACTIONS ---
  const handleSync = useCallback(async (forceRefresh = false) => {
    if (displayPortfolio.length === 0) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/metrics`, {
        tickers: displayPortfolio.map(p => p.ticker),
        benchmark,
        period: period === 'max' ? 60 : parseInt(period),
        refresh: !!forceRefresh
      });
      setMarketData(response.data.marketData);
 
      localStorage.setItem('slock_portfolio', JSON.stringify(portfolio));
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [displayPortfolio, benchmark, period, portfolio]);

  // Add a ref to track the first render
const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  if (displayPortfolio.length === 0) return;

  const timeout = setTimeout(() => {
    handleSync(false);
  }, 500);

  return () => clearTimeout(timeout);
}, [benchmark, period]);

  // --- NAVIGATION HELPERS ---
  const navigateTo = (newView) => { window.scrollTo(0, 0); setView(newView); };

  if (view === 'landing') return <LandingPage 
        onEnterDashboard={() => navigateTo('dashboard')} 
        navigateTo={navigateTo} 
      />;

  if (view === 'journal') return <Journal portfolio={portfolio} navigateTo={navigateTo} />;

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        displayPortfolio={displayPortfolio}
        rawPortfolio={portfolio}
        setPortfolio={setPortfolio}
        onSave={() => handleSync(false)}
        onStartSearch={() => setIsSearchOpen(true)}
        onEdit={(asset) => setEditingAsset(asset)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onNavigate={navigateTo} />

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1800px] mx-auto">
            {loading ? (
              <div className="h-[600px] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="animate-spin text-emerald-500" size={48} />
                <p className="text-emerald-500 text-xs tracking-widest uppercase">Analyzing ...</p>
              </div>
            ) : marketData ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                
                <ControlPanel 
                  viewMode={viewMode} setViewMode={setViewMode}
                  benchmark={benchmark} setBenchmark={setBenchmark}
                  period={period} setPeriod={setPeriod}
                  onSync={handleSync}
                />

              
                  <div className="space-y-12">
                    {/* Allocation Section */}
                    <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                      <div className="xl:col-span-3 space-y-6">
                        <DistributionChart marketData={marketData} portfolio={displayPortfolio} colors={CHART_COLORS} />
                        
                      </div>
                      <div className="space-y-6">
                         <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl">
                            <p className="text-[12px] text-emerald-400 font-bold uppercase mb-1">Total Value</p>
                            <p className="text-2xl font-mono font-bold">{totals.current.toFixed(2)}€</p>
                         </div>
                          <div className={`p-6 rounded-2xl border ${totals.pnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <p className={`text-[12px] font-bold uppercase mb-1 ${totals.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              Total Profit / Loss
                            </p>
                            <div className="flex items-baseline gap-2">
                              <p className={`text-2xl font-mono font-bold ${totals.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {totals.pnl >= 0 ? '+' : ''}{totals.pnl.toFixed(2)}€
                              </p>
                              <span className={`text-xs font-bold ${totals.pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                                ({((totals.pnl / (totals.invested || 1)) * 100).toFixed(2)}%)
                              </span>
                            </div>
                          </div>
                      </div>
                    </section>

                    <SectorComparison marketData={marketData} portfolio={displayPortfolio} benchmark={benchmark} colors={CHART_COLORS} />

                    {/* Health & Analytics */}
                    <PortfolioHealth marketData={marketData} portfolio={displayPortfolio} benchmark={benchmark} />
                    
                    {/* History */}
                    <PerformanceChart 
                      marketData={marketData} portfolio={displayPortfolio} 
                      viewMode={viewMode} selectedTickers={selectedTickers} colors={CHART_COLORS}
                      onTickerClick={(t) => setSelectedTickers(prev => prev.includes(t) ? prev.filter(x => x!==t) : [...prev, t])}
                    />

                    <RiskAnalytics 
                    marketData={marketData} portfolio={displayPortfolio} colors={CHART_COLORS} 
                    viewMode={viewMode} selectedTickers={selectedTickers}
                    onTickerClick={(t) => setSelectedTickers(prev => 
                      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                    )}/>
                  </div>
                
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center opacity-50">
                <LayoutDashboard size={64} className="mb-4 text-emerald-800" />
                <p>Add your first asset in the sidebar to begin.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Replace your existing isSearchOpen block with this */}
      {(isSearchOpen || editingAsset) && (
        <AssetSearchCenter 
          initialData={editingAsset} // Pass the asset we want to edit
          onConfirm={(data) => {
            if (editingAsset) {
              // UPDATE MODE: Find the ID and replace the data
              setPortfolio(prev => prev.map(item => 
                item.id === editingAsset.id ? { ...data, buy_price: data.price, id: item.id } : item
              ));
            } else {
              // NEW ADD MODE
              setPortfolio(prev => [...prev, { ...data, buy_price: data.price, id: Date.now() }]);
            }
            setIsSearchOpen(false);
            setEditingAsset(null);
          }}
          onCancel={() => {
            setIsSearchOpen(false);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
};

export default App;