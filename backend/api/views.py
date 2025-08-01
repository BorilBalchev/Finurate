from django.shortcuts import render

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import yfinance as yf
import json
import pandas as pd
import numpy as np
import math
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Scales a portfolio metric to 0-100 range
def scale_value(value, min_val, max_val):
    scaled = ((value - min_val) / (max_val - min_val)) * 100
    return max(0, min(scaled, 100))

# Computes percent change
def price_change(base, current):
    change = current / base
    percent_change = (change - 1) * 100
    return(round(percent_change, 2))


@csrf_exempt
def portfolio_prices(request):
    # only POST requests accepted
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    try:
        data = json.loads(request.body)
        assets = data.get('assets', [])
        timeFrame = data.get('timeFrame')

        tickers = []
        shares_map = {}

        # extracting asset info
        for asset in assets:
            ticker = asset.get('ticker')
            name = asset.get('name')
            shares = float(asset.get('amount', 0))
            if not ticker or shares <= 0:
                continue
            tickers.append(ticker.upper())
            shares_map[ticker.upper()] = [shares, name]

        if not tickers:
            return JsonResponse({'error': 'No valid tickers provided'}, status=400)
        
        # fetching historical technical data
        prices_data = yf.download(tickers if len(tickers) > 1 else tickers[0], period="1y", interval='1d', auto_adjust=True)
        # metric_data = prices_data[-366:]
        # print(metric_data)

        total_value = 0.0
        details = []
        asset_values = {}
        liquidity_scores = {}
        close_prices = prices_data['Close']
        volume_values = prices_data['Volume']
        weighted_values = pd.DataFrame()
        weighted_list = []

        for ticker in tickers:
            try:
                # extracting price and volume series
                if isinstance(close_prices, pd.DataFrame) and ticker in close_prices.columns:
                    price_series = close_prices[ticker].dropna()
                    volume_series = volume_values[ticker].dropna()
                else:
                    price_series = close_prices.dropna()
                    volume_series = volume_values.dropna()

                if price_series.empty:
                    raise ValueError("No price data available")

                latest_price = price_series.iloc[-1]
                base_price = price_series.iloc[-8]
                change = price_change(base_price, latest_price)
                shares, name = shares_map[ticker]
                value = round(latest_price * shares, 2)
                total_value += value

                asset_values[ticker] = value

                avg_volume_30d = volume_series[-30:].mean()
                liquidity_scores[ticker] = avg_volume_30d

                details.append({
                    'ticker': ticker,
                    'name': name,
                    'price': round(latest_price, 2),
                    'shares': shares,
                    'value': value,
                    'change': change
                })

                weighted_series = price_series * shares
                weighted_series.name = ticker
                weighted_list.append(weighted_series)

            except Exception as e:
                details.append({
                    'ticker': ticker,
                    'name': shares_map.get(ticker, ['', None])[1],
                    'price': None,
                    'shares': shares_map.get(ticker, [0])[0],
                    'value': 0.0,
                    'error': f"Failed to get price: {str(e)}"
                })
        
        # constructing total portfolio value over over time
        weighted_values = pd.concat(weighted_list, axis=1)
        full_date_range = pd.date_range(
            start=weighted_values.index.min(),
            end=weighted_values.index.max(),
            freq='D'
        )
        weighted_values = weighted_values.reindex(full_date_range)
        weighted_values = weighted_values.ffill()
        portfolio_value_series = weighted_values.sum(axis=1).dropna()

        # formatting
        historical_portfolio_value = [
            {'date': date.strftime('%Y-%m-%d'), 'value': round(value, 2)}
            for date, value in portfolio_value_series.items()
        ]

        # computing value change
        current_price = total_value
        value_change_7d = price_change(historical_portfolio_value[-8]['value'], current_price)
        value_change_30d = price_change(historical_portfolio_value[-31]['value'], current_price)
        value_change_1y = price_change(historical_portfolio_value[-366]['value'], current_price)
        
        # computing portfolio performance metrics for the past year
        growth = (portfolio_value_series.iloc[-1] / portfolio_value_series.iloc[0] - 1) * 100
        daily_returns = portfolio_value_series.pct_change().dropna()
        volatility = daily_returns.std() * 100
        risk = daily_returns.std() * np.sqrt(365) * 100

        # computing portfolio diversification taking sectors into account
        sector_values = {}
        for ticker in tickers:
            value = asset_values[ticker]
        for asset in assets:
            value = asset_values[asset.get('ticker')]
            sector = asset.get('sector')
            sector_values[sector] = sector_values.get(sector, 0) + value

        sector_proportions = np.array(list(sector_values.values())) / total_value
        sector_hhi = np.sum(sector_proportions ** 2)
        sector_div_score = round((1 - sector_hhi) * 100, 2)

        values = np.array([asset_values[t] for t in tickers])
        proportions = values / total_value
        hhi = np.sum(proportions ** 2)
        diversification_score = round((1 - hhi) * 100, 2)

        overall_div_score = round((diversification_score + sector_div_score) / 2, 2)


        # computing liquidity
        liquidity_score = sum(
            (asset_values[t] / total_value) * liquidity_scores.get(t, 0)
            for t in tickers
        )
        liquidity_score = round(liquidity_score, 2)

        # scaling
        print(growth)
        scaled_growth = scale_value(round(growth, 2), 0, 50)
        scaled_volatility = scale_value(round(volatility, 2), 0, 5)
        scaled_risk = scale_value(round(risk, 2), 0, 100)
        scaled_liquidity = scale_value(math.log10(liquidity_score), 6, 11)


        response_data = {
            'total_value': round(float(total_value), 2),
            'assets': details,
            'historical_portfolio_value': historical_portfolio_value,
            'metrics': {
                'growth_percent': scaled_growth,
                'daily_volatility_percent': scaled_volatility,
                'annualized_risk_percent': scaled_risk,
                'diversification_score': overall_div_score,
                'liquidity_score': scaled_liquidity,
            },
            'value_change': {
                '7D': value_change_7d,
                '30D': value_change_30d,
                '1Y': value_change_1y,
            }
        }

        return JsonResponse(json.loads(json.dumps(response_data, default=str)), safe=False)

    except Exception as e:
        return JsonResponse({'error': f'Internal Server Error: {str(e)}'}, status=500)


