export const formatDateForDisplay = (date: Date): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};

export const parseDateFromString = (dateString: string): Date | null => {
  // Updated regex to match new format: "Sep 13 01:46 PM"
  const dateRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2})\s(\d{2}):(\d{2})\s(AM|PM)$/;
  const match = dateString.match(dateRegex);
  
  if (!match) {
    // Try old format for backwards compatibility: "Jan 01, 2024"
    const oldDateRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2}),\s(\d{4})$/;
    const oldMatch = dateString.match(oldDateRegex);
    
    if (oldMatch) {
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = months[oldMatch[1] as keyof typeof months];
      const day = parseInt(oldMatch[2], 10);
      const year = parseInt(oldMatch[3], 10);
      
      return new Date(year, month, day);
    }
    
    return null;
  }
  
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const month = months[match[1] as keyof typeof months];
  const day = parseInt(match[2], 10);
  let hours = parseInt(match[3], 10);
  const minutes = parseInt(match[4], 10);
  const ampm = match[5];
  
  // Convert to 24-hour format
  if (ampm === 'AM' && hours === 12) {
    hours = 0;
  } else if (ampm === 'PM' && hours !== 12) {
    hours += 12;
  }
  
  // Use current year since new format doesn't include year
  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, month, day, hours, minutes);
  
  // Validate the date
  if (date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  
  return date;
};

export const validateDateString = (dateString: string): boolean => {
  return parseDateFromString(dateString) !== null;
};

export const getCurrentDateFormatted = (): string => {
  return formatDateForDisplay(new Date());
};

// Format date for API submission (YYYY-MM-DD format)
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Convert display format to API format
export const convertDisplayDateToAPI = (displayDate: string): string => {
  const parsedDate = parseDateFromString(displayDate);
  if (!parsedDate) {
    // Fallback to current date if parsing fails
    return formatDateForAPI(new Date());
  }
  return formatDateForAPI(parsedDate);
};

// Format date with time for recent expenses display (Sep 13 01:46 PM)
export const formatDateWithTime = (date: Date): string => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // Convert to 12-hour format
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  // Format minutes with leading zero
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  // Format hours with leading zero
  const formattedHours = displayHours.toString().padStart(2, '0');
  
  return `${month} ${day} ${formattedHours}:${formattedMinutes} ${ampm}`;
};

// Parse date string and format with time for recent expenses
export const formatDateStringWithTime = (dateString: string): string => {
  // Try to parse as ISO date first (from API)
  let date = new Date(dateString);
  
  // If parsing fails, try our custom format
  if (isNaN(date.getTime())) {
    const parsedDate = parseDateFromString(dateString);
    if (parsedDate) {
      date = parsedDate;
    } else {
      // Fallback to current date
      date = new Date();
    }
  }
  
  return formatDateWithTime(date);
};

// Get current date and time formatted for display
export const getCurrentDateTimeFormatted = (): string => {
  return formatDateWithTime(new Date());
};

//formatdatyear
export const formatMonthYear = (date: Date): string => {
  return formatDateWithTime(date);
};
