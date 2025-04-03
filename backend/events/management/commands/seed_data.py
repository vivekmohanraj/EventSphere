import json
from django.core.management.base import BaseCommand
from events.models import EventTag, Venue
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Seeds the database with initial event tags and venues'

    def handle(self, *args, **options):
        self.stdout.write('Seeding event tags and venues...')
        
        # Create event tags if they don't exist
        tags_data = [
            'Technology', 'Business', 'Education', 'Entertainment',
            'Food & Drink', 'Health & Wellness', 'Music', 'Sports & Fitness',
            'Networking', 'Family Friendly'
        ]
        
        for tag_name in tags_data:
            slug = slugify(tag_name)
            if not EventTag.objects.filter(slug=slug).exists():
                EventTag.objects.create(name=tag_name, slug=slug)
                self.stdout.write(self.style.SUCCESS(f'Created tag: {tag_name}'))
            else:
                self.stdout.write(f'Tag already exists: {tag_name}')
        
        # Create venues if they don't exist
        venues_data = [
            {
                'name': 'Corporate Executive Center',
                'address': '123 Business Park, Financial District',
                'capacity': 300,
                'price_per_hour': 5000,
                'description': 'Professional venue with advanced presentation technology, perfect for conferences, seminars, and corporate meetings.',
                'image_url': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
                'features': ['Conference Tables', 'Stage', 'Projectors', 'Microphones', 'Wi-Fi', 'Catering Available', 'Parking']
            },
            {
                'name': 'Workshop Studio',
                'address': '456 Creative Lane, Arts District',
                'capacity': 50,
                'price_per_hour': 2500,
                'description': 'Flexible space designed for interactive workshops and small seminars. Includes workstations and creative breakout areas.',
                'image_url': 'https://images.stockcake.com/public/b/5/f/b5fd8cec-afa5-4237-b1e7-f9569d27e14c/busy-tech-workshop-stockcake.jpg',
                'features': ['Workstations', 'Whiteboards', 'Materials Storage', 'Natural Lighting', 'Video Recording']
            },
            {
                'name': 'Grand Ballroom',
                'address': '789 Celebration Avenue, City Center',
                'capacity': 400,
                'price_per_hour': 7500,
                'description': 'Elegant ballroom with crystal chandeliers, perfect for weddings, large corporate events, and formal celebrations.',
                'image_url': 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1674&q=80',
                'features': ['Dance Floor', 'Stage', 'Professional Lighting', 'Bridal Suite', 'Full-Service Bar', 'Catering Kitchen']
            },
            {
                'name': 'Rooftop Concert Space',
                'address': '101 Skyline Drive, Entertainment District',
                'capacity': 200,
                'price_per_hour': 6000,
                'description': 'Urban rooftop venue with state-of-the-art sound system and panoramic city views, ideal for concerts and music events.',
                'image_url': 'https://images.stockcake.com/public/0/3/0/030a274e-47e8-487e-9129-544289c369a3_large/sunset-rooftop-concert-stockcake.jpg',
                'features': ['Professional Sound System', 'Lighting Rig', 'Green Room', 'Bar Service', 'Weather Protection']
            },
            {
                'name': 'Kids Party Palace',
                'address': '222 Fun Street, Family Zone',
                'capacity': 80,
                'price_per_hour': 3000,
                'description': 'Colorful and safe space designed for children\'s birthday parties with entertainment options and themed decoration packages.',
                'image_url': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
                'features': ['Play Area', 'Theme Decorations', 'Entertainment Options', 'Party Rooms', 'Catering for Kids']
            },
            {
                'name': 'Garden Terrace',
                'address': '333 Park Lane, Green Hills',
                'capacity': 150,
                'price_per_hour': 4000,
                'description': 'Beautiful outdoor venue with lush gardens and pergola, perfect for weddings, birthday celebrations, and garden parties.',
                'image_url': 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80',
                'features': ['Outdoor Space', 'Wedding Arch', 'Garden Lighting', 'Weather Backup Plan', 'Scenic Photo Spots']
            }
        ]
        
        for venue_data in venues_data:
            if not Venue.objects.filter(name=venue_data['name']).exists():
                features = venue_data.pop('features')
                venue = Venue.objects.create(**venue_data, features=features)
                self.stdout.write(self.style.SUCCESS(f'Created venue: {venue.name}'))
            else:
                self.stdout.write(f'Venue already exists: {venue_data["name"]}')
        
        self.stdout.write(self.style.SUCCESS('Seeding completed successfully'))
