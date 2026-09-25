import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import { FONT_SIZES, FONT_STYLES, ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { FollowableUser, NewChatModalProps } from '@/types';
import { scale } from '@/lib/scale';


export const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  users,
  onClose,
  onSelectUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      (u.fullName && u.fullName.toLowerCase().includes(q))
    );
  });

  const renderItem = ({ item }: { item: FollowableUser }) => {
    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={() => {
          onSelectUser(item);
          onClose();
        }}
      >
        <View style={styles.avatarWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.fullName} numberOfLines={1}>
            {item.fullName || item.username}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{item.username}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            onSelectUser(item);
            onClose();
          }}
        >
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.CLOSE}
              size={24}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New message</Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* "To: " Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.toLabel}>To:</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search followed users..."
            placeholderTextColor={LIGHT_COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <Icon
                name={ICON_NAMES.CLOSE}
                size={18}
                color={LIGHT_COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Users list */}
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? 'No users match your search'
                  : 'No followed users found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Follow people to start chatting with them
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
  },
  toLabel: {
    fontSize: scale.ms(15),
    fontFamily: FONT_STYLES.medium,
    color: LIGHT_COLORS.black,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    paddingVertical: 4,
    fontFamily: FONT_STYLES.regular
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LIGHT_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  username: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 2,
    fontFamily: FONT_STYLES.regular
  },
  chatButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: LIGHT_COLORS.unread_dot,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONT_STYLES.regular
  },
});
