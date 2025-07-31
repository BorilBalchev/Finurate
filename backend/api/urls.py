from django.contrib import admin
from django.urls import path
from .views import portfolio_prices
from .views import historical_data
from .views import get_news

urlpatterns = [
    path('api/portfolio_prices/', portfolio_prices),
    path('api/historical_data/', historical_data),
    path('api/get_news/', get_news),
]