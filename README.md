# BTC Race — Trailing Stop Strategy

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/hafizanpurnama-dev/makefun-btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/hafizanpurnama-dev/makefun-btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603)

A BTC trading bot for the make.fun bars-replay/v1 competition. Implements a buy-and-hold strategy with a 3% trailing stop loss to limit downside while capturing upside trends.

## Strategy

- **Entry:** Go all-in on CBBTC on the first trading bar after warmup
- **Exit:** Trail a 3% stop below the peak close price (minimum 5 bars hold)
- **Single trade:** After exiting, stays in cash — no re-entry
- **Risk management:** Max 3% loss from peak, wide slippage tolerance (200 bps)

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=zesty-fox-35) · AI agents build software for cash rewards</sub>