def calculate_ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(series, fast=12, slow=26, signal=9):
    ema_fast = calculate_ema(series, fast)
    ema_slow = calculate_ema(series, slow)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_diff = macd_line - signal_line
    return macd_line, signal_line, macd_diff


@csrf_exempt
def historical_data(request):

    ticker = request.GET.get('ticker')

    # flags for indicators
    include_rsi = request.GET.get('rsi') == 'true'
    include_macd = request.GET.get('macd') == 'true'
    include_ema50 = request.GET.get('ema50') == 'true'
    include_ema100 = request.GET.get('ema100') == 'true'
    include_ema200 = request.GET.get('ema200') == 'true'


    if not ticker:
        return JsonResponse({'error': 'Missing ticker parameter'}, status=400)

    try:
        data_raw = yf.download(ticker, period="5y", interval='1d', group_by='ticker', auto_adjust=True)

        # handling MultiIndex structure
        if isinstance(data_raw.columns, pd.MultiIndex):
            if ticker in data_raw.columns.get_level_values(0):
                data = data_raw.xs(ticker, axis=1, level=0)
            else:
                first_ticker = data_raw.columns.get_level_values(0)[0]
                data = data_raw.xs(first_ticker, axis=1, level=0)
        else:
            data = data_raw


        if data.empty:
            return JsonResponse({'error': 'No data found for ticker'}, status=404)
        
        close = data['Close']
        latest_price = data['Close'].iloc[-1]

        # computing price change
        value_change_7d = price_change(data['Close'].iloc[-8], latest_price)
        value_change_30d = price_change(data['Close'].iloc[-31], latest_price)
        value_change_1y = price_change(data['Close'].iloc[-366], latest_price)
        
        # adding technical indicators
        if include_rsi:
            data['RSI'] = calculate_rsi(close)
        if include_macd:
            macd_line, signal_line, macd_diff = calculate_macd(close)
            data['MACD'] = macd_line
            data['MACD_Signal'] = signal_line
            data['MACD_Diff'] = macd_diff
        if include_ema50:
            data['EMA50'] = calculate_ema(close, 50)
        if include_ema100:
            data['EMA100'] = calculate_ema(close, 100)
        if include_ema200:
            data['EMA200'] = calculate_ema(close, 200)

        # formatting
        formatted = []
        for date, row in data.iterrows():
            if pd.isna(row['Open']) or pd.isna(row['High']) or pd.isna(row['Low']) or pd.isna(row['Close']):
                continue

            candle = {
                'time': {
                    'year': date.year,
                    'month': date.month,
                    'day': date.day
                },
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0,
            }
            
            if include_rsi and not pd.isna(row['RSI']):
                candle['rsi'] = round(row['RSI'], 2)
            if include_macd and not pd.isna(row['MACD']) and not pd.isna(row['MACD_Signal']):
                candle['macd'] = round(row['MACD'], 2)
                candle['macd_signal'] = round(row['MACD_Signal'], 2)
                candle['macd_diff'] = round(row['MACD_Diff'], 2)
            if include_ema50 and not pd.isna(row['EMA50']):
                candle['ema50'] = round(row['EMA50'], 2)
            if include_ema100 and not pd.isna(row['EMA100']):
                candle['ema100'] = round(row['EMA100'], 2)
            if include_ema200 and not pd.isna(row['EMA200']):
                candle['ema200'] = round(row['EMA200'], 2)

            formatted.append(candle)
        

        print(f"[HISTORICAL DATA] Successfully fetched {len(formatted)} rows")

        return JsonResponse({'data': formatted,
                             'latest_price': latest_price, 
                             'value_change': {
                                '7D': value_change_7d,
                                '30D': value_change_30d,
                                '1Y': value_change_1y,
                              }
        })

    except Exception as e:
        print(f"[HISTORICAL DATA] Error: {str(e)}")
        return JsonResponse({'error': f'Failed to fetch data: {str(e)}'}, status=500)



