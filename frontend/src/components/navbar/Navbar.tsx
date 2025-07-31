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

import FinchIcon from './../../assets/NavbarLogo.png'
import { Link } from 'react-router-dom';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import NewspaperIcon from '@mui/icons-material/Newspaper';

import { Avatar, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { auth } from '../../utils/firebase';

const drawerWidth = 240;

const background = '#181A1F';
const fontColor = '#eaecef';
const border = '#3a3f44';


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create(['margin', 'width'], {
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
    easing: theme.transitions.easing.easeIn,
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

  const [manageOpen, setManageOpen] = React.useState(false);

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
            Curate Your Financial Edge
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
        <DrawerHeader sx={{borderBottom: '10px solid ' + border, marginTop: '10px'}}>
          <Typography variant='h6' noWrap component="div" sx={{mr: 14, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: fontColor}}>
            Menu
          </Typography>
          <IconButton onClick={handleDrawerClose} sx={{color: fontColor}}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
            <ListItemButton component={Link} to="/portfolio" sx={{marginTop: "-10px"}} >
                <ListItemIcon sx={{color: fontColor}}>
                <AccountBalanceWalletIcon/>
                </ListItemIcon>
                <ListItemText primary="Portfolio" />
            </ListItemButton>
            
            <ListItemButton onClick={handleManageClick} sx={{borderTop: '10px solid ' + border}}>
                <ListItemIcon sx={{color: fontColor}}>
                <AddShoppingCartIcon />
                </ListItemIcon>
                <ListItemText primary="Add Assets" />
                {manageOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={manageOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/add/stock">
                    <ListItemText primary="Stocks" sx={{ml:5}} />
                </ListItemButton>
                <ListItemButton sx={{ pl: 4, color: fontColor, '&:hover': { backgroundColor: '#333' }}} component={Link} to="/add/crypto">
                    <ListItemText primary="Crypto" sx={{ml:5}} />
                </ListItemButton>
                </List>
            </Collapse>

            <ListItemButton component={Link} to="/news" sx={{borderTop: '10px solid ' + border}} >
                <ListItemIcon sx={{color: fontColor}}>
                <NewspaperIcon/>
                </ListItemIcon>
                <ListItemText primary="News" />
            </ListItemButton>
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {content}
      </Main>
    </Box>
  );
}
