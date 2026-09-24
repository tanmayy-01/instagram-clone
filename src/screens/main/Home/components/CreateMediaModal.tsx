import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { showToast } from '@/components/toast';
import { createPost } from '@/services/postService';
import { createStory } from '@/services/storyService';
import { UserData } from '@/services/userService';

interface CreateMediaModalProps {
  visible: boolean;
  user: UserData | null;
  initialMode?: 'post' | 'story' | null;
  onClose: () => void;
  onPostCreated?: () => void;
  onStoryCreated?: () => void;
}

export const CreateMediaModal: React.FC<CreateMediaModalProps> = ({
  visible,
  user,
  initialMode: _initialMode = null,
  onClose,
  onPostCreated,
  onStoryCreated,
}) => {
  // Modal step: 'choose_type' | 'caption_step'
  const [step, setStep] = useState<'choose_type' | 'caption_step'>('choose_type');
  const [targetType, setTargetType] = useState<'post' | 'story'>('post');
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  // Pick/Capture image for Post (1:1 crop) or Story (9:16 crop)
  const handleSelectMedia = async (type: 'post' | 'story', fromCamera: boolean) => {
    try {
      const pickerMethod = fromCamera
        ? ImagePicker.openCamera
        : ImagePicker.openPicker;

      const isPost = type === 'post';
      const image = await pickerMethod({
        width: 1080,
        height: isPost ? 1080 : 1920,
        cropping: true,
        mediaType: 'photo',
        includeBase64: true,
        compressImageQuality: 0.75,
      });

      if (image) {
        setSelectedImage(image);
        setTargetType(type);
        setStep('caption_step');
      }
    } catch (err: any) {
      if (
        err?.code !== 'E_PICKER_CANCELLED' &&
        !String(err?.message || '').includes('cancelled')
      ) {
        console.warn('Image picker error:', err);
        showToast('Could not select photo');
      }
    }
  };

  // Publish Post or Story
  const handlePublish = async () => {
    if (!selectedImage || !user) return;

    setLoading(true);
    try {
      const photoUri = selectedImage.data
        ? `data:${selectedImage.mime || 'image/jpeg'};base64,${selectedImage.data}`
        : selectedImage.path;

      if (targetType === 'post') {
        const newPost = await createPost({
          userId: user.uid,
          username: user.username,
          userAvatar: user.profilePicUrl,
          mediaUri: photoUri,
          caption: caption.trim(),
        });

        if (newPost) {
          showToast('Post shared to feed');
          onPostCreated?.();
          handleReset();
        } else {
          showToast('Failed to create post');
        }
      } else {
        // Story
        const newStory = await createStory({
          userId: user.uid,
          username: user.username,
          userAvatar: user.profilePicUrl,
          mediaUri: photoUri,
          caption: caption.trim(),
        });

        if (newStory) {
          showToast('Added to your story (visible for 24h)');
          onStoryCreated?.();
          handleReset();
        } else {
          showToast('Failed to post story');
        }
      }
    } catch (error) {
      console.error('handlePublish error:', error);
      showToast('Could not share photo');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCaption('');
    setStep('choose_type');
    setLoading(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleReset}
    >
      <TouchableWithoutFeedback onPress={handleReset}>
        <View
          style={[
            styles.modalOverlay,
            step === 'caption_step' && styles.modalOverlayCenter,
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                step === 'caption_step' && styles.captionCardCenter,
              ]}
            >
              {/* Step 1: Choose Post or Story with Camera & Gallery for each */}
              {step === 'choose_type' && (
                <>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>Create New</Text>

                  {/* Section 1: Post Options */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Icon
                        name={ICON_NAMES.GRID}
                        size={20}
                        color={LIGHT_COLORS.black}
                      />
                      <View style={styles.sectionTitleBlock}>
                        <Text style={styles.sectionTitle}>Post</Text>
                        <Text style={styles.sectionSubtitle}>
                          Share square photo to feed & profile
                        </Text>
                      </View>
                    </View>

                    <View style={styles.buttonActionRow}>
                      {/* Post via Camera */}
                      <TouchableOpacity
                        style={styles.actionPill}
                        onPress={() => handleSelectMedia('post', true)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={ICON_NAMES.CAMERA_OUTLINE}
                          size={18}
                          color={LIGHT_COLORS.brandBlue}
                        />
                        <Text style={styles.actionPillText}>Camera</Text>
                      </TouchableOpacity>

                      {/* Post via Gallery */}
                      <TouchableOpacity
                        style={styles.actionPill}
                        onPress={() => handleSelectMedia('post', false)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={ICON_NAMES.IMAGE_OUTLINE}
                          size={18}
                          color={LIGHT_COLORS.brandBlue}
                        />
                        <Text style={styles.actionPillText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Section 2: Story Options */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <Icon
                        name={ICON_NAMES.PLUS}
                        size={22}
                        color={LIGHT_COLORS.black}
                      />
                      <View style={styles.sectionTitleBlock}>
                        <Text style={styles.sectionTitle}>Story</Text>
                        <Text style={styles.sectionSubtitle}>
                          Full-screen photo visible for 24 hours
                        </Text>
                      </View>
                    </View>

                    <View style={styles.buttonActionRow}>
                      {/* Story via Camera */}
                      <TouchableOpacity
                        style={styles.actionPill}
                        onPress={() => handleSelectMedia('story', true)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={ICON_NAMES.CAMERA_OUTLINE}
                          size={18}
                          color="#DD2A7B"
                        />
                        <Text style={[styles.actionPillText, styles.storyActionPillText]}>
                          Camera
                        </Text>
                      </TouchableOpacity>

                      {/* Story via Gallery */}
                      <TouchableOpacity
                        style={styles.actionPill}
                        onPress={() => handleSelectMedia('story', false)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={ICON_NAMES.IMAGE_OUTLINE}
                          size={18}
                          color="#DD2A7B"
                        />
                        <Text style={[styles.actionPillText, styles.storyActionPillText]}>
                          Gallery
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: Caption Modal In The Middle */}
              {step === 'caption_step' && (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                  <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                  >
                    {/* Centered Modal Header */}
                    <View style={styles.captionHeader}>
                      <TouchableOpacity
                        onPress={() => setStep('choose_type')}
                        activeOpacity={0.7}
                        style={styles.headerBtn}
                      >
                        <Text style={styles.backBtnText}>Back</Text>
                      </TouchableOpacity>

                      <View style={styles.headerTitleContainer}>
                        <Text style={styles.captionTitle}>
                          {targetType === 'post' ? 'New Post' : 'New Story'}
                        </Text>
                        <Text style={styles.captionSubtitle}>
                          {targetType === 'post'
                            ? 'Share to Feed'
                            : 'Visible for 24 hours'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={handlePublish}
                        disabled={loading}
                        activeOpacity={0.7}
                        style={styles.headerBtn}
                      >
                        {loading ? (
                          <ActivityIndicator
                            size="small"
                            color={LIGHT_COLORS.brandBlue}
                          />
                        ) : (
                          <Text style={styles.shareText}>Share</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Centered Image Preview */}
                    <View style={styles.imagePreviewContainer}>
                      {selectedImage && (
                        <Image
                          source={{ uri: selectedImage.path }}
                          style={
                            targetType === 'post'
                              ? styles.postPreviewImage
                              : styles.storyPreviewImage
                          }
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    {/* Caption Input */}
                    <View style={styles.captionInputContainer}>
                      <TextInput
                        style={styles.captionInput}
                        placeholder={
                          targetType === 'post'
                            ? 'Write a caption for your post...'
                            : 'Add a caption to your story (optional)...'
                        }
                        placeholderTextColor={LIGHT_COLORS.placeholder}
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={500}
                        autoFocus
                      />
                    </View>

                    {/* Bottom Share Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.mainShareButton,
                        targetType === 'story' && styles.storyShareButton,
                      ]}
                      onPress={handlePublish}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={LIGHT_COLORS.white}
                        />
                      ) : (
                        <Text style={styles.mainShareButtonText}>
                          {targetType === 'post'
                            ? 'Share to Feed'
                            : 'Share to Story (24h)'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </KeyboardAvoidingView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalContent: {
    backgroundColor: LIGHT_COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
  },
  captionCardCenter: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DBDBDB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleBlock: {
    marginLeft: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  buttonActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LIGHT_COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: LIGHT_COLORS.brandBlue,
    marginLeft: 6,
  },
  storyActionPillText: {
    color: '#DD2A7B',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_COLORS.textSecondary,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    marginBottom: 14,
  },
  headerBtn: {
    minWidth: 50,
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: LIGHT_COLORS.textSecondary,
  },
  captionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  captionSubtitle: {
    fontSize: 11,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  shareText: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.brandBlue,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    overflow: 'hidden',
  },
  postPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  storyPreviewImage: {
    width: 140,
    height: 220,
    borderRadius: 12,
  },
  captionInputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  captionInput: {
    fontSize: 14.5,
    color: LIGHT_COLORS.black,
    minHeight: 65,
    maxHeight: 110,
    textAlignVertical: 'top',
  },
  mainShareButton: {
    backgroundColor: LIGHT_COLORS.brandBlue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyShareButton: {
    backgroundColor: '#DD2A7B',
  },
  mainShareButtonText: {
    color: LIGHT_COLORS.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
});
