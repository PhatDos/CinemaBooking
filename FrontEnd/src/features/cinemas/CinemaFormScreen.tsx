import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import type { LocationItem } from '@/src/types';

import { FormField } from './components/FormField';
import { StatusToggle } from './components/StatusToggle';
import { useCinemaForm } from './hooks/useCinemaForm';
import { styles } from './styles';

const manageRoute = '/cinemas/manage' as Href;

type CinemaFormScreenProps = {
  cinemaId?: string;
};

export function CinemaFormScreen({ cinemaId }: CinemaFormScreenProps) {
  const cinema = useCinemaForm(cinemaId);

  if (cinema.loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topActions}>
          <AnimatedPressable
            contentStyle={styles.backButton}
            disabled={cinema.saving}
            onPress={() => router.replace(manageRoute)}>
            <Text style={styles.backButtonText}>Back</Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.kicker}>Admin</Text>
        <Text style={styles.title}>
          {cinema.editing ? 'Edit Cinema' : 'Add Cinema'}
        </Text>
        <Text style={styles.subtitle}>
          Cinema details are used by listings, showtime setup, and staff assignment.
        </Text>

        <View style={styles.panel}>
          <View style={styles.formGrid}>
            <FormField
              label="Name"
              onChangeText={(name) => cinema.updateField('name', name)}
              placeholder="Cinema name"
              value={cinema.form.name}
            />
            <FormField
              label="Address"
              onChangeText={(address) => cinema.updateField('address', address)}
              placeholder="Full address"
              value={cinema.form.address}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <LocationSelect
                  label="Province / City"
                  loading={false}
                  onSelect={cinema.selectProvince}
                  options={cinema.provinces}
                  placeholder="Select province or city"
                  value={cinema.selectedProvince?.name ?? ''}
                />
              </View>
              <View style={styles.rowItem}>
                <LocationSelect
                  disabled={!cinema.form.provinceCode}
                  disabledText="Select province first"
                  label="Ward"
                  loading={cinema.loadingWards}
                  onSelect={cinema.selectWard}
                  options={cinema.wards}
                  placeholder="Select ward"
                  value={cinema.selectedWard?.name ?? ''}
                />
              </View>
            </View>

            <FormField
              label="Address line"
              onChangeText={(addressLine) => cinema.updateField('addressLine', addressLine)}
              placeholder="Optional"
              value={cinema.form.addressLine}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Image</Text>
              <View style={styles.imagePicker}>
                <View style={styles.imagePreview}>
                  {cinema.form.imageUrl ? (
                    <Image
                      contentFit="cover"
                      source={{ uri: cinema.form.imageUrl }}
                      style={styles.imagePreviewMedia}
                      transition={180}
                    />
                  ) : (
                    <Text style={styles.imagePlaceholder}>Cinema image</Text>
                  )}
                </View>
                <View style={styles.imageActions}>
                  <AnimatedPressable
                    contentStyle={styles.secondaryButton}
                    disabled={cinema.saving}
                    onPress={() => void cinema.pickImage()}>
                    <Text style={styles.secondaryButtonText}>Choose image</Text>
                  </AnimatedPressable>
                  {cinema.form.imageUrl ? (
                    <AnimatedPressable
                      contentStyle={styles.dangerButton}
                      disabled={cinema.saving}
                      onPress={cinema.clearImage}>
                      <Text style={styles.dangerButtonText}>Remove</Text>
                    </AnimatedPressable>
                  ) : null}
                  <Text style={styles.hintText}>Uploads to Cloudinary when you save.</Text>
                </View>
              </View>
            </View>

            <FormField
              label="Description"
              multiline
              onChangeText={(description) => cinema.updateField('description', description)}
              placeholder="Optional"
              style={styles.textArea}
              value={cinema.form.description}
            />

            <StatusToggle
              active={cinema.form.isActive}
              onToggle={() =>
                cinema.setForm((current) => ({ ...current, isActive: !current.isActive }))
              }
            />
          </View>

          {cinema.error ? <Text style={styles.error}>{cinema.error}</Text> : null}

          <View style={styles.actions}>
            <AnimatedPressable
              contentStyle={styles.secondaryButton}
              disabled={cinema.saving}
              onPress={() => router.replace(manageRoute)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </AnimatedPressable>
            <AnimatedPressable
              contentStyle={[styles.primaryButton, cinema.saving && styles.disabledButton]}
              disabled={cinema.saving}
              onPress={() => void cinema.save()}>
              {cinema.saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {cinema.editing ? 'Save Cinema' : 'Create Cinema'}
                </Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LocationSelect({
  disabled,
  disabledText,
  label,
  loading,
  onSelect,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  disabledText?: string;
  label: string;
  loading: boolean;
  onSelect: (option: LocationItem) => void;
  options: LocationItem[];
  placeholder: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((option) =>
      option.name.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedPressable
        contentStyle={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled,
        ]}
        disabled={disabled || loading}
        onPress={() => setOpen(true)}>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text
            numberOfLines={1}
            style={[
              styles.selectButtonText,
              !value && styles.selectPlaceholder,
              disabled && styles.selectDisabledText,
            ]}>
            {disabled ? disabledText : value || placeholder}
          </Text>
        )}
      </AnimatedPressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}>
        <View style={styles.modalBackdrop}>
          <View style={styles.selectModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <AnimatedPressable
                contentStyle={styles.modalCloseButton}
                onPress={() => setOpen(false)}>
                <Text style={styles.modalCloseText}>Close</Text>
              </AnimatedPressable>
            </View>
            <TextInput
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor="#98a2b3"
              style={styles.input}
              value={query}
            />
            <FlatList
              contentContainerStyle={styles.optionList}
              data={filteredOptions}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item) => item.code}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No options found.</Text>
              }
              renderItem={({ item }) => (
                <AnimatedPressable
                  contentStyle={[
                    styles.optionRow,
                    value === item.name && styles.optionRowSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setQuery('');
                    setOpen(false);
                  }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.optionText,
                      value === item.name && styles.optionTextSelected,
                    ]}>
                    {item.name}
                  </Text>
                </AnimatedPressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
