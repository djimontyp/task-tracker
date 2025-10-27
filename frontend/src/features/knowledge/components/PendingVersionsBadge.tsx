import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/badge';
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket';
import { versioningService } from '../api/versioningService';
import type { PendingVersionsCount } from '../types';

interface WebSocketMessage {
  event?: string;
  count?: number;
  topics?: number;
  atoms?: number;
}

export function PendingVersionsBadge() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<PendingVersionsCount>({ count: 0, topics: 0, atoms: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadInitialCount();
  }, []);

  const loadInitialCount = async () => {
    try {
      const count = await versioningService.getPendingVersionsCount();
      setPendingCount(count);
      setIsVisible(count.count > 0);
    } catch (error) {
      console.error('Failed to load pending versions count:', error);
    }
  };

  const handleWebSocketMessage = (data: unknown) => {
    const message = data as WebSocketMessage;

    if (message.event === 'pending_count_updated' && typeof message.count === 'number') {
      const newCount: PendingVersionsCount = {
        count: message.count,
        topics: message.topics ?? 0,
        atoms: message.atoms ?? 0,
      };

      setPendingCount(newCount);

      if (newCount.count > 0 && !isVisible) {
        setIsVisible(true);
        setTimeout(() => setIsVisible(true), 10);
      } else if (newCount.count === 0) {
        setTimeout(() => setIsVisible(false), 300);
      }
    }
  };

  useWebSocket({
    topics: ['versions'],
    onMessage: handleWebSocketMessage,
  });

  const handleClick = () => {
    navigate('/versions?status=pending');
  };

  if (!isVisible || pendingCount.count === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className="cursor-pointer transition-all duration-300 ease-in-out hover:scale-110"
      onClick={handleClick}
      title={`Очікують схвалення: ${pendingCount.topics} топіків, ${pendingCount.atoms} атомів`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
      }}
    >
      {pendingCount.count}
    </Badge>
  );
}
