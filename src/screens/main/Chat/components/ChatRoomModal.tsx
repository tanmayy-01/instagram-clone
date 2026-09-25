import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@/components/Icon';
import { FONT_SIZES, FONT_STYLES, ICON_NAMES, LIGHT_COLORS, METRICS } from '@/constants';
import { showToast } from '@/components/toast';
import { isIOS, formatTimeAgo } from '@/utils';
import {
  sendMessage,
  deleteMessage,
  subscribeToMessages,
  markChatAsRead,
  getChatId,
} from '@/services/chatService';
import { setActiveChatId } from '@/services/notificationService';
import { ChatMessage, ChatRoomModalProps } from '@/types';
import { scale } from '@/lib/scale';



export const ChatRoomModal: React.FC<ChatRoomModalProps> = ({
  visible,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  targetUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<any>(null);


  useEffect(() => {
    if (!visible) {
      setInputText('');
      setReplyingTo(null);
    }
  }, [visible]);

  const chatId =
    targetUser && currentUserId ? getChatId(currentUserId, targetUser.uid) : '';

  // 1. Subscribe to real-time messages in this chat & mark as read
  useEffect(() => {
    if (!visible || !chatId || !currentUserId) {
      setMessages([]);
      setActiveChatId(null);
      return;
    }

    // Mark as active so in-app notifications are muted for this specific chat
    setActiveChatId(chatId);

    // Mark as read immediately in Firestore
    markChatAsRead(chatId, currentUserId);

    // Subscribe to Firestore onSnapshot
    const unsubscribe = subscribeToMessages(chatId, newMsgs => {
      setMessages(newMsgs);
    });

    return () => {
      setActiveChatId(null);
      unsubscribe();
    };
  }, [visible, chatId, currentUserId]);

  const handleSend = async (customText?: string) => {
    const textToSend = (
      customText !== undefined ? customText : inputText
    ).trim();
    if (!textToSend || !targetUser || !currentUserId || isSending) return;

    setIsSending(true);
    setInputText('');

    const replyData = replyingTo
      ? {
          messageId: replyingTo.id,
          text: replyingTo.text,
          senderName: replyingTo.senderName,
          senderId: replyingTo.senderId,
        }
      : undefined;

    setReplyingTo(null);

    await sendMessage({
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      receiverId: targetUser.uid,
      receiverName: targetUser.fullName || targetUser.username,
      receiverAvatar: targetUser.avatar,
      text: textToSend,
      replyTo: replyData,
    });

    setIsSending(false);
  };

  const handleReplyPress = (msg: ChatMessage) => {
    setOptionsModalVisible(false);
    setSelectedMessage(null);
    setReplyingTo(msg);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleDeletePress = (msg: ChatMessage) => {
    setOptionsModalVisible(false);
    setSelectedMessage(null);

    if (msg.senderId !== currentUserId) {
      showToast('You can only delete your own message');
      return;
    }

    Alert.alert(
      'Unsend Message?',
      'This will remove the message for everyone in the chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsend',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMessage({
              chatId,
              messageId: msg.id,
              currentUserId,
            });
            if (success) {
              showToast('Message deleted');
            } else {
              showToast('Failed to delete message');
            }
          },
        },
      ],
    );
  };

  const handleCopyText = (text: string) => {
    setOptionsModalVisible(false);
    setSelectedMessage(null);
    showToast(`Copied: "${text.substring(0, 20)}..."`);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMine = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.messageRowMine : styles.messageRowOther,
        ]}
      >
        {!isMine && (
          <View style={styles.senderAvatarContainer}>
            {item.senderAvatar ? (
              <Image
                source={{ uri: item.senderAvatar }}
                style={styles.senderAvatar}
              />
            ) : (
              <View style={styles.senderAvatarPlaceholder}>
                <Text style={styles.senderAvatarLetter}>
                  {item.senderName
                    ? item.senderName.charAt(0).toUpperCase()
                    : 'U'}
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => {
            setSelectedMessage(item);
            setOptionsModalVisible(true);
          }}
          style={[
            styles.messageBubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
        >
          {/* Quoted Reply Preview inside bubble */}
          {Boolean(item.replyTo) && (
            <View
              style={[
                styles.quotedReplyContainer,
                isMine ? styles.quotedReplyMine : styles.quotedReplyOther,
              ]}
            >
              <Text
                style={[
                  styles.quotedSenderText,
                  isMine ? styles.quotedTextMine : styles.quotedTextOther,
                ]}
                numberOfLines={1}
              >
                {item.replyTo?.senderId === currentUserId
                  ? 'You'
                  : item.replyTo?.senderName}
              </Text>
              <Text
                style={[
                  styles.quotedMessageText,
                  isMine ? styles.quotedTextMine : styles.quotedTextOther,
                ]}
                numberOfLines={1}
              >
                {item.replyTo?.text}
              </Text>
            </View>
          )}

          {/* Message Text */}
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>

          {/* Time tag */}
          <Text
            style={[
              styles.messageTimeText,
              isMine ? styles.messageTimeMine : styles.messageTimeOther,
            ]}
          >
            {formatTimeAgo(item.createdAt)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderChatBody = () => (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesListContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyMessagesContainer}>
            <View style={styles.emptyAvatarWrap}>
              {targetUser?.avatar ? (
                <Image
                  source={{ uri: targetUser.avatar }}
                  style={styles.emptyAvatar}
                />
              ) : (
                <View style={styles.emptyAvatarPlaceholder}>
                  <Text style={styles.emptyAvatarLetter}>
                    {targetUser?.username
                      ? targetUser.username.charAt(0).toUpperCase()
                      : 'U'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.emptyName}>
              {targetUser?.fullName || targetUser?.username}
            </Text>
            <Text style={styles.emptyHandle}>@{targetUser?.username}</Text>
            <Text style={styles.emptyNotice}>
              Instagram · You follow each other
            </Text>
            <Text style={styles.emptySubtitle}>
              Say hi to start the conversation!
            </Text>
          </View>
        }
      />

      {/* Replying Banner */}
      {Boolean(replyingTo) && (
        <View style={styles.replyBanner}>
          <View style={styles.replyLeftBar} />
          <View style={styles.replyTextContainer}>
            <Text style={styles.replyingToHeader}>
              Replying to{' '}
              <Text style={styles.replyingToBold}>
                {replyingTo?.senderId === currentUserId
                  ? 'yourself'
                  : replyingTo?.senderName}
              </Text>
            </Text>
            <Text style={styles.replyingToSnippet} numberOfLines={1}>
              {replyingTo?.text}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={styles.replyCancelBtn}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.CLOSE}
              size={18}
              color={LIGHT_COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Bottom Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.cameraIconBtn}
          activeOpacity={0.7}
          onPress={() => showToast('Camera')}
        >
          <View style={styles.cameraCircle}>
            <Icon
              name={ICON_NAMES.CAMERA_OUTLINE}
              size={18}
              color={LIGHT_COLORS.white}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.inputPill}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor={LIGHT_COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            maxLength={1000}
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity
              style={styles.sendButton}
              activeOpacity={0.7}
              onPress={() => handleSend()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputRightIcons}>
              <TouchableOpacity
                style={styles.inputIconBtn}
                activeOpacity={0.7}
                onPress={() => showToast('Voice note')}
              >
                <Icon
                  name={ICON_NAMES.MIC_OUTLINE}
                  size={20}
                  color={LIGHT_COLORS.black}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputIconBtn}
                activeOpacity={0.7}
                onPress={() => showToast('Send photo')}
              >
                <Icon
                  name={ICON_NAMES.IMAGE_OUTLINE}
                  size={20}
                  color={LIGHT_COLORS.black}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputIconBtn}
                activeOpacity={0.7}
                onPress={() => handleSend('❤️')}
              >
                <Icon
                  name={ICON_NAMES.HEART}
                  size={20}
                  color={LIGHT_COLORS.error}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </>
  );

  if (!visible || !targetUser) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar barStyle="dark-content" />

        {/* 1. Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Icon name={ICON_NAMES.BACK} size={24} color={LIGHT_COLORS.black} />
          </TouchableOpacity>

          <View style={styles.headerUserInfo}>
            <View style={styles.avatarWrap}>
              {targetUser.avatar ? (
                <Image
                  source={{ uri: targetUser.avatar }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarLetter}>
                    {targetUser.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {targetUser.fullName || targetUser.username}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                @{targetUser.username} · Active now
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.7}
              onPress={() => showToast(`Calling @${targetUser.username}...`)}
            >
              <Icon
                name={ICON_NAMES.CALL_OUTLINE}
                size={22}
                color={LIGHT_COLORS.black}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.7}
              onPress={() =>
                showToast(`Starting video call with @${targetUser.username}...`)
              }
            >
              <Icon
                name={ICON_NAMES.VIDEOCAM_OUTLINE}
                size={24}
                color={LIGHT_COLORS.black}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Chat Messages Area & Input Bar */}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={isIOS ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {renderChatBody()}
        </KeyboardAvoidingView>

        {/* Message Options Action Sheet */}
        <Modal
          visible={optionsModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setOptionsModalVisible(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setOptionsModalVisible(false)}
          >
            <View style={styles.optionsOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.optionsSheet}>
                  <View style={styles.optionsHandle} />

                  {/* Quoted Message Preview in sheet */}
                  {selectedMessage && (
                    <View style={styles.sheetPreviewWrap}>
                      <Text style={styles.sheetPreviewText} numberOfLines={2}>
                        "{selectedMessage.text}"
                      </Text>
                    </View>
                  )}

                  {/* Reply */}
                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => {
                      if (selectedMessage) handleReplyPress(selectedMessage);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ICON_NAMES.REPLY_OUTLINE}
                      size={22}
                      color={LIGHT_COLORS.black}
                    />
                    <Text style={styles.sheetOptionText}>Reply</Text>
                  </TouchableOpacity>

                  {/* Copy */}
                  <TouchableOpacity
                    style={styles.sheetOption}
                    onPress={() => {
                      if (selectedMessage) handleCopyText(selectedMessage.text);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ICON_NAMES.COPY_OUTLINE}
                      size={20}
                      color={LIGHT_COLORS.black}
                    />
                    <Text style={styles.sheetOptionText}>Copy</Text>
                  </TouchableOpacity>

                  {/* Delete / Unsend: strictly only for sender's own message! */}
                  {selectedMessage?.senderId === currentUserId && (
                    <TouchableOpacity
                      style={styles.sheetOption}
                      onPress={() => {
                        if (selectedMessage) handleDeletePress(selectedMessage);
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={ICON_NAMES.TRASH}
                        size={21}
                        color={LIGHT_COLORS.error}
                      />
                      <Text
                        style={[
                          styles.sheetOptionText,
                          { color: LIGHT_COLORS.error },
                        ]}
                      >
                        Unsend message
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.sheetCancelBtn}
                    onPress={() => setOptionsModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
    backgroundColor: LIGHT_COLORS.white,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  headerAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarLetter: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  headerTextWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  headerSubtitle: {
    fontSize: scale.ms(11.5),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
    fontFamily: FONT_STYLES.regular
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 6,
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  messagesListContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyAvatarWrap: {
    marginBottom: 12,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  emptyAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: LIGHT_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAvatarLetter: {
    fontSize: FONT_SIZES.huge,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  emptyName: {
    fontSize: scale.ms(17),
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  emptyHandle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 2,
    fontFamily: FONT_STYLES.regular
  },
  emptyNotice: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 8,
    fontFamily: FONT_STYLES.regular
  },
  emptySubtitle: {
    fontSize: scale.ms(13.5),
    color: LIGHT_COLORS.brandBlue,
    fontFamily: FONT_STYLES.medium,
    marginTop: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  senderAvatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  senderAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: LIGHT_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatarLetter: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  messageBubble: {
    maxWidth: METRICS.WIDTH * 0.72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: LIGHT_COLORS.unread_dot,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: LIGHT_COLORS.action_btn,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    fontFamily: FONT_STYLES.regular
  },
  messageTextMine: {
    color: LIGHT_COLORS.white,
    fontFamily: FONT_STYLES.regular
  },
  messageTextOther: {
    color: LIGHT_COLORS.black,
    fontFamily: FONT_STYLES.regular
  },
  messageTimeText: {
    fontSize: scale.ms(9.5),
    marginTop: 4,
    alignSelf: 'flex-end',
    textTransform: 'uppercase',
  },
  messageTimeMine: {
    color: LIGHT_COLORS.msg_text,
    fontFamily: FONT_STYLES.regular
  },
  messageTimeOther: {
    color: LIGHT_COLORS.textSecondary,
    fontFamily: FONT_STYLES.regular
  },
  quotedReplyContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  quotedReplyMine: {
    backgroundColor: LIGHT_COLORS.reply_1,
    borderLeftColor: LIGHT_COLORS.white,
  },
  quotedReplyOther: {
    backgroundColor: LIGHT_COLORS.reply_2,
    borderLeftColor: LIGHT_COLORS.unread_dot,
  },
  quotedSenderText: {
    fontSize: scale.ms(11),
    fontFamily: FONT_STYLES.bold,
    marginBottom: 1,
  },
  quotedMessageText: {
    fontSize: scale.ms(11.5),
    fontFamily: FONT_STYLES.regular
  },
  quotedTextMine: {
    color: LIGHT_COLORS.white,
    fontFamily: FONT_STYLES.regular
  },
  quotedTextOther: {
    color: LIGHT_COLORS.black,
    fontFamily: FONT_STYLES.regular
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.bg_3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_COLORS.border,
  },
  replyLeftBar: {
    width: 3,
    height: '100%',
    backgroundColor: LIGHT_COLORS.unread_dot,
    borderRadius: 2,
    marginRight: 10,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyingToHeader: {
    fontSize: scale.ms(11.5),
    color: LIGHT_COLORS.textSecondary,
    fontFamily: FONT_STYLES.regular
  },
  replyingToBold: {
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.black,
  },
  replyingToSnippet: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.black,
    marginTop: 1,
    fontFamily: FONT_STYLES.regular
  },
  replyCancelBtn: {
    padding: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_COLORS.avatar_bg,
    backgroundColor: LIGHT_COLORS.white,
  },
  cameraIconBtn: {
    marginRight: 10,
  },
  cameraCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LIGHT_COLORS.unread_dot,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.action_btn,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: isIOS ? 6 : 2,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    maxHeight: 90,
    paddingTop: 6,
    paddingBottom: 6,
    fontFamily: FONT_STYLES.regular
  },
  sendButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sendButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    color: LIGHT_COLORS.brandBlue,
  },
  inputRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIconBtn: {
    padding: 5,
    marginLeft: 4,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.overlay_2,
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: LIGHT_COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  optionsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIGHT_COLORS.bg_4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetPreviewWrap: {
    backgroundColor: LIGHT_COLORS.avatar_bg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  sheetPreviewText: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    fontStyle: 'italic',
    fontFamily: FONT_STYLES.light
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
  },
  sheetOptionText: {
    fontSize: scale.ms(15),
    fontFamily: FONT_STYLES.medium,
    color: LIGHT_COLORS.black,
    marginLeft: 14,
  },
  sheetCancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  sheetCancelText: {
    fontSize: scale.ms(15),
    fontFamily: FONT_STYLES.medium,
    color: LIGHT_COLORS.textSecondary,
  },
});
