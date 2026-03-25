from django.db import models
from django.contrib.auth.models import User

class Pokemon(models.Model):
    name = models.CharField(max_length=50)
    type_1 = models.CharField(max_length=20)
    type_2 = models.CharField(max_length=20, blank=True, null=True)
    evolution = models.CharField(max_length=100)
    stats = models.JSONField()  # Store stats as JSON

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    chosen_pokemon = models.ForeignKey(Pokemon, on_delete=models.SET_NULL, null=True)
    wild_pokemon = models.JSONField(default=list)  # Store caught Pokémon

    def __str__(self):
        return self.user.username


# store pokemon entries as JSON
[
    {
        "name": "Bulbasaur",
        "type_1": "Grass",
        "type_2": "Poison",
        "evolution": "Ivysaur",
        "stats": {
            "XP": 64,
            "HP": 45,
            "Attack": 49,
            "Defense": 49,
            "Special Attack": 65,
            "Special Defense": 65,
            "Speed": 45
        }
    },
    {
        "name": "Charmander",
        "type_1": "Fire",
        "type_2": None,
        "evolution": "Charmeleon",
        "stats": {
            "XP": 65,
            "HP": 39,
            "Attack": 52,
            "Defense": 43,
            "Special Attack": 60,
            "Special Defense": 50,
            "Speed": 65
        }
    },
    {
        "name": "Squirtle",
        "type_1": "Water",
        "type_2": None,
        "evolution": "Wartortle",
        "stats": {
            "XP": 63,
            "HP": 44,
            "Attack": 48,
            "Defense": 65,
            "Special Attack": 50,
            "Special Defense": 64,
            "Speed": 43
        }
    }
]

# starter pokemon