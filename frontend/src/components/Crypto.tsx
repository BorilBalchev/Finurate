import React, { useState, useRef, useEffect } from 'react'
import {TextField, Autocomplete, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Button, Typography} from '@mui/material';
import { topCryptos } from './crypto_data';

import { addCryptoToPortfolio, type Asset } from './Add_asset';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import type { User } from 'firebase/auth';


const Stocks = () => {

    const [selected, setSelected] = useState<string | null>(null);
    const [shares, setShares] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    const raw = topCryptos.find(stock => stock.ticker === selected);
    const selectedCrypto: Asset | null = raw ? { ...raw, type: "crypto" } : null;


    const handleSelect = (value: any) => {
        const ticker = value?.ticker || null;
        setSelected(ticker);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedCrypto || !shares) {
        setMessage("Please log in, select a stock, and enter shares.");
        return;
        }

        try {
        await addCryptoToPortfolio(user, selectedCrypto, Number(shares));
        setMessage("Cryptocurrency successfully added to portfolio.");
        setShares('');
        setSelected(null);
        } catch (error) {
        console.error("Error saving:", error);
        setMessage("Failed to add the requested cryptocurrency.");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
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
        <Autocomplete
            options={topCryptos}
            getOptionLabel={(option) => `${option.name} (${option.ticker})`}
            renderInput={(params) => (
                <TextField {...params} label="Search Stocks" variant="outlined" />
            )}
            onChange={(_, value) => handleSelect(value)}
            sx={{ marginBottom: 2 }}
            fullWidth
            value={selectedCrypto ? {
                ticker: selectedCrypto.ticker,
                name: selectedCrypto.name,
                sector: selectedCrypto.sector
            } : null}
            isOptionEqualToValue={(option, value) => option.ticker === value?.ticker}
        />

        <TextField
          label="Shares"
          type="number"
          fullWidth
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Add to Portfolio
        </Button>
        </form>

        {message && (
            <Typography sx={{ mt: 2 }} color={message.startsWith('✅') ? 'green' : 'red'}>
            {message}
            </Typography>
        )}

        <Table stickyHeader>
            <TableHead>
            <TableRow>
                <TableCell>Ticker</TableCell>
                <TableCell>Company Name</TableCell>
                <TableCell>Sector</TableCell>
            </TableRow>
            </TableHead>
        </Table>

        {/* Scrollable body */}
        <TableContainer sx={{ maxHeight: 350, overflowY: 'auto' }}>
            <Table stickyHeader>
            <TableBody>
                {topCryptos.map((stock) => (
                <TableRow
                    key={stock.ticker}
                    ref={(el: HTMLTableRowElement | null) => {rowRefs.current[stock.ticker] = el}}
                    selected={selected === stock.ticker}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSelected(stock.ticker)}
                >
                    <TableCell>{stock.ticker}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell>{stock.sector}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        </Paper>
    );
}

export default Stocks
