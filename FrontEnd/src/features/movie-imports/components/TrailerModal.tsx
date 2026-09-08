import { Modal, Pressable, Text, View } from 'react-native';

import { YouTubeEmbed } from '@/src/components/YouTubeEmbed';

import { styles } from '../styles';
import type { TrailerState } from '../utils';

type TrailerModalProps = {
  onClose: () => void;
  trailer: TrailerState;
};

export function TrailerModal({ onClose, trailer }: TrailerModalProps) {
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
        <View style={styles.trailerModal}>
          <View style={styles.trailerHeader}>
            <Text numberOfLines={2} style={styles.trailerTitle}>
              {trailer?.title ?? 'Trailer'}
            </Text>
            <Pressable onPress={onClose} style={styles.trailerCloseButton}>
              <Text style={styles.trailerCloseText}>Close</Text>
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
