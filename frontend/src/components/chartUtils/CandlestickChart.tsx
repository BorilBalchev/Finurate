import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type SeriesOptionsMap,
  type DeepPartial,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from 'lightweight-charts';


interface CandleDataWithVolume {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_diff?: number,
  ema50?: number;
  ema100?: number;
  ema200?: number;
}

interface Props {
  data: CandleDataWithVolume[];
  showRSI: boolean;
  showMACD: boolean;
}

const formatTime = (time: Time): string => {
  if (typeof time === 'number') {
    return new Date(time * 1000).toLocaleDateString()
  } else if (typeof time === 'string') {
    return time
  } else {
    const { year, month, day } = time
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
}

const ChartPanel: React.FC<Props> = ({ data, showRSI, showMACD }) => {
  // refs for chart containers
  const candleRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);

  // refs to hold chart instances
  const candleChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const [tooltipData, setTooltipData] = useState<Partial<CandleDataWithVolume>>({});

  useEffect(() => {
    if (!candleRef.current) return;

    const subscriptions: (() => void)[] = [];

    const commonOptions: DeepPartial<ReturnType<typeof createChart>['options']> = {
      layout: { background: { color: '#1e1e1e' }, textColor: '#d1d4dc' },
      grid: {
        vertLines: { color: '#2c2c2cff' },
        horzLines: { color: '#2c2c2cff' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      leftPriceScale: {
        visible: true,
        borderVisible: true,
        scaleMargins: { top: 0.7, bottom: 0 },
      },
    };
    
    // main candlestick chart
    const candleChart = createChart(candleRef.current, {
      width: candleRef.current.clientWidth,
      height: 300,
      ...commonOptions,
    });
    candleChartRef.current = candleChart;

    const candlestickSeries = candleChart.addSeries(CandlestickSeries,{
      priceLineVisible: false,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) =>
        price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
      }, 
    });
    candlestickSeries.setData(data);

    // volume histogram on the left price scale
    const volumeSeries = candleChart.addSeries(HistogramSeries,{
      priceScaleId: 'left',
      color: '#23446bff',
      priceFormat: { type: 'volume' },
    });
    volumeSeries.setData(
      data.map(d => ({
        time: d.time,
        value: d.volume,
        color: '#23446bff',
      }))
    );

    // adding EMA lines
    const addEMASeries = (key: keyof CandleDataWithVolume, color: string) => {
      const series = candleChart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(data.filter(d => d[key] !== undefined).map(d => ({
        time: d.time,
        value: d[key]!,
      })));
    };
    addEMASeries('ema50', '#f39c12');
    addEMASeries('ema100', '#27ae60');
    addEMASeries('ema200', '#2980b9');

    // RSI
    let rsiSeries: ISeriesApi<'Line'> | null = null;
    if (showRSI && rsiRef.current) {
      const rsiChart = createChart(rsiRef.current, {
        width: rsiRef.current.clientWidth,
        height: 150,
        ...commonOptions,
      });
      rsiChartRef.current = rsiChart;

      rsiSeries = rsiChart.addSeries(LineSeries,{
        color: '#9b59b6',
        lineWidth: 2,
      });
      rsiSeries.setData(data.filter(d => d.rsi !== undefined).map(d => ({
        time: d.time,
        value: d.rsi!,
      })));
    }

    // MACD
    let macdSeries: ISeriesApi<'Line'> | null = null;
    if (showMACD && macdRef.current) {
      const macdChart = createChart(macdRef.current, {
        width: macdRef.current.clientWidth,
        height: 150,
        ...commonOptions,
      });
      macdChartRef.current = macdChart;

      // adding MACD line
      macdSeries = macdChart.addSeries(LineSeries,{
        color: '#3c47e7ff',
        lineWidth: 2,
        priceFormat: {
        type: 'custom',
        formatter: (price: number) =>
        price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        }, 
      });
      macdSeries.setData(data.filter(d => d.macd !== undefined).map(d => ({
        time: d.time,
        value: d.macd!,
      })));
      
      // adding MACD signal line
      const macdSignalSeries = macdChart.addSeries(LineSeries,{
        color: '#e74c3c',
        lineWidth: 2,
      });
      macdSignalSeries.setData(data.filter(d => d.macd_signal !== undefined).map(d => ({
        time: d.time,
        value: d.macd_signal!,
      })));

      macdChart.priceScale('left').applyOptions({
        scaleMargins: { top: 0.3, bottom: 0.3 },
        borderVisible: false,
      });

      // adding MACD histogram
      const histogramSeries = macdChart.addSeries(HistogramSeries, {
        priceScaleId: 'left',
        base: 0,
        color: '#7f8c8d',
        priceLineVisible: false,
        priceFormat: {
            type: 'custom',
            formatter: (price: number) =>
            price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        }, 
      });

      const histogramData = data
      .filter(d => d.macd !== undefined && d.macd_signal !== undefined)
      .map(d => {
          const diff = d.macd! - d.macd_signal!;
          return {
          time: d.time,
          value: diff,
          color: diff >= 0 ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)',
          };
      });

      histogramSeries.setData(histogramData);


    }

    // synchronizing the time range
    const syncCharts = (sourceChart: IChartApi, targetCharts: IChartApi[]) => {
      sourceChart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (!range) return;
        targetCharts.forEach(chart => {
          try {
            chart.timeScale().setVisibleRange(range);
          } catch (err) {
            console.warn("Sync failed:", err);
          }
        });
      });
    };

    const allCharts = [
      candleChartRef.current,
      showRSI ? rsiChartRef.current : null,
      showMACD ? macdChartRef.current : null,
    ].filter(Boolean) as IChartApi[];

    allCharts.forEach(source => {
      const targets = allCharts.filter(c => c !== source);
      syncCharts(source, targets);
    });

    // synchronizing crosshair movement
    const syncCrosshair = <
      SourceSeriesType extends keyof SeriesOptionsMap,
      TargetSeriesType extends keyof SeriesOptionsMap
    >(
      sourceChart: IChartApi,
      sourceSeries: ISeriesApi<SourceSeriesType>,
      targets: { chart: IChartApi; series: ISeriesApi<TargetSeriesType> }[]
    ) => {
      sourceChart.subscribeCrosshairMove(param => {
        if (!param.time || !param.point) return;
        const price = sourceSeries.coordinateToPrice(param.point.y);
        if (price === null) return;

        targets.forEach(({ chart, series }) => {
          chart.setCrosshairPosition(price, param.time!, series);
        });
      });
    };

    const crosshairTargets = [];
    if (showRSI && rsiSeries && rsiChartRef.current)
      crosshairTargets.push({ chart: rsiChartRef.current, series: rsiSeries });
    if (showMACD && macdSeries && macdChartRef.current)
      crosshairTargets.push({ chart: macdChartRef.current, series: macdSeries });

    syncCrosshair(candleChart, candlestickSeries, crosshairTargets);

    candleChart.subscribeCrosshairMove(param => {
      if (!param || !param.time) return setTooltipData({});
      const candle = data.find(d => JSON.stringify(d.time) === JSON.stringify(param.time));
      setTooltipData(candle || {});
    });

    // resizing charts on window resize
    const handleResize = () => {
      const width = candleRef.current ? candleRef.current.clientWidth : 0;
      candleChart.resize(width, 300);
      if (showRSI && rsiChartRef.current) rsiChartRef.current.resize(width, 150);
      if (showMACD && macdChartRef.current) macdChartRef.current.resize(width, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      subscriptions.forEach(unsub => unsub());
      [candleChartRef.current, rsiChartRef.current, macdChartRef.current].forEach(chart => {
        chart?.remove();
      });
      candleChartRef.current = null;
      rsiChartRef.current = null;
      macdChartRef.current = null;
      window.removeEventListener('resize', handleResize);
    };
  }, [data, showRSI, showMACD]);

  return (
     <div style={{ position: 'relative', width: '100%', height: '60vh' }}>
       <div ref={candleRef} />
       {tooltipData.time && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: 'rgba(160, 159, 159, 0.8)',
            padding: '8px',
            borderRadius: 4,
            fontSize: 12,
            boxShadow: '0 0 5px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div><strong>{formatTime(tooltipData.time)}</strong></div>
          {/* <div>Close: {tooltipData.close?.toFixed(2)}</div> */}
          <div>Close: ${tooltipData.close?.toLocaleString()}</div>
          <div>Volume: ${tooltipData.volume?.toLocaleString()}</div>
          {showRSI && <div>RSI: {tooltipData.rsi?.toLocaleString()}</div>}
          {showMACD && <div>MACD Line: {tooltipData.macd?.toLocaleString()}</div>}
          {showMACD && <div>MACD Signal: {tooltipData.macd_signal?.toLocaleString()}</div>}
          {showMACD && <div>MACD Difference: {tooltipData.macd_diff?.toLocaleString()}</div>}
        </div>
      )}
      {showRSI && <div ref={rsiRef} />}
      {showMACD && <div ref={macdRef}  />}
    </div>
  );
};

export default ChartPanel;

