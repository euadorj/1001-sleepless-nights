from rest_framework import serializers
from .models import Pokemon, UserProfile

class PokemonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pokemon
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['chosen_pokemon', 'wild_pokemon']
