from rest_framework import viewsets
from .models import Pokemon, UserProfile
from .serializers import PokemonSerializer, UserProfileSerializer
from rest_framework.response import Response
from rest_framework.decorators import action

class PokémonViewSet(viewsets.ModelViewSet):
    queryset = Pokemon.objects.all()
    serializer_class = PokemonSerializer

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    @action(detail=True, methods=['post'])
    def choose_pokemon(self, request, pk=None):
        user_profile = self.get_object()
        selected_pokemon = Pokemon.objects.get(pk=request.data['pokemon_id'])
        user_profile.chosen_pokemon = selected_pokemon
        user_profile.save()
        return Response({"message": "Pokemon chosen", "pokemon": PokemonSerializer(selected_pokemon).data})
