import React, { useEffect, useRef, useMemo } from 'react';
import { Text, TouchableOpacity, View, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { AvailabilityData, TimeSlot } from '@/lib/database.types';
import { getThemeColors } from '@/lib/utils/theme';
import CachedImage from '@/components/ui/CachedImage';
import RatingBadge from '@/components/ui/RatingBadge';
import CountryFlag from '@/components/ui/CountryFlag';

interface PlayerCardProps {
  player: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    rating: number | null;
    avatar_url: string | null;
    homecourt_name: string | null;
    city_name: string | null;
    state_province: string | null;
    availability: AvailabilityData | null;
    country_code: string | null; // Location country (from city)
    nationality_code: string | null; // Flag nationality
    club_name?: string | null;
    available_today: boolean | null;
    available_today_updated_at: string | null;
  };
  timeSlots: TimeSlot[];
  onPress?: () => void;
}

const AVAILABLE_BORDER_COLOR = 'rgb(99, 102, 241)'; // indigo-500

function isPlayerAvailableToday(availableToday: boolean | null, updatedAt: string | null): boolean {
  if (!availableToday || !updatedAt) return false;
  
  const date = new Date(updatedAt);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

const PlayerCardContent = React.memo(function PlayerCardContent({ player, timeSlots, colors }: {
  player: PlayerCardProps['player'];
  timeSlots: TimeSlot[];
  colors: any;
}) {
  const { t } = useTranslation('common');
  const { t: tCommunity } = useTranslation('community');

  return (
  <>
    <View className="flex-row justify-between items-center" style={{ marginBottom: 10 }}>
      <View className="flex-row items-center flex-1">
        <CachedImage
          source={player.avatar_url}
          style={{ width: 48, height: 48, borderRadius: 24, marginRight: 10 }}
          priority="high"
          showLoading={false}
          fallback={
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primaryForeground }}>
                {player.first_name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </View>
          }
        />
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <CountryFlag
                countryCode={player.nationality_code}
                size="sm"
                style={{ marginRight: 6 }}
              />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {player.first_name} {player.last_name?.charAt(0)}.
              </Text>
            </View>
            
            {player.rating && (
              <RatingBadge rating={player.rating} size="md" />
            )}
          </View>
          <Text style={{
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4
          }}>
            {player.club_name || player.homecourt_name || `${player.city_name || tCommunity('players.unknownCity')}${player.state_province ? ` - ${player.state_province}` : ''}`}
          </Text>
        </View>
      </View>
    </View>
    
    <View className="flex-row gap-2">
      {timeSlots.map(slot => (
        <View
          key={slot}
          style={{
            backgroundColor: colors.muted,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 20,
          }}
        >
          <Text style={{
            color: colors.mutedForeground,
            fontSize: 11,
            fontWeight: '500',
          }}>
            {t(`timeSlots.${slot}`)}
          </Text>
        </View>
      ))}
    </View>
  </>
)});

const PlayerCard = React.memo(function PlayerCard({ player, timeSlots, onPress }: PlayerCardProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { t } = useTranslation('community');
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  const availableToday = useMemo(
    () => isPlayerAvailableToday(player.available_today, player.available_today_updated_at),
    [player.available_today, player.available_today_updated_at]
  );

  useEffect(() => {
    if (availableToday) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 }
      );
      animation.start();
      return () => animation.stop();
    } else {
      animatedValue.setValue(0);
    }
  }, [availableToday, animatedValue]);

  const baseCardStyle = {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  };

  if (availableToday) {
    const animatedBorderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [AVAILABLE_BORDER_COLOR, colors.border],
    });

    return (
      <Animated.View
        style={[
          baseCardStyle,
          {
            borderWidth: 2,
            borderColor: animatedBorderColor,
          }
        ]}
      >
        <TouchableOpacity 
          onPress={onPress}
          activeOpacity={0.7}
          style={{ position: 'relative' }}
        >
          <PlayerCardContent player={player} timeSlots={timeSlots} colors={colors} />
          
          <View style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: AVAILABLE_BORDER_COLOR,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{
              color: 'white',
              fontSize: 10,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}>
              {t('players.lookingToPlayNow')}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        baseCardStyle,
        {
          borderWidth: 1,
          borderColor: colors.border,
        }
      ]}
    >
      <PlayerCardContent player={player} timeSlots={timeSlots} colors={colors} />
    </TouchableOpacity>
  );
});

export default PlayerCard; 