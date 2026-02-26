const ICON_CDN_BASE =
  'https://raw.githubusercontent.com/nicehash/cryptocurrency-icons/main/128';

/** Static mapping of common token symbols to icon URLs */
const ICON_MAP: Record<string, string> = {
  BTC: `${ICON_CDN_BASE}/btc.png`,
  ETH: `${ICON_CDN_BASE}/eth.png`,
  USDC: `${ICON_CDN_BASE}/usdc.png`,
  USDT: `${ICON_CDN_BASE}/usdt.png`,
  DAI: `${ICON_CDN_BASE}/dai.png`,
  SOL: `${ICON_CDN_BASE}/sol.png`,
  NEAR: `${ICON_CDN_BASE}/near.png`,
  BNB: `${ICON_CDN_BASE}/bnb.png`,
  AVAX: `${ICON_CDN_BASE}/avax.png`,
  MATIC: `${ICON_CDN_BASE}/matic.png`,
  POL: `${ICON_CDN_BASE}/matic.png`,
  DOT: `${ICON_CDN_BASE}/dot.png`,
  DOGE: `${ICON_CDN_BASE}/doge.png`,
  LTC: `${ICON_CDN_BASE}/ltc.png`,
  XRP: `${ICON_CDN_BASE}/xrp.png`,
  XLM: `${ICON_CDN_BASE}/xlm.png`,
  ADA: `${ICON_CDN_BASE}/ada.png`,
  TRX: `${ICON_CDN_BASE}/trx.png`,
  TON: `${ICON_CDN_BASE}/ton.png`,
  SUI: `${ICON_CDN_BASE}/sui.png`,
  APT: `${ICON_CDN_BASE}/apt.png`,
  WBTC: `${ICON_CDN_BASE}/wbtc.png`,
  WETH: `${ICON_CDN_BASE}/weth.png`,
  LINK: `${ICON_CDN_BASE}/link.png`,
  UNI: `${ICON_CDN_BASE}/uni.png`,
  AAVE: `${ICON_CDN_BASE}/aave.png`,
  ARB: `${ICON_CDN_BASE}/arb.png`,
  OP: `${ICON_CDN_BASE}/op.png`,
  BCH: `${ICON_CDN_BASE}/bch.png`,
  STRK: `${ICON_CDN_BASE}/strk.png`,
};

/**
 * Get the icon URL for a token symbol.
 * Falls back to CDN URL pattern if not in static map.
 */
export function getTokenIcon(symbol: string): string {
  return ICON_MAP[symbol.toUpperCase()] ?? `${ICON_CDN_BASE}/${symbol.toLowerCase()}.png`;
}
