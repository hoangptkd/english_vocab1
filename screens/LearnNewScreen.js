import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  Dimensions,
    ToastAndroid, // Thêm cái này để hiện thông báo trên Android cho mượt
    Platform,     // Để check hệ điều hành
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { vocabularyAPI, learningAPI } from '../services/api';
// THÊM DÒNG NÀY
import { AudioButton, AutoDownloadAudio } from '../components/AudioButton';
import AudioService from '../services/AudioService';
const LIMIT = 10;
const PRELOAD_THRESHOLD = 5;
const { width } = Dimensions.get('window');

// Color mapping for different parts of speech
const POS_COLORS = {
  noun: { gradient: ['#8B5CF6', '#6366F1'], badge: '#8B5CF6' },
  verb: { gradient: ['#EC4899', '#F43F5E'], badge: '#EC4899' },
  adjective: { gradient: ['#10B981', '#14B8A6'], badge: '#10B981' },
  adverb: { gradient: ['#F59E0B', '#F97316'], badge: '#F59E0B' },
  preposition: { gradient: ['#3B82F6', '#6366F1'], badge: '#3B82F6' },
  conjunction: { gradient: ['#EF4444', '#DC2626'], badge: '#EF4444' },
  pronoun: { gradient: ['#06B6D4', '#0EA5E9'], badge: '#06B6D4' },
  interjection: { gradient: ['#8B5CF6', '#A855F7'], badge: '#8B5CF6' },
  phrase: { gradient: ['#6366F1', '#818CF8'], badge: '#6366F1' },
  default: { gradient: ['#6B7280', '#4B5563'], badge: '#6B7280' },
};

