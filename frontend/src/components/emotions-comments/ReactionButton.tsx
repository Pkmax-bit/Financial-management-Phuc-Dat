import React, { useState } from 'react';
import { ThumbsUp, Heart, Laugh, Frown, Angry, ThumbsDown, PartyPopper, MessageCircle } from 'lucide-react';
import { getApiEndpoint } from '@/lib/apiUrl'

interface EmotionType {
  id: string;
  name: string;
  display_name: string;
  emoji: string;
  color?: string;
  is_active: boolean;
}

interface ReactionButtonProps {
  entityType: string;
  entityId: string;
  currentUserId?: string;
  onReactionChange?: () => void;
  compact?: boolean;
}

const emotionIcons: { [key: string]: React.ReactNode } = {
  like: <ThumbsUp className="w-4 h-4" />,
  love: <Heart className="w-4 h-4" />,
  laugh: <Laugh className="w-4 h-4" />,
  wow: <MessageCircle className="w-4 h-4" />,
  sad: <Frown className="w-4 h-4" />,
  angry: <Angry className="w-4 h-4" />,
  dislike: <ThumbsDown className="w-4 h-4" />,
  celebrate: <PartyPopper className="w-4 h-4" />
};

export default function ReactionButton({ 
  entityType, 
  entityId, 
  currentUserId,
  onReactionChange,
  compact = false 
}: ReactionButtonProps) {
  const [emotionTypes, setEmotionTypes] = useState<EmotionType[]>([]);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadEmotionTypes();
    loadReactions();
  }, [entityType, entityId]);

  const loadEmotionTypes = async () => {
    try {
      const response = await fetch(getApiEndpoint('/api/emotions-comments/emotion-types'))
      if (response.ok) {
        const data = await response.json();
        setEmotionTypes(data);
      }
    } catch (error) {
      console.error('Error loading emotion types:', error);
    }
  };

  const loadReactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiEndpoint(`/api/emotions-comments/comments/${entityType}/${entityId}`))
      if (response.ok) {
        const data = await response.json();
        // Aggregate reactions from all comments
        const allReactions: { [key: string]: number } = {};
        let userReactionFound: string | null = null;
        
        data.forEach((comment: any) => {
          Object.entries(comment.reactions).forEach(([emotion, count]) => {
            allReactions[emotion] = (allReactions[emotion] || 0) + count;
          });
          if (comment.user_reaction && !userReactionFound) {
            userReactionFound = comment.user_reaction;
          }
        });
        
        setReactions(allReactions);
        setUserReaction(userReactionFound);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (emotionTypeId: string, emotionName: string) => {
    try {
      if (userReaction === emotionName) {
        // Remove reaction
        const response = await fetch(`/api/emotions-comments/reactions/public?entity_type=${entityType}&entity_id=${entityId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setUserReaction(null);
          setReactions(prev => ({
            ...prev,
            [emotionName]: Math.max(0, (prev[emotionName] || 1) - 1)
          }));
          onReactionChange?.();
        }
      } else {
        // Add reaction
        const response = await fetch('/api/emotions-comments/reactions/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            emotion_type_id: emotionTypeId
          })
        });
        
        if (response.ok) {
          setUserReaction(emotionName);
          setReactions(prev => ({
            ...prev,
            [emotionName]: (prev[emotionName] || 0) + 1
          }));
          onReactionChange?.();
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
        <div className="animate-pulse bg-gray-200 rounded-full w-6 h-6"></div>
      </div>
    );
  }

  const hasReactions = Object.values(reactions).some(count => count > 0);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {emotionTypes.slice(0, 4).map((emotionType) => {
          const count = reactions[emotionType.name] || 0;
          const isActive = userReaction === emotionType.name;
          
          if (count === 0 && !isActive) return null;
          
          return (
            <button
              key={emotionType.id}
              onClick={() => handleReaction(emotionType.id, emotionType.name)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={emotionType.display_name}
            >
              <span>{emotionType.emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {emotionTypes.map((emotionType) => {
        const count = reactions[emotionType.name] || 0;
        const isActive = userReaction === emotionType.name;
        
        return (
          <button
            key={emotionType.id}
            onClick={() => handleReaction(emotionType.id, emotionType.name)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
              isActive
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={emotionType.display_name}
          >
            <span>{emotionType.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
