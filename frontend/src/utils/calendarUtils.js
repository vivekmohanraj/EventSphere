/**
 * Generates calendar links for various platforms
 */

// Format date for calendar URLs
const formatCalendarDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

// Generate Google Calendar URL
export const getGoogleCalendarUrl = (event) => {
  const startTime = formatCalendarDate(event.event_time);
  
  // Calculate end time (default to 2 hours after start)
  const endDate = new Date(event.event_time);
  endDate.setHours(endDate.getHours() + 2);
  const endTime = formatCalendarDate(endDate);
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.event_name);
  url.searchParams.append('dates', `${startTime}/${endTime}`);
  url.searchParams.append('details', event.description || '');
  url.searchParams.append('location', event.venue || '');
  
  return url.toString();
};

// Generate Outlook Calendar URL
export const getOutlookCalendarUrl = (event) => {
  const startTime = new Date(event.event_time).toISOString();
  
  // Calculate end time (default to 2 hours after start)
  const endDate = new Date(event.event_time);
  endDate.setHours(endDate.getHours() + 2);
  const endTime = endDate.toISOString();
  
  const url = new URL('https://outlook.office.com/calendar/0/deeplink/compose');
  url.searchParams.append('subject', event.event_name);
  url.searchParams.append('startdt', startTime);
  url.searchParams.append('enddt', endTime);
  url.searchParams.append('body', event.description || '');
  url.searchParams.append('location', event.venue || '');
  
  return url.toString();
};

// Generate iCalendar file data (for Apple Calendar, etc.)
export const getICalendarData = (event) => {
  const startDate = new Date(event.event_time);
  
  // Calculate end time (default to 2 hours after start)
  const endDate = new Date(event.event_time);
  endDate.setHours(endDate.getHours() + 2);
  
  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${event.event_name}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `LOCATION:${event.venue || ''}`,
    `DESCRIPTION:${event.description ? event.description.replace(/\n/g, '\\n') : ''}`,
    `URL:${window.location.href}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsData;
};

// Generate a downloadable ICS file
export const downloadICalendarFile = (event) => {
  const icsData = getICalendarData(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${event.event_name.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 