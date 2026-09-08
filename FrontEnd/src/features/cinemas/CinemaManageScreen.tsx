import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { FadeInView } from '@/src/components/FadeInView';
import { formatCinemaName } from '@/src/display';
import type { Cinema, Room } from '@/src/types';

import { FormField } from './components/FormField';
import { StatusToggle } from './components/StatusToggle';
import { useCinemaManagement } from './hooks/useCinemaManagement';
import { styles } from './styles';
import { getCinemaInitials, getCinemaLocation } from './utils';

export function CinemaManageScreen() {
  const cinema = useCinemaManagement();

  if (cinema.loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={cinema.refreshing} onRefresh={cinema.refresh} />
        }>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderText}>
              <Text style={styles.panelTitle}>Cinemas</Text>
              <Text style={styles.panelMeta}>{cinema.cinemas.length} total</Text>
            </View>
            <AnimatedPressable
              contentStyle={styles.primaryButton}
              onPress={() => router.push('/cinemas/form')}>
              <Text style={styles.primaryButtonText}>Add Cinema</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.list}>
            {cinema.cinemas.length ? (
              cinema.cinemas.map((item, index) => (
                <CinemaCard
                  cinema={item}
                  disabled={cinema.savingCinema}
                  index={index}
                  isSelected={item.id === cinema.selectedCinemaId}
                  key={item.id}
                  onEdit={() =>
                    router.push({
                      pathname: '/cinemas/form',
                      params: { id: item.id },
                    })
                  }
                  onSelect={() => cinema.setSelectedCinemaId(item.id)}
                  onToggle={() => void cinema.toggleCinema(item)}
                />
              ))
            ) : (
              <EmptyPanel title="No cinemas found" text="Create a cinema to start managing rooms." />
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderText}>
              <Text style={styles.panelTitle}>Rooms</Text>
              <Text style={styles.panelMeta}>
                {cinema.selectedCinema ? formatCinemaName(cinema.selectedCinema.name) : 'Select a cinema'}
              </Text>
            </View>
          </View>

          {cinema.selectedCinema ? (
            <>
              <View style={styles.selectedCinemaSummary}>
                <Text numberOfLines={1} style={styles.selectedCinemaTitle}>
                  {formatCinemaName(cinema.selectedCinema.name)}
                </Text>
                <Text numberOfLines={2} style={styles.selectedCinemaMeta}>
                  {getCinemaLocation(cinema.selectedCinema)} - {cinema.selectedCinema.address}
                </Text>
              </View>

              <View style={styles.roomEditor}>
                <View style={styles.formGrid}>
                  <FormField
                    label={cinema.editingRoom ? 'Edit room' : 'Add room'}
                    onChangeText={(name) => cinema.setRoomForm((current) => ({ ...current, name }))}
                    placeholder="Room name"
                    value={cinema.roomForm.name}
                  />
                  <StatusToggle
                    active={cinema.roomForm.isActive}
                    onToggle={() =>
                      cinema.setRoomForm((current) => ({ ...current, isActive: !current.isActive }))
                    }
                  />
                </View>

                <View style={styles.actions}>
                  {cinema.editingRoom ? (
                    <AnimatedPressable
                      contentStyle={styles.secondaryButton}
                      disabled={cinema.savingRoom}
                      onPress={cinema.resetRoomForm}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </AnimatedPressable>
                  ) : null}
                  <AnimatedPressable
                    contentStyle={[styles.primaryButton, cinema.savingRoom && styles.disabledButton]}
                    disabled={cinema.savingRoom}
                    onPress={() => void cinema.saveRoom()}>
                    {cinema.savingRoom ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {cinema.editingRoom ? 'Save Room' : 'Create Room'}
                      </Text>
                    )}
                  </AnimatedPressable>
                </View>
              </View>

              <View style={styles.list}>
                {cinema.loadingRooms ? (
                  <ActivityIndicator />
                ) : cinema.rooms.length ? (
                  cinema.rooms.map((room) => (
                    <RoomCard
                      disabled={cinema.savingRoom}
                      key={room.id}
                      onEdit={() => cinema.startEditRoom(room)}
                      onToggle={() => void cinema.toggleRoom(room)}
                      room={room}
                    />
                  ))
                ) : (
                  <EmptyPanel title="No rooms found" text="Create the first room for this cinema." />
                )}
              </View>
            </>
          ) : (
            <EmptyPanel title="No cinema selected" text="Create or select a cinema before adding rooms." />
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function CinemaCard({
  cinema,
  disabled,
  index,
  isSelected,
  onEdit,
  onSelect,
  onToggle,
}: {
  cinema: Cinema;
  disabled: boolean;
  index: number;
  isSelected: boolean;
  onEdit: () => void;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <FadeInView delay={index * 35}>
      <AnimatedPressable
        contentStyle={[styles.cinemaCard, isSelected && styles.cinemaCardSelected]}
        onPress={onSelect}>
        <View style={styles.cardTop}>
          <CinemaCardMedia cinema={cinema} />
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text numberOfLines={2} style={styles.cardTitle}>{formatCinemaName(cinema.name)}</Text>
              <StatusBadge active={cinema.isActive} />
            </View>
            <Text style={styles.cardMeta}>{getCinemaLocation(cinema)}</Text>
            <Text style={styles.cardMeta}>{cinema.address}</Text>
            {cinema.description ? (
              <Text numberOfLines={2} style={styles.description}>{cinema.description}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <AnimatedPressable
            contentStyle={styles.secondaryButton}
            onPress={(event) => {
              event.stopPropagation();
              onEdit();
            }}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </AnimatedPressable>
          <AnimatedPressable
            contentStyle={cinema.isActive ? styles.dangerButton : styles.restoreButton}
            disabled={disabled}
            onPress={(event) => {
              event.stopPropagation();
              onToggle();
            }}>
            <Text style={cinema.isActive ? styles.dangerButtonText : styles.restoreButtonText}>
              {cinema.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </AnimatedPressable>
        </View>
      </AnimatedPressable>
    </FadeInView>
  );
}

function CinemaCardMedia({ cinema }: { cinema: Cinema }) {
  const imageUrl = cinema.imageUrl?.trim();

  return (
    <View style={styles.cinemaThumb}>
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={styles.cinemaThumbImage}
          transition={180}
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getCinemaInitials(cinema.name)}</Text>
        </View>
      )}
    </View>
  );
}

function RoomCard({
  disabled,
  onEdit,
  onToggle,
  room,
}: {
  disabled: boolean;
  onEdit: () => void;
  onToggle: () => void;
  room: Room;
}) {
  return (
    <View style={styles.roomCard}>
      <View style={styles.roomTop}>
        <Text numberOfLines={2} style={styles.roomName}>{room.name}</Text>
        <StatusBadge active={room.isActive} />
      </View>
      <View style={styles.cardActions}>
        <AnimatedPressable contentStyle={styles.secondaryButton} onPress={onEdit}>
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </AnimatedPressable>
        <AnimatedPressable
          contentStyle={room.isActive ? styles.dangerButton : styles.restoreButton}
          disabled={disabled}
          onPress={onToggle}>
          <Text style={room.isActive ? styles.dangerButtonText : styles.restoreButtonText}>
            {room.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
      <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextInactive]}>
        {active ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

function EmptyPanel({ text, title }: { text: string; title: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}
