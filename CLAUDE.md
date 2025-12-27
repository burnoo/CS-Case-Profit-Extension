# CLAUDE.md

## Project Overview
CS Case Profit is a browser extension that displays probability and profitability information for CS2 case opening websites. It fetches case data from various sites, retrieves real Steam market prices, and calculates expected value, profit chance, and other statistics.

## Project Structure
- Extension code lives in `extension/` directory
- Site adapters are in `extension/src/sites/`

## Architecture
- **Content Scripts**: Site-specific adapters that extract case data from each supported website
- **Parsers**: Transform raw API/DOM data into a unified `CaseData` format
- **Services**: Shared utilities for pricing (CSGOTrader), currency conversion, and caching
- **UI**: `ProbabilityBox` component displays stats and item tables on case pages

## Supported Sites
- Hellcase, KeyDrop, DatDrop, SkinClub
- CSGOEmpire, CSGO500, ClashGG
- CSGOCases, DaddySkins, CSGO-Skins

## Key Patterns
- All site prices should be normalized to USD internally
- `CurrencyService.formatPrice()` converts USD to user's display currency
- Steam prices from CSGOTrader are always in USD
- Market hash names must match Steam format exactly for price lookups

## Rules
- **Never commit changes unless explicitly asked** - wait for user to request a commit
