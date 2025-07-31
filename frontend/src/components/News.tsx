import { useEffect, useRef, useState } from 'react'
import { db, auth } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Box, CardMedia, Typography } from '@mui/material';


import {
  Card,
  CardContent,
  CardActionArea,
  CircularProgress
} from "@mui/material";

interface Asset {
    ticker: string;
    name: string;
    type: 'crypto' | 'stock';
    sector: string;
    shares: number;
}

interface Article {
  author: string | null;
  content: string | null;
  description: string | null;
  matched_assets: string[];
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  title: string;
  url: string;
  urlToImage: string | null;
  sentiment?: {
    compound: number;
    pos: number;
    neu: number;
    neg: number;
  };
}

// Truncates long titles
const truncate = (str: string, maxLength: number) =>
  str.length > maxLength ? str.slice(0, maxLength).trim() + '...' : str;

const News = () => {

    const [loading, setLoading] = useState(true);
    const [articles, setArticles] = useState<Article[]>([]);
    const [overallSentiment, setOverallSentiment] = useState(0);

    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (!user) return;
    
                const portfolioRef = collection(db, 'users', user.uid, 'portfolio');
                
                // fetching news based on assets in portfolio
                const fetchNews = async () => {
                    const snapshot = await getDocs(portfolioRef);
                    const fetched = snapshot.docs.map((doc) => doc.data() as Asset);
    
                    if (fetched.length === 0){
                        setLoading(false)
                    }
    
                    if (fetched.length > 0) {
                        try {
                            const res = await fetch('http://localhost:8000/api/get_news/', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ assets: fetched }),
                            });
    
                            const data = await res.json();
                            setArticles(data.articles);
                            setOverallSentiment(data.overall_sentiment)
    
                        } catch (error) {
                            console.error("Error fetching news:", error);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
    
                await fetchNews();
    
                return () => {
                    unsubscribe();
                }
    
            });
    
            return () => {
                unsubscribe();
            }
    
        }, []);
    

    if (loading) return <div className="content" style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -100}}><CircularProgress/></div>;

    return(
        <Box>
            <Typography variant="h4" gutterBottom sx={{textAlign: 'center'}}>Your Portfolio News</Typography>
            <Typography
                variant="h5"
                sx={{
                textAlign: 'center',
                fontSize: 20,
                fontWeight: 600,
                color:
                    overallSentiment >= 0.05
                    ? 'success.main'
                    : overallSentiment <= -0.05
                    ? 'error.main'
                    : 'text.secondary',
                }}
            >
                Overall Sentiment:{" "}
                {overallSentiment >= 0.05
                ? "Positive"
                : overallSentiment <= -0.05
                ? "Negative"
                : "Neutral"}{" "}
                ({overallSentiment.toFixed(2)})
            </Typography>
            
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 2,
                mt: 3,
                px: 2,
            }}>
                {articles.map((article) => (
                <Box
                    key={article.title + article.author}
                    sx={{
                        width: 330,
                        flexShrink: 0,
                    }}
                    ref={(el: HTMLDivElement | null) => {
                    cardRefs.current[article.title] = el;
                    return;
                    }}
                    tabIndex={-1}
                >
                    <Card
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                        transform: 'scale(1.015)',
                        width: 330
                        },
                    }}
                    >
                    <CardActionArea onClick={() => window.open(article.url, '_blank')}>
                        {article.urlToImage && (
                        <CardMedia
                            component="img"
                            height="160"
                            image={article.urlToImage}
                            alt={article.title}
                        />
                        )}
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                                {truncate(article.title, 80)}
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {truncate(article.description || '', 100)}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                {new Date(article.publishedAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                {article.source?.name || 'Unknown Source'}
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ fontWeight: 500, color: 'primary.main' }}>
                                Your assets: {article.matched_assets?.join(', ') || 'General'}
                            </Typography>

                            {article.author && (
                                <Typography variant="caption" color="text.secondary">
                                By {article.author}
                                </Typography>
                            )}

                            {article.sentiment && (
                                <Box sx={{ mt: 1 }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                    fontWeight: 600,
                                    color:
                                        article.sentiment.compound >= 0.05
                                        ? 'success.main'
                                        : article.sentiment.compound <= -0.05
                                        ? 'error.main'
                                        : 'text.secondary',
                                    }}
                                >
                                    Sentiment:{" "}
                                    {article.sentiment.compound >= 0.05
                                    ? "Positive"
                                    : article.sentiment.compound <= -0.05
                                    ? "Negative"
                                    : "Neutral"}{" "}
                                    ({article.sentiment.compound.toFixed(2)})
                                </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </CardActionArea>
                    </Card>
                </Box>
                ))}
            </Box>
        </Box>
    )
}

export default News