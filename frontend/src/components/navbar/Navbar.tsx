import * as React from 'react';
import { styled, useTheme} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import FinchIcon from './../../assets/Finch2.png'
import { Link } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';

import { Avatar, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { auth } from '../../firebase';

const drawerWidth = 240;

const background = '#181A1F';
const fontColor = '#eaecef';
const border = '#3a3f44';


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create('margin', {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
  backgroundColor: background,
  minHeight: '100vh',
  color: '#eaecef',
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

interface NavbarProps {
    content: React.ReactNode;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function Navbar({content}: NavbarProps) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const [portfolioOpen, setPortfolioOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);

  const handlePortfolioClick = () => {
    setPortfolioOpen(!portfolioOpen);
  };

  const handleManageClick = () => {
    setManageOpen(!manageOpen);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ display: 'flex'}}>
      <CssBaseline />
      <AppBar position="fixed" open={open} sx={{ backgroundColor: background, color: fontColor, borderBottom: '10px solid ' + border}}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                mr: 2,
              },
              open && { display: 'none' },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Link to="/portfolio">
            <Box
                component="img"
                src={FinchIcon}
                alt="Finch Logo"
                sx={{
                    height: 50,
                    width: 50,
                    ml: -1,
                    mr: 1,
                    cursor: 'pointer'
                }}
            />
          </Link>
          <Typography variant="h5" noWrap component="div" sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: fontColor }}>
            Your Investments. Our Intelligence. Perfectly Tailored.
          </Typography>
          <Box sx={{ marginLeft: 'auto' }}>
            {auth.currentUser && (
            <>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar src={auth.currentUser.photoURL || undefined} alt={auth.currentUser.displayName || 'User'} />
                </IconButton>
                <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                >
                <MenuItem disabled>{auth.currentUser.email}</MenuItem>
                <MenuItem onClick={() => {
                    auth.signOut();
                    setAnchorEl(null);
                }}>
                    Logout
                </MenuItem>
                </Menu>
            </>
            )}
        </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: background,
            color: fontColor,
            borderRight: '10px solid ' + border,
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant='h6' noWrap component="div" sx={{mr: 14, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: fontColor}}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose} sx={{color: fontColor}}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
            {/* Portfolio */}
            <ListItemButton onClick={handlePortfolioClick} sx={{borderBottom: '10px solid ' + border}}>
                <ListItemIcon sx={{color: fontColor}}>
                {/* <InboxIcon /> */}
                <AccountBalanceWalletIcon/>
                </ListItemIcon>
                <ListItemText primary="Portfolio" />
                {portfolioOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={portfolioOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/portfolio/overview">
                    <ListItemText primary="Overview" sx={{ml:5}} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/portfolio/assets">
                    <ListItemText primary="Assets" sx={{ml:5}} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/portfolio/news">
                    <ListItemText primary="News" sx={{ml:5}} />
                </ListItemButton>
                </List>
            </Collapse>

            {/* Manage */}
            <ListItemButton onClick={handleManageClick}>
                <ListItemIcon sx={{color: fontColor}}>
                <AddShoppingCartIcon />
                </ListItemIcon>
                <ListItemText primary="Manage" />
                {manageOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={manageOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/manage/stocks">
                    <ListItemText primary="Stocks" sx={{ml:5}} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/manage/crypto">
                    <ListItemText primary="Crypto" sx={{ml:5}} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/manage/commodities">
                    <ListItemText primary="Commodities" sx={{ml:5}} />
                </ListItemButton>
                </List>
            </Collapse>
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {content}
      </Main>
    </Box>
  );
}
