import { type ReactNode } from 'react'
import {Routes, Route, Navigate} from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import Portfolio from './components/Portfolio'
import Asset from './components/Asset'
import LoggedInLayout from './components/layouts/LoggedInLayout'

import Stocks from './components/Stocks'
import Crypto from './components/Crypto'
import Commodities from './components/Commodities'

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';


interface MyComponentProps {
    children: ReactNode;
}

const PrivateRoute = ({ children }: MyComponentProps) => {
    const [user, loading] = useAuthState(auth);

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/"/>;

    return children
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bfa5',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

<ThemeProvider theme={darkTheme}>
  <CssBaseline />
  <App />
</ThemeProvider>


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>}/>

        {/* Routes with Navbar */}
        <Route element={<PrivateRoute><LoggedInLayout/></PrivateRoute>}>
            <Route path="/portfolio" element={<Portfolio/>}/>
            <Route path="/portfolio/asset/:id" element={<Asset/>}/>
            <Route path="/portfolio/news" element={<Asset/>}/>
            <Route path="/add/stocks" element={<Stocks/>}/>
            <Route path="/add/crypto" element={<Crypto/>}/>
            <Route path="/add/commodities" element={<Commodities/>}/>
            
            <Route path="/asset" element={<Asset />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
