import React, { useState, useRef, useEffect } from 'react'
import {TextField, Autocomplete, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Button, Typography} from '@mui/material';
import { topCryptos } from '../data/crypto_data';
import { topStocks } from '../data/stocks_data';

import { addCryptoToPortfolio, addStockToPortfolio, type Asset } from './Add_asset';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../utils/firebase';
import type { User } from 'firebase/auth';

import { collection, getDocs } from 'firebase/firestore';

import { useLocation } from 'react-router-dom';

interface General_Asset {
    ticker: string,
    name: string,
    sector: string
}

const NewAsset = () => {

    const location = useLocation();
    const path = location.pathname; // e.g. "/add/crypto"
    const type = path.split('/').pop();

    const [selected, setSelected] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<string | number>("");
    const [message, setMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const [topAssets, setTopAssets] = useState<General_Asset[]>([])
    const [assetTypeName, setAssetTypeName] = useState("");

    useEffect(() => {
        if (type === "stock") {
            setTopAssets(topStocks);
            setAssetTypeName("stock")
        } else if (type === "crypto") {
            setTopAssets(topCryptos);
            setAssetTypeName("cryptocurrency")
        }
    }, [type]);

    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    const raw = topAssets.find(asset => asset.ticker === selected);
    const selectedAsset: Asset | null = raw && (type === 'crypto' || type === 'stock')
        ? { ...raw, type }
        : null;

    const [assets, setAssets] = useState<Asset[]>([]);


    const handleSelect = (value: any) => {
        const ticker = value?.ticker || null;
        setSelected(ticker);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // validate user, asset and quantity
        if (!user || !selectedAsset || !quantity) {
        setMessage(`Please log in, select a ${assetTypeName}, and enter quantity.`);
        return;
        }

        else if (parseFloat(quantity.toString()) <= 0.0001){
            setMessage('You cannot add less than 0.0001 of an asset');
            return;
        } 

        try {
        if (type === 'stock'){
            await addStockToPortfolio(user, selectedAsset, Number(quantity));
        }
        else if (type === 'crypto'){
            addCryptoToPortfolio(user, selectedAsset, Number(quantity));
        }
        setMessage(`Successfully added ${selected} to your portfolio.`);
        setQuantity('');
        setSelected(null);
        const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
        const snapshot = await getDocs(portfolioRef);
        const existingAssets = snapshot.docs.map(doc => doc.data() as Asset);
        setAssets(existingAssets);
        } catch (error) {
        console.error("Error saving:", error);
        setMessage(`Failed to add the requested ${assetTypeName}.`);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
            const portfolioRef = collection(db, 'users', currentUser.uid, 'portfolio');
            const snapshot = await getDocs(portfolioRef);
            const existingAssets = snapshot.docs.map(doc => doc.data() as Asset);
            setAssets(existingAssets);
            }
        });
        return () => unsubscribe();

    }, []);

    useEffect(() => {
        if (selected && rowRefs.current[selected]) {
        rowRefs.current[selected]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selected]);

    return (
        <Paper sx={{ padding: 2, maxWidth: '80%', ml: '10%' }}>
        <form onSubmit={handleSubmit}>
        {message && (
            <Typography sx={{ mb: 2, textAlign: 'center' }} color={message.startsWith('S') ? 'green' : 'red'}>
            {message}
            </Typography>
        )}

        <Autocomplete
            options={topAssets.filter(
                asset => !assets.some(a => a.ticker === (type === 'crypto' ? `${asset.ticker}-USD` : asset.ticker))
            )}
            getOptionLabel={(option) => `${option.name} (${option.ticker})`}
            renderInput={(params) => (
                <TextField {...params} label={`Search for a ${assetTypeName}`} variant="outlined" />
            )}
            onChange={(_, value) => handleSelect(value)}
            sx={{ marginBottom: 2 }}
            fullWidth
            value={selectedAsset ? {
                ticker: selectedAsset.ticker,
                name: selectedAsset.name,
                sector: selectedAsset.sector
            } : null}
            isOptionEqualToValue={(option, value) => option.ticker === value?.ticker}
        />
        <TextField
            label="Quantity"
            type="number"
            fullWidth
            value={quantity}
            required
            sx={{ mb: 2 }}
            onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" ) {
                setQuantity("");
                return;
                }
                const value = parseFloat(raw);
                if (value === 0) {
                    const normalized = raw.replace(/^0+(?=\d)/, "");
                    setQuantity(normalized);
                    return;
                }
                if (!isNaN(value) && value > 0) {
                setQuantity(value);
                }
                else {
                    setQuantity("")
                }
            }}
            onKeyDown={(e) => {
            const invalidChars = ["e", "E", "+", "-"];
            if (invalidChars.includes(e.key)) {
            e.preventDefault();
            }
          }}
        />

        <Button type="submit" variant="contained" color="primary" fullWidth sx={{marginBottom: 2}}>
          Add to Portfolio
        </Button>
        </form>

        
        <Table stickyHeader>
            <TableHead>
            <TableRow>
                <TableCell>Ticker</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Sector</TableCell>
            </TableRow>
            </TableHead>
        </Table>

        {/* Scrollable body */}
        <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
            <Table stickyHeader>
            <TableBody>
                {topAssets.map((asset) => (
                <TableRow
                    key={asset.ticker}
                    ref={(el: HTMLTableRowElement | null) => { rowRefs.current[asset.ticker] = el }}
                    selected={selected === asset.ticker}
                    sx={{
                        cursor: 'pointer',
                        opacity: assets.some(a => a.ticker === (type === 'crypto' ? `${asset.ticker}-USD` : asset.ticker)) ? 0.5 : 1
                    }}
                    onClick={() => {
                        if (!assets.some(a => a.ticker === asset.ticker)) {
                        setSelected(asset.ticker);
                        }
                    }}
                >
                    <TableCell>{asset.ticker}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.sector}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        <Typography sx={{ mt: 5, textAlign: 'center' }}>
            A {assetTypeName} shown in grey is already part of your portfolio.
        </Typography>
        <Typography sx={{textAlign: 'center'}}>
            To adjust the quantity or remove a {assetTypeName}, please go to your portfolio and select the corresponding {assetTypeName}.
        </Typography>
        </Paper>
    );
}

export default NewAsset