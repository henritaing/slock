import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getTickerColor } from '../constants';

const BENCH_TICKERS = ["^GSPC", "URTH", "^FCHI"];

const RiskAnalytics = ({ marketData, portfolio, viewMode, colors, selectedTickers, onTickerClick }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const tickers = Object.keys(marketData);

  const volComparisonData = useMemo(() => {
    const firstTickerHistory = marketData[tickers[0]]?.history || [];

    const lookups = {};
    tickers.forEach(t => {
      lookups[t] = {};
      (marketData[t]?.history || []).forEach(row => {
        lookups[t][row.date] = row;
      });
    });

    return firstTickerHistory.map(entry => {
      const dataPoint = { date: entry.date };
      const activeBench = tickers.find(t => BENCH_TICKERS.includes(t));

      if (activeBench) {
        const benchDay = lookups[activeBench]?.[entry.date];
        if (benchDay?.volatility !== undefined) {
          dataPoint[activeBench] = parseFloat((benchDay.volatility * 100).toFixed(2));
        }
      }

      if (viewMode === 'portfolio') {
        let totalValue = 0;
        let weightedVol = 0;
        portfolio.forEach(item => {
          const day = lookups[item.ticker]?.[entry.date];
          if (day?.volatility) {
            const val = day.adj_close * parseFloat(item.volume);
            totalValue += val;
            weightedVol += val * day.volatility;
          }
        });
        dataPoint["My Portfolio"] = totalValue > 0
          ? parseFloat(((weightedVol / totalValue) * 100).toFixed(2))
          : 0;
      } else {
        tickers.forEach(t => {
          if (BENCH_TICKERS.includes(t)) return;
          const tickerDay = lookups[t]?.[entry.date];
          if (tickerDay?.volatility) {
            dataPoint[t] = parseFloat((tickerDay.volatility * 100).toFixed(2));
          }
        });
      }
      return dataPoint;
    }).filter(d => Object.keys(d).length > 1);
  }, [marketData, portfolio, viewMode]);

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
      <p className="text-[10px] text-zinc-500 font-black uppercase mb-6 tracking-[0.2em] text-center">
        Annualized Volatility Trend (%)
      </p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={volComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#3f3f46" 
              fontSize={10}
              tickFormatter={(t) => t ? new Date(t).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ""}
              minTickGap={40}
            />
            <YAxis stroke="#3f3f46" fontSize={10} tickFormatter={(v) => `${v}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
              itemStyle={{ fontSize: '11px' }}
              formatter={(val, name) => [`${val}%`, name]}
            />
            <Legend 
              verticalAlign="top"
              align="right"
              iconType="circle"
              onClick={(e) => onTickerClick(e.value)}
              wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingBottom: '20px', cursor: 'pointer' }}
            />

            {volComparisonData && volComparisonData.length > 0 &&
              Object.keys(volComparisonData[0])
                .filter(k => k !== 'date')
                .map((ticker, i) => {
                  const isBench = BENCH_TICKERS.includes(ticker);
                  const isPort = ticker === "My Portfolio";
                  const isHighlighted = !selectedTickers || selectedTickers.length === 0 || selectedTickers.includes(ticker);
                  const strokeColor = getTickerColor(ticker, colors);

                  return (
                    <Line
                      key={ticker}
                      type="monotone"
                      dataKey={ticker}
                      stroke={isHighlighted ? strokeColor : '#27272a'}
                      strokeOpacity={isHighlighted ? 1 : 0.1}
                      strokeWidth={isHighlighted ? (isPort || isBench ? 3 : 2) : 1}
                      dot={false}
                      style={{ transition: 'all 0.3s ease' }}
                      strokeDasharray={isBench ? "5 5" : "0"}
                      isAnimationActive={false}
                    />
                  );
                })
            }
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RiskAnalytics;