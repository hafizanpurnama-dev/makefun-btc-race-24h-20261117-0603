// BTC dip-buyer with trailing stop for bars-replay/v1.
// Waits for a small dip from the opening price before buying,
// then trails a 3% stop below peak. Falls back to market buy
// if no dip appears within 60 bars.
// Deterministic: no randomness, no clock, no environment reads.

import { BPS, runBars, type BarsState, type SellInput } from './vendor/makefun-bars.ts';

const MAX_SLIPPAGE_BPS = 200;
const TRAIL_BPS = 300;
const MIN_HOLD_BARS = 5;
const DIP_BPS = 20;          // Buy when price drops 20 bps from opening
const MAX_WAIT_BARS = 60;    // Buy anyway after 60 bars

let openPrice = 0n;          // First observed close
let peakClose = 0n;
let entryBar = -1;
let hasExited = false;

await runBars({
  onBatch(state, batch) {
    const held = state.positions.get('CBBTC');
    const close = state.close('CBBTC');
    if (close === null) return [];

    // Capture opening price on first bar
    if (openPrice === 0n) openPrice = close;

    // Track peak while holding
    if (held !== undefined) {
      for (const bar of batch.bars) {
        if (bar.symbol === 'CBBTC') {
          const c = BigInt(bar.c);
          if (c > peakClose) peakClose = c;
        }
      }
    }

    if (state.warmingUp) return [];

    // Trailing stop: exit if price drops 3% below peak
    if (held !== undefined && !hasExited) {
      const heldBars = state.seq - entryBar;
      if (heldBars >= MIN_HOLD_BARS) {
        const stopLevel = (peakClose * (10000n - BigInt(TRAIL_BPS))) / 10000n;
        if (close <= stopLevel) {
          hasExited = true;
          return [{ side: 'sell', symbol: 'CBBTC', qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
        }
      }
      return [];
    }

    // Entry: wait for a dip, or buy after MAX_WAIT_BARS
    if (held === undefined && !hasExited) {
      const { fees } = state.hello;
      if (state.cash < BigInt(fees.min_notional_quote_units)) return [];

      const dipTarget = (openPrice * (10000n - BigInt(DIP_BPS))) / 10000n;
      const shouldBuy = close <= dipTarget || state.seq >= MAX_WAIT_BARS;

      if (shouldBuy) {
        entryBar = state.seq;
        peakClose = close;
        return [{
          side: 'buy',
          symbol: 'CBBTC',
          notional_quote_units: state.cash,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        }];
      }
    }

    return [];
  },
});