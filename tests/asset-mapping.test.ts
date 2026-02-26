import { describe, it, expect } from 'vitest';
import { AssetMapper } from '../src/internal/asset-mapping.js';
import type { ProtocolToken } from '../src/internal/types.js';

function makeProtocolToken(overrides: Partial<ProtocolToken> = {}): ProtocolToken {
  return {
    defuseAssetId: 'nep141:usdc.bridge.near',
    chainName: 'ethereum',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    ...overrides,
  };
}

describe('AssetMapper', () => {
  describe('buildFromProtocolTokens', () => {
    it('maps goBlink asset IDs to protocol IDs', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          defuseAssetId: 'nep141:usdc.bridge.near',
          chainName: 'ethereum',
          symbol: 'USDC',
        }),
      ]);

      expect(mapper.resolveToProtocol('ethereum:usdc')).toBe('nep141:usdc.bridge.near');
    });

    it('maps protocol IDs back to goBlink asset IDs', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          defuseAssetId: 'nep141:usdc.bridge.near',
          chainName: 'ethereum',
          symbol: 'USDC',
        }),
      ]);

      const assetId = mapper.resolveFromProtocol('nep141:usdc.bridge.near');
      expect(assetId).toBe('ethereum:usdc');
    });

    it('handles tokens with contract addresses', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          defuseAssetId: 'nep141:a0b86991.bridge.near',
          chainName: 'ethereum',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
        }),
      ]);

      // Should be accessible by both address and symbol
      expect(
        mapper.resolveToProtocol('ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
      ).toBe('nep141:a0b86991.bridge.near');
      expect(mapper.resolveToProtocol('ethereum:usdc')).toBe('nep141:a0b86991.bridge.near');
    });

    it('maps different chain names correctly', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          defuseAssetId: 'nep141:sol.omft.near',
          chainName: 'solana',
          symbol: 'SOL',
        }),
        makeProtocolToken({
          defuseAssetId: 'nep141:btc.omft.near',
          chainName: 'bitcoin',
          symbol: 'BTC',
        }),
        makeProtocolToken({
          defuseAssetId: 'nep141:sui.omft.near',
          chainName: 'sui',
          symbol: 'SUI',
        }),
      ]);

      expect(mapper.resolveToProtocol('solana:sol')).toBe('nep141:sol.omft.near');
      expect(mapper.resolveToProtocol('bitcoin:btc')).toBe('nep141:btc.omft.near');
      expect(mapper.resolveToProtocol('sui:sui')).toBe('nep141:sui.omft.near');
    });

    it('skips tokens with unknown chain names', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({ chainName: 'unknown_chain' }),
      ]);

      expect(mapper.getAllTokens()).toHaveLength(0);
    });
  });

  describe('getAllTokens', () => {
    it('returns all mapped tokens', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({ chainName: 'ethereum', symbol: 'USDC', defuseAssetId: 'nep141:usdc' }),
        makeProtocolToken({ chainName: 'solana', symbol: 'SOL', defuseAssetId: 'nep141:sol' }),
      ]);

      const tokens = mapper.getAllTokens();
      expect(tokens).toHaveLength(2);
    });
  });

  describe('findToken', () => {
    it('finds token by chain and symbol', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          chainName: 'ethereum',
          symbol: 'USDC',
          defuseAssetId: 'nep141:usdc.bridge.near',
        }),
      ]);

      const token = mapper.findToken('ethereum', 'USDC');
      expect(token).toBeDefined();
      expect(token?.symbol).toBe('USDC');
      expect(token?.chain).toBe('ethereum');
    });

    it('returns undefined for non-existent token', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([]);

      expect(mapper.findToken('ethereum', 'USDC')).toBeUndefined();
    });

    it('is case-insensitive for symbol lookup', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({
          chainName: 'ethereum',
          symbol: 'USDC',
          defuseAssetId: 'nep141:usdc',
        }),
      ]);

      expect(mapper.findToken('ethereum', 'usdc')).toBeDefined();
      expect(mapper.findToken('ethereum', 'Usdc')).toBeDefined();
    });
  });

  describe('rebuilding', () => {
    it('clears previous mapping when rebuilt', () => {
      const mapper = new AssetMapper();
      mapper.buildFromProtocolTokens([
        makeProtocolToken({ defuseAssetId: 'nep141:old', chainName: 'ethereum', symbol: 'OLD' }),
      ]);

      expect(mapper.resolveToProtocol('ethereum:old')).toBe('nep141:old');

      mapper.buildFromProtocolTokens([
        makeProtocolToken({ defuseAssetId: 'nep141:new', chainName: 'ethereum', symbol: 'NEW' }),
      ]);

      expect(mapper.resolveToProtocol('ethereum:old')).toBeUndefined();
      expect(mapper.resolveToProtocol('ethereum:new')).toBe('nep141:new');
    });
  });
});
