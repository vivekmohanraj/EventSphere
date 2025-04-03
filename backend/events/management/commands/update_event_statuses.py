from django.core.management.base import BaseCommand
from django.utils import timezone
from events.models import Event
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Update event statuses for past events (upcoming → completed)'

    def handle(self, *args, **options):
        """
        This command checks all upcoming events and updates them to 'completed'
        if their scheduled time has passed.
        """
        start_time = timezone.now()
        self.stdout.write(f"Starting event status update at {start_time}")
        
        try:
            # Use the classmethod we defined in the Event model
            updated_count = Event.update_all_past_events()
            
            end_time = timezone.now()
            duration = (end_time - start_time).total_seconds()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated {updated_count} events from 'upcoming' to 'completed' in {duration:.2f} seconds"
                )
            )
            
            logger.info(f"Updated {updated_count} event statuses from 'upcoming' to 'completed'")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error updating event statuses: {str(e)}")
            )
            logger.error(f"Error updating event statuses: {str(e)}") 