export default function LearnNewScreen({ navigation, route }) {
  const { topicId, topicName } = route.params || {};
  const [vocabs, setVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalVocabs, setTotalVocabs] = useState(0);
  const [selectedPosIndex, setSelectedPosIndex] = useState(0);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const posSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVocabs();
      return () => {
          AudioService.stop();
      };
  }, []);

  useEffect(() => {
    if (topicName) {
      navigation.setOptions({ title: topicName });
    }
  }, [topicName]);

  useEffect(() => {
    const remainingWords = vocabs.length - currentIndex;
    if (!loading && remainingWords <= PRELOAD_THRESHOLD && hasMore && !isLoadingMore) {
      loadMoreVocabs();
    }
  }, [currentIndex, loading]);

  // Reset selected POS when moving to next word
  useEffect(() => {
    setSelectedPosIndex(0);
    posSlideAnim.setValue(0);
  }, [currentIndex]);
    const handleCopy = async (text) => {
        await Clipboard.setStringAsync(text);

        // Hiển thị thông báo nhẹ nhàng
        if (Platform.OS === 'android') {
            ToastAndroid.show('Đã sao chép: ' + text, ToastAndroid.SHORT);
        } else {
            // Với iOS dùng Alert hoặc thư viện Toast khác nếu có
            Alert.alert('Đã sao chép', text);
        }
    };
  const loadVocabs = async () => {
    try {
      const data = await vocabularyAPI.getNewVocabs(LIMIT, null, topicId);
      const vocabularies = data.words || data;
      const vocabArray = Array.isArray(vocabularies) ? vocabularies : [];

      setVocabs(vocabArray);
      setTotalVocabs(data.total || vocabArray.length);
      setHasMore(vocabArray.length < (data.total || vocabArray.length));
      setLoading(false);
    } catch (error) {
      console.error('Error loading vocabs:', error);
      Alert.alert('Lỗi', 'Không thể tải từ vựng');
      setLoading(false);
    }
  };

  const loadMoreVocabs = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const data = await vocabularyAPI.getNewVocabs(LIMIT, null, topicId, vocabs.length);
      const vocabularies = data.words || data;
      const vocabArray = Array.isArray(vocabularies) ? vocabularies : [];

      if (vocabArray.length > 0) {
        setVocabs(prevVocabs => [...prevVocabs, ...vocabArray]);
        setHasMore(vocabs.length + vocabArray.length < (data.total || totalVocabs));
      } else {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    } catch (error) {
      console.error('Error loading more vocabs:', error);
      setIsLoadingMore(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: false,
    }).start();
  };

  const handlePosChange = (index) => {
    setSelectedPosIndex(index);

    // Animate slide transition
    Animated.spring(posSlideAnim, {
      toValue: index,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleResponse = async (quality) => {
    try {
      const currentVocab = vocabs[currentIndex];
      await learningAPI.startLearning(currentVocab._id, quality);

      if (currentIndex >= vocabs.length - 1 && !hasMore) {
        Alert.alert('Hoàn thành', 'Bạn đã học hết tất cả từ trong chủ đề này!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('HomeTab', { reloadStats: true });
            }
          },
        ]);
        return;
      }

      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
      setSelectedPosIndex(0);
      posSlideAnim.setValue(0);
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tiến trình');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (vocabs.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Không có từ mới trong chủ đề này</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentVocab = vocabs[currentIndex];
  const partsOfSpeech = currentVocab.partOfSpeech || [];
  console.log(currentVocab);
  const currentPos = partsOfSpeech[selectedPosIndex] || {};
  const posType = currentPos.type || 'default';
  const colors = POS_COLORS[posType] || POS_COLORS.default;

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / totalVocabs) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counter}>
          {currentIndex + 1} / {totalVocabs}
        </Text>
        {isLoadingMore && (
          <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
        )}
      </View>

      <View style={styles.cardContainer}>
        {/* Front of card - Word display */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={flipCard}
          style={{ width: '100%', minHeight: 400, position: 'absolute', zIndex: isFlipped ? 0 : 1 }}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              frontAnimatedStyle,
            ]}
          >
          {/* 1. Tự động tải audio cho từ hiện tại để bộ nhớ đệm sẵn sàng */}
          <AutoDownloadAudio word={currentVocab.word} />

          {/* 2. Gom từ vựng và nút loa vào 1 hàng */}
              {/* --- BẮT ĐẦU PHẦN SỬA ĐỔI --- */}
              <View style={styles.wordRowContainer}>
                  {/* Container chứa text để canh lề dọc */}
                  <TouchableOpacity
                      onPress={() => handleCopy(currentVocab.word)}
                      activeOpacity={0.6}
                  >
                      <View style={styles.textColumnContainer}>
                          {(() => {
                              const parts = currentVocab.word.split(' - ');
                              const hasKanji = parts.length > 1;
                              const mainText = hasKanji ? parts[1] : parts[0];
                              const subText = hasKanji ? parts[0] : null;

                              return (
                                  <>
                                      <Text style={styles.wordText}>{mainText}</Text>
                                      {subText && (
                                          <Text style={styles.subWordText}>({subText})</Text>
                                      )}
                                  </>
                              );
                          })()}
                      </View>
                  </TouchableOpacity>

                  <AudioButton
                      word={currentVocab.word}
                      size="medium"
                      style={styles.audioBtn}
                  />
              </View>
            {/* Part of Speech Pills */}
            {partsOfSpeech.length > 0 && (
              <View style={styles.posPillsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.posPillsContent}
                >
                  {partsOfSpeech.map((pos, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={(e) => {
                        e.stopPropagation();
                        handlePosChange(index);
                      }}
                      style={[
                        styles.posPill,
                        selectedPosIndex === index && styles.posPillActive,
                        {
                          backgroundColor: selectedPosIndex === index
                            ? (POS_COLORS[pos.type] || POS_COLORS.default).badge
                            : '#E5E7EB'
                        }
                      ]}
                    >
                      <Text style={[
                        styles.posPillText,
                        selectedPosIndex === index && styles.posPillTextActive
                      ]}>
                        {pos.type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {partsOfSpeech.length > 1 && (
                  <Text style={styles.posCounter}>
                    {selectedPosIndex + 1}/{partsOfSpeech.length}
                  </Text>
                )}
              </View>
            )}

            {/* CEFR Level Badge */}
            {currentVocab.cefrLevel && (
              <View style={styles.cefrBadge}>
                <Text style={styles.cefrText}>{currentVocab.cefrLevel}</Text>
              </View>
            )}

            {/* Pronunciation */}
            <Text style={styles.phonetic}>
              {currentPos.pronunciation || '...'}
            </Text>

            <Text style={styles.tapHint}>Nhấn để xem nghĩa</Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Back of card - Meaning and Examples */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={flipCard}
          style={{ width: '100%', minHeight: 400, position: 'absolute', zIndex: isFlipped ? 1 : 0 }}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              backAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ScrollView
                style={styles.backContent}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.backContentContainer}
              >
                {/* Part of Speech Badge */}
                <View style={styles.posTypeBadge}>
                  <Text style={styles.posTypeText}>{posType}</Text>
                </View>

                {/* Meaning */}
                <Text style={styles.meaningText}>
                  {currentPos.meaning || 'Không có nghĩa'}
                </Text>

                {/* Examples */}
                {currentPos.examples && currentPos.examples.length > 0 && (
                  <View style={styles.examplesContainer}>
                    <Text style={styles.examplesTitle}>Ví dụ:</Text>
                    {currentPos.examples.map((example, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.exampleItem}
                            onPress={() => handleCopy(example.sentence)}
                            onLongPress={() => handleCopy(example.translation)} // Giữ lâu để copy nghĩa tiếng Việt
                            activeOpacity={0.7}
                        >
                            <Text style={styles.exampleSentence}>
                                • {example.sentence}
                            </Text>
                            {example.translation && (
                                <Text style={styles.exampleTranslation}>
                                    → {example.translation}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>

              <Text style={styles.tapHintBack}>Nhấn để xem từ</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Response buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.hardButton]}
          onPress={() => handleResponse(1)}
        >
          <Text style={styles.buttonText}>Khó (1)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.okButton]}
          onPress={() => handleResponse(3)}
        >
          <Text style={styles.buttonText}>Tạm (3)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.easyButton]}
          onPress={() => handleResponse(5)}
        >
          <Text style={styles.buttonText}>Dễ (5)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  counter: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 12,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    perspective: 1000,
  },
  card: {
    width: '100%',
    minHeight: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
  },
  cardBack: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  gradientCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
// THÊM STYLE MỚI
    wordRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 12, // Khoảng cách giữa chữ và loa
        flexWrap: 'wrap', // Xuống dòng nếu từ quá dài
    },
    audioBtn: {
        // Tinh chỉnh vị trí nếu cần
        marginTop: 4,
    },

    // SỬA STYLE CŨ (Xóa marginBottom ở đây vì đã có ở container)
    wordText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        // marginBottom: 16, <--- XÓA HOẶC COMMENT DÒNG NÀY
    },
  posPillsContainer: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  posPillsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  posPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  posPillActive: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    transform: [{ scale: 1.05 }],
  },
  posPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  posPillTextActive: {
    color: '#FFFFFF',
  },
  posCounter: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  cefrBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  cefrText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  phonetic: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 16,
    fontStyle: 'italic',
  },
  tapHintBack: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backContent: {
    flex: 1,
    width: '100%',
  },
  backContentContainer: {
    alignItems: 'center',
  },
  posTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  posTypeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  meaningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 32,
  },
  examplesContainer: {
    width: '100%',
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    opacity: 0.9,
  },
  exampleItem: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  exampleSentence: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
    fontStyle: 'italic',
    paddingLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  hardButton: {
    backgroundColor: '#EF4444',
  },
  okButton: {
    backgroundColor: '#F59E0B',
  },
  easyButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});