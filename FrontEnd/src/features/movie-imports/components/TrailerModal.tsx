import { Modal, Pressable, Text, View } from 'react-native';

import { YouTubeEmbed } from '@/src/features/movies/components/YouTubeEmbed';
import { useThemeMode } from '@/src/theme';

import { styles } from '../styles';
import type { TrailerState } from '../utils';

type TrailerModalProps = {
  onClose: () => void;
  trailer: TrailerState;
};

export function TrailerModal({ onClose, trailer }: TrailerModalProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={trailer !== null}>
      <View style={styles.trailerBackdrop}>
        <Pressable
          accessibilityLabel="Close trailer"
          onPress={onClose}
          style={styles.trailerBackdropPressable}
        />
        <View style={[styles.trailerModal, dark && styles.trailerModalDark]}>
          <View style={styles.trailerHeader}>
            <Text numberOfLines={2} style={[styles.trailerTitle, dark && styles.textDark]}>
              {trailer?.title ?? 'Trailer'}
            </Text>
            <Pressable onPress={onClose} style={[styles.trailerCloseButton, dark && styles.secondaryButtonDark]}>
              <Text style={[styles.trailerCloseText, dark && styles.textDark]}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.trailerPlayer}>
            {trailer ? (
              <YouTubeEmbed height={220} play={false} videoId={trailer.videoId} />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
