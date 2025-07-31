import { type ReactNode } from 'react'
import {Routes, Route, Navigate} from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import Portfolio from './components/Portfolio'
import Asset from './components/Asset'
import LoggedInLayout from './components/layouts/LoggedInLayout'

import { CircularProgress, createTheme, CssBaseline, ThemeProvider } from '@mui/material'

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './utils/firebase';
import NewAsset from './components/NewAsset'
import News from './components/News'


interface MyComponentProps {
    children: ReactNode;
}

const PrivateRoute = ({ children }: MyComponentProps) => {
    const [user, loading] = useAuthState(auth);

    if (loading) return <div className="content" style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -100}}><CircularProgress/></div>;
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
            <Route path="/asset" element={<Asset />} />
            <Route path="/add/stock" element={<NewAsset/>}/>
            <Route path="/add/crypto" element={<NewAsset/>}/>
            <Route path='news' element={<News/>}></Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
