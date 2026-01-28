
export type BusinessStatus = 'open' | 'closing_soon' | 'closed';

export interface StatusResult {
  status: BusinessStatus;
  color: string;
  textColor: string;
  text: string;
}

// Configuration: 24-hour format
const OPEN_HOUR = 11; // 11:00 AM
const CLOSE_HOUR = 23; // 11:00 PM (23:00)

export const getBusinessStatus = (): StatusResult => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Convert current time to a comparable decimal (e.g., 14:30 = 14.5)
  const currentTime = currentHour + (currentMinute / 60);

  // 1. Check if Closed (Before Open or After Close)
  if (currentTime < OPEN_HOUR || currentTime >= CLOSE_HOUR) {
    return {
      status: 'closed',
      color: 'bg-red-500',
      textColor: 'text-red-400',
      text: `Closed • Opens ${formatHour(OPEN_HOUR)}`
    };
  }

  // 2. Check if Closing Soon (Within last 45 minutes)
  // 45 mins = 0.75 hours
  if (currentTime >= (CLOSE_HOUR - 0.75)) {
    return {
      status: 'closing_soon',
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      text: `Closing Soon • ${formatHour(CLOSE_HOUR)}`
    };
  }

  // 3. Open
  return {
    status: 'open',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    text: `Open Now • Closes ${formatHour(CLOSE_HOUR)}`
  };
};

const formatHour = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12} ${period}`;
};
