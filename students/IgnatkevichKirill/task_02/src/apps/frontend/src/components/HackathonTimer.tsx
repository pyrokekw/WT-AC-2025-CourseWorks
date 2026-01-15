import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface HackathonTimerProps {
  endDate: string;
  status: string;
}

export default function HackathonTimer({ endDate, status }: HackathonTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        return 'Завершено';
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}д ${hours}ч`;
      }
      return `${hours}ч ${minutes}м`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Обновляем каждую минуту

    return () => clearInterval(timer);
  }, [endDate]);

  const getTimerColor = () => {
    if (status === 'ENDED') return 'text-secondary';
    
    const end = new Date(endDate);
    const now = new Date();
    const diffHours = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'text-danger';
    if (diffHours < 72) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`d-flex align-items-center ${getTimerColor()}`}>
      <Clock size={18} className="me-2" />
      <div>
        <div className="fw-bold">{timeLeft}</div>
        <small className="text-muted">до завершения</small>
      </div>
    </div>
  );
}