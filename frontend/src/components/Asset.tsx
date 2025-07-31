import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, CircularProgress, Box, Switch, FormControlLabel, FormGroup, TextField, Button } from '@mui/material'

import CandlestickChart from './chartUtils/CandlestickChart'
import type { Time } from 'lightweight-charts';


import { db, auth } from '../utils/firebase';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { useNavigate } from 'react-router-dom';

import AutorenewIcon from '@mui/icons-material/Autorenew';


interface CandleData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume: number
  ema50?: number;
  ema100?: number;
  ema200?: number;
}

interface Asset {
    ticker: string;
    name: string;
    type: 'crypto' | 'stock';
    sector: string;
    amount: number;
}

const Asset = () => {
  // read ticker from URL
  const [searchParams] = useSearchParams()
  const ticker = searchParams.get('ticker') ?? ''
  
  // component state
  const [data, setData] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLoading, setFirstLoading] = useState(true);

  // toggle visibility for indicators
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const [showEMA50, setEMA50] = useState(false)
  const [showEMA100, setEMA100] = useState(false)
  const [showEMA200, setEMA200] = useState(false)

  // Price & portfolio state
  const [latest_price, setLatestPrice] = useState(0);
  const [value, setValue] = useState(0)
  const [asset, setAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState<string | number>("");
  const [label, setLabel] = useState('')
  const [valueChange, setValueChange] = useState<Record<string, number>>({});
  const [editedAmount, setEditedAmount] = useState<string | number>("");
  const [message, setMessage] = useState<string | null>(null);

  // UI control flags
  const [refresh, setRefresh] = useState(false);
  const [spinning, setSpinning] = useState(false);
  

  const navigate = useNavigate()

  const hasChanged = editedAmount !== amount;

  const handleRefresh = async () => {
    setSpinning(true);
    setMessage(null);
    setRefresh(!refresh);
    setTimeout(() => setSpinning(false), 1000);
  }

  const handleUpdate = async () => {

    if (editedAmount === "" || parseFloat(editedAmount.toString()) < 0.0001) {
        setMessage('You cannot set the quantity to less than 0.0001. If you wish to remove the asset from your portfolio, please use the "Remove From Portfolio" button')
        return
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;


    try {
      // type crypto has a ticker in the form CRYPTO-USD
      if (asset?.type == 'stock') {
        const assetRef = doc(db, 'users', currentUser.uid, 'portfolio', ticker);
        await updateDoc(assetRef, { amount: editedAmount });
        setAmount(editedAmount);
      }
      else {
        const assetRef = doc(db, 'users', currentUser.uid, 'portfolio', ticker.split('-')[0]);
        await updateDoc(assetRef, { amount: editedAmount });
        setAmount(editedAmount);
      }
      setMessage(null);

    } catch (error) {
      console.error("Failed to update amount in DB:", error);
    }
  };

  const handleDelete = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      if (asset?.type == 'stock') {
        const assetRef = doc(db, 'users', currentUser.uid, 'portfolio', ticker);
        await deleteDoc(assetRef);
      }
      else {
        const assetRef = doc(db, 'users', currentUser.uid, 'portfolio', ticker.split('-')[0]);
        await deleteDoc(assetRef);
      }
      navigate('/portfolio');
    } catch (error) {
      console.error("Failed to update amount in DB:", error);
    }

  }

useEffect(() => {
  if (!ticker) return;

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
      const snapshot = await getDocs(portfolioRef);
      const fetched = snapshot.docs.map((doc) => doc.data() as Asset);

      const chosen = fetched.find((item) => item.ticker === ticker.toUpperCase());

      if (!chosen) {
        console.warn("Asset not found for ticker:", ticker);
        return;
      }

      setAsset(chosen);
      setAmount(chosen.amount);
      setEditedAmount(chosen.amount);
      setLabel(`${chosen.ticker} - ${chosen.name}`);

      setLoading(true);

      const params = new URLSearchParams({
        ticker: ticker,
        rsi: String(showRSI),
        macd: String(showMACD),
        ema50: String(showEMA50),
        ema100: String(showEMA100),
        ema200: String(showEMA200),
      });

      const res = await fetch(`http://localhost:8000/api/historical_data/?${params.toString()}`);
      const text = await res.text();

      try {
        const json = JSON.parse(text);

        const formattedData = json.data.map((d: any) => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: typeof d.volume === 'number' ? d.volume : 0,
          ema50: d.ema50,
          ema100: d.ema100,
          ema200: d.ema200,
          rsi: d.rsi,
          macd: d.macd,
          macd_signal: d.macd_signal,
          macd_diff: d.macd_diff,
        }));

        const latest_price = json.latest_price;

        setValueChange(json.value_change);

        setLatestPrice(latest_price);

        const calculatedValue = Number((latest_price * chosen.amount).toFixed(2));
        setValue(calculatedValue);

        setData(formattedData);
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        setData([]);
      }

      setLoading(false);
      setFirstLoading(false);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    }
  });

  return () => unsubscribe();
}, [ticker, showRSI, showMACD, showEMA50, showEMA100, showEMA200, amount, refresh]);


