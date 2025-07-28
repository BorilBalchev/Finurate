import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Typography, CircularProgress, Box, Switch, FormControlLabel, FormGroup, TextField, Button } from '@mui/material'

import CandlestickChart from './chartUtils/CandlestickChart'
import type { Time } from 'lightweight-charts';


import { db, auth } from '../firebase';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { useNavigate } from 'react-router-dom';


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
  const [searchParams] = useSearchParams()
  const ticker = searchParams.get('ticker') ?? ''
  const [data, setData] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(true)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const [showEMA50, setEMA50] = useState(false)
  const [showEMA100, setEMA100] = useState(false)
  const [showEMA200, setEMA200] = useState(false)


  const [latest_price, setLatestPrice] = useState(0);
  const [value, setValue] = useState(0)
  const [asset, setAsset] = useState<Asset | null>(null);
  const [amount, setAmount] = useState(0)
  const [label, setLabel] = useState('')

  const [editedAmount, setEditedAmount] = useState(0);

  const navigate = useNavigate()


  const hasChanged = editedAmount !== amount;

  const handleUpdate = async () => {

    console.log(editedAmount)
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    console.log(editedAmount)

    try {

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

      console.log("Params being sent:", params.toString());

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

        setLatestPrice(latest_price);

        const calculatedValue = Number((latest_price * chosen.amount).toFixed(2));
        setValue(calculatedValue);

        setData(formattedData);
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        setData([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    }
  });

  return () => unsubscribe();
}, [ticker, showRSI, showMACD, showEMA50, showEMA100, showEMA200, amount]);


  

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {label}
      </Typography>
      <Button variant="contained" color="warning" onClick={handleDelete}>
            Delete
          </Button>
      <Box sx={{ mt: 3 }}>
      <Typography variant="h5">
        Current price: ${latest_price.toFixed(2)}
      </Typography>

      <Box display="flex" alignItems="center" mt={2} gap={2}>
        <TextField
          type="number"
          label="You own"
          variant="outlined"
          value={editedAmount}
          onChange={(e) => setEditedAmount(parseFloat(e.target.value))}
        />
        {hasChanged && (
          <Button variant="contained" color="primary" onClick={handleUpdate}>
            Confirm Change
          </Button>
        )}
      </Box>
    </Box>
      <Typography variant='h5'>
        Your holding value: ${value.toFixed(2)} 
      </Typography>

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