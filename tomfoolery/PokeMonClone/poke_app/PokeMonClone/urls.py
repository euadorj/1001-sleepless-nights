from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PokémonViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'pokemon', PokémonViewSet)
router.register(r'users', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
