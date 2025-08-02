import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import HomeLogo from "./../assets/HomeLogo.png";
import AnalysisIcon from "./../assets/analysis.png";
import PortfolioIcon from "./../assets/portfolio.png";
import NewsIcon from "./../assets/news.png";

import { auth, googleProvider } from '../utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import { createUserProfile } from '../utils/createUserProfile';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';
import { useEffect } from 'react';

const cards = [
    {
        title: 'Portfolio Overview & Analysis',
        description: 'Track asset performance, visualize your holdings, and identify portfolio trends with tailored insights.',
        image: PortfolioIcon,
    },
    {
        title: 'Advanced Technical Analysis',
        description: 'Access real-time indicators and trading strategies for all your stocks and cryptocurrencies',
        image: AnalysisIcon
    },
    {
        title: 'Personalised Financial News',
        description: 'Stay updated with curated stories relevant to your portfolio.',
        image: NewsIcon
    }
]

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const handleGoogleLogin = async () => {
        try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        await createUserProfile(user);
        } catch (error) {
        console.error("Google Sign-In error:", error);
        }
    };

    useEffect(() => {
        if (user) {
            navigate('/portfolio')
        }
    })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#181A1F',
        color: '#eaecef',
        padding: 4,
      }}
    >

      <Box
        sx={{
            backgroundColor: '#181A1F',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#eaecef',
        }}
        >
        <Box
            sx={{
            display: 'flex',
            alignItems: 'center',
            mt:10,
            ml: -5
            }}
        >
            <Box
            component="img"
            src={HomeLogo}
            alt="Finch Logo"
            sx={{
                height: 150,
                width: 150,
                mr: -7.8,
                mt: -8.5
            }}
            />
            <Typography
            variant="h2"
            fontWeight={500}
            sx={{ fontFamily: 'Montserrat, sans-serif' }}
            >
            inurate
            </Typography>

        </Box>
      </Box>
      
      <Box sx={{backgroundColor: '#181A1F',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#eaecef',}}>
        <Typography
            variant='h6'
            fontWeight={800}
            sx={{ fontFamily: 'Montserrat, sans-serif' }}
            >
            Curate Your Financial Edge
        </Typography>
      </Box>
      
    
      <Box sx={{backgroundColor: '#181A1F',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#eaecef',
            mt: 5}}>
        <Typography
            variant='h6'
            fontWeight={800}
            sx={{ fontFamily: 'Montserrat, sans-serif' }}
            >
            Finurate cuts through the clutter to show you only what moves your financial future.
        </Typography>
      </Box>
      


      <Box
        sx={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
          justifyContent: 'center',
          mt: 5
        }}
      >
        {cards.map((card, index) => (
          <Card
            key={index}
            sx={{
              width: 400,
              bgcolor: '#1a1a1a',
              border: '1px solid #2e2e2e',
              borderRadius: 3,
              boxShadow: 3,
              color: '#fff',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: '#00bfa5',
              },
            }}
          >
            <CardContent>
                <Box
                    component="img"
                    src={card.image}
                    alt={card.title}
                    sx={{
                        width: '100%',
                        height: 140,
                        objectFit: 'cover',
                        borderRadius: '12px',
                        mb: 2,
                    }}
                />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="body2" color="#ccc">
                {card.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      

      <Box sx={{ backgroundColor: '#181A1F',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#eaecef',
            mt: 5}}>
        <Button
            variant="outlined"
            onClick={handleGoogleLogin}
            sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#fff',
            color: 'black',
            borderColor: '#ddd',
            textTransform: 'none',
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            '&:hover': {
                backgroundColor: '#f7f7f7',
            },
            }}
        >
            <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            style={{ width: 20, height: 20 }}
            />
            Sign in with Google
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