# loading API keys and initializing sentiment analyzer
load_dotenv()
api_key = os.getenv("NEWSAPI")
analyzer = SentimentIntensityAnalyzer()



@csrf_exempt
def get_news(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method allowed'}, status=405)

    try:
        data = json.loads(request.body)
        assets = data.get('assets', [])

        tickers = []
        meta_data = {}

        # extract valid tickers and metadata
        for asset in assets:
            ticker = asset.get('ticker')
            name = asset.get('name', '')
            shares = float(asset.get('amount', 0))
            if not ticker or shares <= 0:
                continue
            tickers.append(ticker.upper())
            meta_data[ticker.upper()] = name.lower()

        if not tickers:
            return JsonResponse({'error': 'No valid tickers provided'}, status=400)

        # building query
        query = ' OR '.join(tickers)
        from_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        url = (
            f'https://newsapi.org/v2/everything?q={query}&from={from_date}'
            f'&sortBy=publishedAt&language=en&apiKey={api_key}'
        )

        response = requests.get(url)
        response.raise_for_status()
        articles = response.json().get('articles', [])

        results = []
        sentiment_scores = []

        # analyzing each article for sentiment
        for article in articles:
            title = article.get('title') or ''
            description = article.get('description') or ''
            full_text = f"{title} {description}".lower()

            matched_assets = []
            for ticker in tickers:
                ticker_lower = ticker.split('-')[0].lower()
                if ticker_lower in full_text:
                    matched_assets.append(ticker)

            if not matched_assets:
                matched_assets = ['General']

            sentiment = analyzer.polarity_scores(full_text)
            article['matched_assets'] = matched_assets
            article['sentiment'] = sentiment

            sentiment_scores.append(sentiment['compound'])
            results.append(article)

        if sentiment_scores:
            average_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        else:
            average_sentiment = 0.0

        return JsonResponse({
            'articles': results,
            'overall_sentiment': average_sentiment
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({'error': f'Failed to fetch data: {str(e)}'}, status=500)


