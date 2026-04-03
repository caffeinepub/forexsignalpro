import type { Candle } from "../utils/indicators";
import { calcEMA } from "../utils/indicators";

interface CandlestickChartProps {
  candles: Candle[];
  currentPrice: number | null;
}

export default function CandlestickChart({
  candles,
  currentPrice,
}: CandlestickChartProps) {
  const displayCandles = candles.slice(-60);
  const prices = displayCandles.map((c) => c.close);

  const ema9Points = prices.map((_, i) => {
    if (i < 9) return null;
    return calcEMA(prices.slice(0, i + 1), 9);
  });

  const ema21Points = prices.map((_, i) => {
    if (i < 21) return null;
    return calcEMA(prices.slice(0, i + 1), 21);
  });

  const allPrices = displayCandles.flatMap((c) => [c.high, c.low]);
  if (currentPrice !== null) allPrices.push(currentPrice);

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 1;
  const priceRange = maxPrice - minPrice || 0.0001;

  const viewWidth = 600;
  const viewHeight = 300;
  const paddingLeft = 8;
  const paddingRight = 48;
  const paddingTop = 12;
  const paddingBottom = 24;

  const chartWidth = viewWidth - paddingLeft - paddingRight;
  const chartHeight = viewHeight - paddingTop - paddingBottom;

  const candleCount = Math.max(displayCandles.length, 1);
  const candleWidth = Math.max(2, (chartWidth / candleCount) * 0.7);
  const candleSpacing = chartWidth / candleCount;

  const toY = (p: number) =>
    paddingTop + chartHeight - ((p - minPrice) / priceRange) * chartHeight;
  const toX = (index: number) =>
    paddingLeft + index * candleSpacing + candleSpacing / 2;

  const priceLevels = 5;
  const priceLabels = Array.from({ length: priceLevels }, (_, i) => {
    const p = minPrice + (priceRange / (priceLevels - 1)) * i;
    return { price: p, y: toY(p) };
  });

  const buildPolyline = (points: (number | null)[]) => {
    const segments: string[] = [];
    let current = "";
    points.forEach((val, i) => {
      if (val === null) {
        if (current) segments.push(current.trim());
        current = "";
      } else {
        current += ` ${toX(i).toFixed(1)},${toY(val).toFixed(1)}`;
      }
    });
    if (current) segments.push(current.trim());
    return segments;
  };

  const ema9Segments = buildPolyline(ema9Points);
  const ema21Segments = buildPolyline(ema21Points);

  if (displayCandles.length === 0) {
    return (
      <div
        className="w-full rounded-lg flex items-center justify-center"
        style={{ backgroundColor: "#0d1120", height: "220px" }}
      >
        <span style={{ color: "#8b92a8" }} className="text-sm">
          Məlumat yüklənir...
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        backgroundColor: "#0d1120",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      data-ocid="chart.canvas_target"
    >
      <svg
        width="100%"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-label="Forex candlestick price chart"
        role="img"
      >
        <title>Forex Candlestick Chart</title>
        {priceLabels.map((label) => (
          <line
            key={`grid-${label.price.toFixed(6)}`}
            x1={paddingLeft}
            y1={label.y}
            x2={viewWidth - paddingRight}
            y2={label.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {displayCandles.map((candle) => {
          const idx = displayCandles.indexOf(candle);
          const x = toX(idx);
          const openY = toY(candle.open);
          const closeY = toY(candle.close);
          const highY = toY(candle.high);
          const lowY = toY(candle.low);
          const isBullish = candle.close >= candle.open;
          const color = isBullish ? "#00ff88" : "#ff1744";
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1, Math.abs(closeY - openY));

          return (
            <g key={`candle-${candle.timestamp}-${idx}`}>
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth="1"
                opacity="0.8"
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isBullish ? color : "transparent"}
                stroke={color}
                strokeWidth="1"
                opacity="0.9"
              />
            </g>
          );
        })}

        {ema9Segments.map((seg, i) => (
          <polyline
            key={`ema9-seg-${i}-${seg.slice(0, 10)}`}
            points={seg}
            fill="none"
            stroke="#00d4ff"
            strokeWidth="1.5"
            opacity="0.8"
          />
        ))}

        {ema21Segments.map((seg, i) => (
          <polyline
            key={`ema21-seg-${i}-${seg.slice(0, 10)}`}
            points={seg}
            fill="none"
            stroke="#ffd700"
            strokeWidth="1.5"
            opacity="0.8"
          />
        ))}

        {currentPrice !== null && (
          <line
            x1={paddingLeft}
            y1={toY(currentPrice)}
            x2={viewWidth - paddingRight}
            y2={toY(currentPrice)}
            stroke="#8b92a8"
            strokeWidth="1"
            strokeDasharray="4,3"
            opacity="0.6"
          />
        )}

        {priceLabels.map((label) => (
          <text
            key={`label-${label.price.toFixed(6)}`}
            x={viewWidth - paddingRight + 4}
            y={label.y + 4}
            fontSize="8"
            fill="#6b7280"
            fontFamily="'JetBrains Mono', monospace"
          >
            {label.price.toFixed(4)}
          </text>
        ))}

        <g>
          <rect
            x={paddingLeft + 4}
            y={paddingTop + 4}
            width="6"
            height="2"
            fill="#00d4ff"
            rx="1"
          />
          <text
            x={paddingLeft + 14}
            y={paddingTop + 8}
            fontSize="7"
            fill="#00d4ff"
            fontFamily="sans-serif"
          >
            EMA9
          </text>
          <rect
            x={paddingLeft + 44}
            y={paddingTop + 4}
            width="6"
            height="2"
            fill="#ffd700"
            rx="1"
          />
          <text
            x={paddingLeft + 54}
            y={paddingTop + 8}
            fontSize="7"
            fill="#ffd700"
            fontFamily="sans-serif"
          >
            EMA21
          </text>
        </g>
      </svg>
    </div>
  );
}
