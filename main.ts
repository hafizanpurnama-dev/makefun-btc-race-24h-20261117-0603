// BTC trailing-stop strategy for bars-replay/v1.
// Buy-and-hold with 3% trailing stop below peak close.
// Deterministic: no randomness, no clock, no environment reads.

import { runBars, type BarsState, type SellInput } from './vendor/makefun-bars.ts';

const MAX_SLIPPAGE_BPS = 200;
const TRAIL_BPS = 300;
const MIN_HOLD_BARS = 5;

let peakClose = 0n;
let entryBar = -1;
let hasExited = false;

await runBars({
  onBatch(state, batch) {
    const held = state.positions.get('CBBTC');

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

    const close = state.close('CBBTC');
    if (close === null) return [];

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

    // Entry: buy with all available cash on first opportunity
    if (held === undefined && !hasExited) {
      const { fees } = state.hello;
      if (state.cash >= BigInt(fees.min_notional_quote_units)) {
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