import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getTickerColor } from '../constants';

const BENCH_TICKERS = ["^GSPC", "URTH", "^FCHI"];

const PerformanceChart = ({ marketData, portfolio, viewMode, colors, selectedTickers, onTickerClick }) => {
  if (!marketData || Object.keys(marketData).length === 0) return null;

  const tickers = Object.keys(marketData);

  const chartData = useMemo(() => {
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

      if (viewMode === 'portfolio') {
        let totalValue = 0;
        let weightedReturn = 0;
        portfolio.forEach(item => {
          const day = lookups[item.ticker]?.[entry.date];
          if (day) {
            const val = day.adj_close * parseFloat(item.volume);
            totalValue += val;
            weightedReturn += val * day.cum_return;
          }
        });
        dataPoint["My Portfolio"] = totalValue > 0
          ? parseFloat(((weightedReturn / totalValue) * 100).toFixed(2))
          : 0;

        const activeBench = tickers.find(t => BENCH_TICKERS.includes(t));
        if (activeBench) {
          const benchDay = lookups[activeBench]?.[entry.date];
          if (benchDay) {
            dataPoint[activeBench] = parseFloat((benchDay.cum_return * 100).toFixed(2));
          }
        }
      } else {
        tickers.forEach(ticker => {
          const tickerDay = lookups[ticker]?.[entry.date];
          if (tickerDay) {
            dataPoint[ticker] = parseFloat((tickerDay.cum_return * 100).toFixed(2));
          }
        });
      }
      return dataPoint;
    });
  }, [marketData, portfolio, viewMode]);

  return (
    <div className="h-[400px] w-full mt-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-black text-center">
        Cumulative Returns (%)
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#4b5563" 
            fontSize={11}
            tickFormatter={(t) => t ? new Date(t).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ""}
            minTickGap={30}
          />
          <YAxis stroke="#4b5563" fontSize={11} tickFormatter={(v) => `${v}%`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
            formatter={(val, name) => [`${val}%`, name]}
          />
          <Legend 
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase', cursor: 'pointer' }}
            onClick={(e) => onTickerClick(e.value)}
          />

          {chartData && chartData.length > 0 &&
            Object.keys(chartData[0])
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
                    strokeWidth={isHighlighted ? (isPort || isBench ? 3 : 2) : 1}
                    strokeOpacity={isHighlighted ? 1 : 0.15}
                    strokeDasharray={isBench ? "5 5" : "0"}
                    dot={false}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    isAnimationActive={false}
                  />
                );
              })
          }
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;