if (firstLoading) return <div className="content" style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -100}}><CircularProgress/></div>;
  

  return (
    <Box sx={{ p: 3 }}>
        {message && (
            <Typography sx={{ mb: 2 }} color={'red'}>
            {message}
            </Typography>
        )}
      <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
        <Box sx={{display: 'flex'}}>
            <Typography variant="h4">
                {label}
            </Typography>
            <Button
                sx={{ width: 150, height: 30, marginTop: 1, marginLeft: 5 }}
                variant="contained"
                color="info"
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
        <Button sx={{width: 230, height: 30, marginTop: 1, marginLeft: 5, color: 'black'}} variant="contained" color="error" onClick={handleDelete}>
            Remove From Portfolio
        </Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Box sx={{display: 'flex'}}>
            <Typography variant="h5">
                Current price: ${latest_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center', color: valueChange['7D'] > 0 ? 'green' : 'red', marginRight: 1, marginLeft: 3}}>{valueChange['7D']}% 7D</Typography>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center', marginRight: 1}}>/</Typography>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center', color: valueChange['30D'] > 0 ? 'green' : 'red', marginRight: 1}}>{valueChange['30D']}% 30D</Typography>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center', marginRight: 1}}>/</Typography>
            <Typography variant="h6" gutterBottom sx={{textAlign: 'center', color: valueChange['30D'] > 0 ? 'green' : 'red'}}>{valueChange['1Y']}% 1Y</Typography>
        </Box>
      <Box display="flex" alignItems="center" mt={2} mb={2} gap={2}>
        <TextField
          type="number"
          label="You own"
          variant="outlined"
          value={editedAmount}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
            setEditedAmount("");
            return;
            }
            const value = parseFloat(raw);
            if (value === 0) {
                const normalized = raw.replace(/^0+(\d)/, "$1");
                setEditedAmount(normalized);
                return;
            }
            if (!isNaN(value) && value > 0) {
            setEditedAmount(value);
            }
            else {
                setEditedAmount("")
            }
          }}
          onKeyDown={(e) => {
            const invalidChars = ["e", "E", "+", "-"];
            if (invalidChars.includes(e.key)) {
            e.preventDefault();
            }
          }}
          sx={{width: 150}}
        />
        {hasChanged && (
          <Button variant="contained" color="primary" onClick={handleUpdate}>
            Confirm Change
          </Button>
        )}
        <Typography variant='h5'>
            Value: ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
        </Typography>
      </Box>
    </Box>

      <FormGroup row>
        <FormControlLabel
            control={
            <Switch
                checked={showRSI}
                onChange={(e) => setShowRSI(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#9b59b6',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#9b59b6',
                    },
                }}
            />
            }
            label="Show RSI"
        />
        <FormControlLabel
            control={
            <Switch
                checked={showMACD}
                onChange={(e) => setShowMACD(e.target.checked)}
            />
            }
            label="Show MACD"
        />
        <FormControlLabel
            control={
            <Switch
                checked={showEMA50}
                onChange={(e) => setEMA50(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#f39c12',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#f39c12',
                    },
                }}
            />
            }
            label="Show EMA50"
        />
        <FormControlLabel
            control={
            <Switch
                checked={showEMA100}
                onChange={(e) => setEMA100(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#27ae60',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#27ae60',
                    },
                }}
            />
            }
            label="Show EMA100"
        />
        <FormControlLabel
            control={
            <Switch
                checked={showEMA200}
                onChange={(e) => setEMA200(e.target.checked)}
                sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2980b9',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#2980b9',
                    },
                }}
            />
            }
            label="Show EMA200"
        />
    </FormGroup>


      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ mx: 'auto', mt: 2, width: '100%' }}>
          <CandlestickChart data={data} showRSI={showRSI} showMACD={showMACD} />
        </Box>
      )}
    </Box>
  )
}

export default Asset