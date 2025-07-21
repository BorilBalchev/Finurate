import { useState, type ReactNode } from 'react'
import {Routes, Route, Outlet, Navigate} from 'react-router-dom'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import Portfolio from './components/Portfolio'
import Manage from './components/Manage'
import Asset from './components/Asset'
import Delete from './components/Delete'
import Create from './components/Create'
import Edit from './components/Edit'
import LoggedInLayout from './components/layouts/LoggedInLayout'

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
      main: '#00bfa5', // teal for accent
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
        {/* <Route path="/login" element={<Login/>}/>/ */}
        {/* <Route path="/signup" element={<Signup/>}/> */}

        {/* Routes with Navbar */}
        <Route element={<PrivateRoute><LoggedInLayout/></PrivateRoute>}>
            <Route path="/portfolio" element={<Portfolio/>}/>
            <Route path="/portfolio/asset/:id" element={<Asset/>}/>
            <Route path="/manage" element={<Manage/>}/>
            <Route path="/manage/create" element={<Create/>}/>
            <Route path="/manage/edit/:id" element={<Edit/>}/>
            <Route path="/manage/delete/:id" element={<Delete/>}/>
        </Route>
      </Routes>
    </>
  )
}

export default App
