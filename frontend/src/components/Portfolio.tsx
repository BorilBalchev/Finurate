import { useEffect, useRef, useState } from 'react'
import { db, auth } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';

import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Autocomplete,
  TextField,
  Button,
  CircularProgress
} from "@mui/material";

import AutorenewIcon from '@mui/icons-material/Autorenew';

import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart, RadarChart } from '@mui/x-charts';

interface Asset {
    ticker: string;
    name: string;
    type: 'crypto' | 'stock';
    sector: string;
    shares: number;
}

interface ValuedStock extends Asset {
    price: number;
    value: number;
    change: number;
}



const Portfolio = () => {
    const [assets, setAssets] = useState<ValuedStock[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [portfolioHistory, setPortfolioHistory] = useState<{ date: string; value: number }[]>([]);
    const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<Record<string, number>>({});
    const [valueChange, setValueChange] = useState<Record<string, number>>({});
    const [refresh, setRefresh] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [yMin, setYMin] = useState(0);
    const [yMax, setYMax] = useState(0);

    const navigate = useNavigate()
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // interval for displaying x-axis labels
    const SIX_MONTHS = 2;
    const createTickLabelInterval = () => {
        let lastShownDate: dayjs.Dayjs | null = null;

        return (value: string, index: number) => {
            const currentDate = dayjs(value);

            if (index === 0) {
            lastShownDate = currentDate;
            return true;
            }

            if (!lastShownDate || currentDate.diff(lastShownDate, 'month') >= SIX_MONTHS) {
            lastShownDate = currentDate;
            return true;
            }
            return false;
        };
    };

    const handleRefresh = async () => {
        setSpinning(true);
        setRefresh(!refresh);
        setTimeout(() => setSpinning(false), 1000);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

            const portfolioRef = collection(db, 'users', user.uid, 'portfolio');

            const fetchAndUpdatePrices = async () => {
                const snapshot = await getDocs(portfolioRef);
                const fetched = snapshot.docs.map((doc) => doc.data() as Asset);

                if (fetched.length === 0){
                    setLoading(false)
                }

                if (fetched.length > 0) {
                    try {
                        const res = await fetch('http://localhost:8000/api/portfolio_prices/', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ assets: fetched }),
                        });

                        const data = await res.json();
                        data.assets.sort((a: ValuedStock, b: ValuedStock) => b.value - a.value);
                        const values = data.historical_portfolio_value.map((entry: { date: string; value: number }) => entry.value);
                        setAssets(data.assets);
                        setTotal(data.total_value);
                        setYMin(Math.min(...values) * 0.95);
                        setYMax(Math.max(...values) * 1.05);
                        setPortfolioHistory(data.historical_portfolio_value);
                        setMetrics(data.metrics);
                        setValueChange(data.value_change)

                    } catch (error) {
                        console.error("Error fetching prices:", error);
                        setError("Failed to load portfolio data.");
                    } finally {
                        setLoading(false);
                    }
                }
            }

            await fetchAndUpdatePrices();

            return () => {
                unsubscribe();
            }

        });

        return () => {
            unsubscribe();
        }

    }, [refresh]);


    useEffect(() => {
        if (selectedTicker && cardRefs.current[selectedTicker]) {
            setTimeout(() => {
            cardRefs.current[selectedTicker]?.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
            }, 0);
        }
    }, [selectedTicker]);

    if (loading) return <div className="content" style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -100}}><CircularProgress/></div>;
    if (error) return <div className="content">{error}</div>;

    return (

        <Box>
            {/* Main title + value */}
            <Typography variant="h4" gutterBottom sx={{textAlign: 'center'}}>Your Portfolio</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Left Spacer */}
                <Box sx={{ flex: 1 }} />

                {/* Centered Price + Percent Change */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ textAlign: 'center', marginRight: 2, marginTop: 1.5 }}
                    >
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        color: valueChange['7D'] > 0 ? 'green' : 'red',
                        marginTop: 1.5,
                        marginRight: 1,
                        marginLeft: 2,
                    }}
                    >
                    {valueChange['7D']}% 7D
                    </Typography>
                    <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: 'center', marginTop: 1.5, marginRight: 1 }}
                    >
                    /
                    </Typography>
                    <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        color: valueChange['30D'] > 0 ? 'green' : 'red',
                        marginTop: 1.5,
                        marginRight: 1,
                    }}
                    >
                    {valueChange['30D']}% 30D
                    </Typography>
                    <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ textAlign: 'center', marginTop: 1.5, marginRight: 1 }}
                    >
                    /
                    </Typography>
                    <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                        textAlign: 'center',
                        color: valueChange['1Y'] > 0 ? 'green' : 'red',
                        marginTop: 1.5,
                    }}
                    >
                    {valueChange['1Y']}% 1Y
                    </Typography>
                </Box>

                {/* Refresh Button */}
                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                    sx={{
                        width: 150,
                        height: 30,
                        marginTop: 1.5,
                        marginLeft: 4,
                        backgroundColor: '#485569',
                        color: 'whitesmoke',
                    }}
                    variant="contained"
                    onClick={handleRefresh}
                    startIcon={
                        <AutorenewIcon
                        sx={{
                            animation: spinning ? 'spin 1s linear infinite' : 'none',
                            '@keyframes spin': {
                            from: { transform: 'rotate(0deg)' },
                            to: { transform: 'rotate(360deg)' },
                            },
                        }}
                        />
                    }
                    >
                    Refresh
                    </Button>
                </Box>
            </Box>

            
            {/* Charts: distribution + portfolio value + evaluation */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                width: '100%',
                backgroundColor: '#2c2a3078',
                borderRadius: '25px',
                gap: 4,
                flexWrap: 'wrap',
                justifyContent: 'center',}}
            >
                {portfolioHistory.length > 0 && (
                    <Box sx={{textAlign: 'center'}}>
                        <Typography variant="h6" gutterBottom>
                            Asset Distribution (%)
                        </Typography>
                        <PieChart
                            series={[{
                            data: assets.map((asset) => ({
                                id: asset.ticker,
                                value: (asset.value / total) * 100,
                                label: `${asset.ticker} (${((asset.value / total) * 100).toFixed(1)}%)`,
                            })),
                            innerRadius: 50,
                            outerRadius: 100,
                            paddingAngle: 3,
                            }]}
                            width={400}
                            height={300}
                            sx={{
                            '& .MuiChartsArc-label': {
                                fill: '#fff',
                                fontSize: 12,
                                fontWeight: 'bold',
                            },
                            }}
                            hideLegend
                        />
                    </Box>
                )}
                {portfolioHistory.length > 0 && (
                    <LineChart
                        sx={{ my: 4, width: '100%', maxWidth: 900,
                            '& line.MuiChartsAxis-line': {
                                stroke: '#479480',
                                strokeWidth: 6,
                                marginLeft: -5,
                            },
                            '& line.MuiChartsAxis-tick': {
                                stroke: '#479480',
                                strokeWidth: 0,
                            },
                            '& .MuiLineElement-root': {
                                strokeWidth: 4,
                                stroke: '#1976d2'
                            },
                        }}
                        
                        height={300}
                        series={[{
                            data: portfolioHistory.map(entry => entry.value),
                            label: 'Portfolio Value',
                            showMark: false,
                            color: 'rgba(25, 118, 210, 0.3)',
                            curve: 'catmullRom',
                            
                            area: true,
                        }]}
                        xAxis={[{
                        scaleType: 'point',
                        data: portfolioHistory.map(entry => entry.date),
                        tickMinStep: 30,
                        valueFormatter: (dateStr, context) => {
                            if (context.location === 'tick') {
                            const d = new Date(dateStr);
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const year = String(d.getFullYear()).slice(-2);
                            return `${m}/${year}`;
                            }
                            return dateStr;
                        },
                        tickLabelStyle: {
                            fontSize: 12,
                            fill: '#fff',
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 'bold',
                        },
                        tickLabelInterval: createTickLabelInterval(),
                        }]}
                        yAxis={[{
                        min: yMin,
                        max: yMax,
                        valueFormatter: (value: number) => {
                            if (value === 0) return '';
                            if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(0)}T`;
                            if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
                            if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
                            if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
                            return `$${value}`;
                        },
                        tickLabelStyle: {
                            fontSize: 12,
                            fill: '#fff',
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 'bold',
                        },
                        }]}
                        hideLegend={true}
                    />
                )}
                {portfolioHistory.length > 0 && (
                    <Box sx={{textAlign: 'center'}}>
                        <Typography variant="h6" gutterBottom>
                            Portfolio Evaluation
                        </Typography>
                        <RadarChart
                            height={300}
                            width={400}
                            series={[{ data: [metrics['growth_percent'], metrics['diversification_score'], 100 - metrics['annualized_risk_percent'], metrics['liquidity_score'], 100 - metrics['daily_volatility_percent']] }]}
                            radar={{
                                max: 100,
                                metrics: ['Growth', 'Diversification', 'Risk Aversion', 'Liquidity', 'Stability'],
                            }}
                        />
                    </Box>
                )}
            </Box>
            
            {assets.length === 0 ? (
                <Typography sx={{ mt: 4 }}>No assets in your portfolio.</Typography>
            ) : (
                <Box>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 3,
                        py: 2,
                        width: '20em',
                        marginLeft: 0,
                        marginTop: 5,
                        backgroundColor: 'transparent',
                    }}>
                    <Autocomplete
                        options={assets.map((asset) => `${asset.ticker} - ${asset.name}`)}
                        sx={{ width: 250 }}
                        renderInput={(params) => (
                            <TextField {...params} label="Search for an asset" variant="outlined" />
                        )}
                        onChange={(_, value) => {
                            const matched = assets.find(
                            (asset) => `${asset.ticker} - ${asset.name}` === value
                            );
                            setSelectedTicker(matched ? matched.ticker : null);
                        }}
                        onInputChange={(_, inputValue) => {
                            const matched = assets.find(
                            (asset) => `${asset.ticker} - ${asset.name}` === inputValue
                            );
                            setSelectedTicker(matched ? matched.ticker : null);
                        }}
                    />
                    </Box>
                    {/* Asset containers */}
                    <Box sx={{
                            width: '100%',
                            maxWidth: '97vw',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            whiteSpace: 'nowrap',
                            padding: 2,
                            marginTop: 2,
                        }}
                    >
                        {assets.map((asset) => (
                            <Box
                                key={asset.ticker}
                                sx={{
                                    display: 'inline-block',
                                    width: 330,
                                    marginRight: 2,
                                    verticalAlign: 'top',
                                }}
                                ref={(el: HTMLDivElement | null) => {
                                    cardRefs.current[asset.ticker] = el;
                                    return;
                                }}
                                tabIndex={-1}
                            >
                                <Card
                                    sx={{
                                        height: '100%',
                                        border: selectedTicker === asset.ticker ? '2px solid #1976d2' : undefined,
                                        boxShadow: selectedTicker === asset.ticker ? '0 0 10px #1976d2' : undefined,
                                        transition: 'box-shadow 0.3s, border 0.3s',
                                    }}
                                >
                                    <CardActionArea onClick={() => navigate(`/asset?ticker=${asset.ticker}`)} >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="h5" component="div" mb={0.5}>
                                                    {asset.ticker}
                                                </Typography>
                                                <Typography sx={{ color: asset.change > 0 ? 'green' : 'red'}}>{asset.change}% 7D</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    {asset.name}
                                                </Typography>
                                                <Typography variant="subtitle2">{asset.shares.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography>
                                                Price: ${typeof asset.price === 'number' ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                                                </Typography>
                                                <Typography>
                                                Value: ${typeof asset.value === 'number' ? asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

        </Box>


    )
    
}

export default Portfolio;