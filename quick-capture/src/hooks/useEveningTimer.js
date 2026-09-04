import { useState, useEffect } from 'react';

export function useEveningTimer(targetHour = 20) {
  const [isEvening, setIsEvening] = useState(false);

  useEffect(() => {
    function checkTime() {
      const now = new Date();
      const hours = now.getHours();
      // Prompt evening triage between targetHour (8 PM) and 2 AM
      setIsEvening(hours >= targetHour || hours < 2);
    }

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [targetHour]);

  return isEvening;
}
