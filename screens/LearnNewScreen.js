import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { vocabularyAPI, learningAPI } from '../services/api';

const LIMIT = 10; // Số từ load mỗi lần
const PRELOAD_THRESHOLD = 5; // Load thêm khi còn 5 từ

export default function LearnNewScreen({ navigation, route }) {
  const { topicId, topicName } = route.params || {};
  const [vocabs, setVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalVocabs, setTotalVocabs] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadVocabs();
  }, []);

  useEffect(() => {
    if (topicName) {
      navigation.setOptions({ title: topicName });
    }
  }, [topicName]);

  useEffect(() => {

    const remainingWords = vocabs.length - currentIndex;
    console.log('Current index:', currentIndex, 'Remaining words:', remainingWords);
    if (!loading && (remainingWords <= PRELOAD_THRESHOLD) && hasMore && !isLoadingMore) {
      loadMoreVocabs();
    }
  }, [currentIndex, loading]);

  const loadVocabs = async () => {
    try {
      const data = await vocabularyAPI.getNewVocabs(LIMIT, null, topicId);
      console.log('Fetched vocabularies:', data);

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
      console.log('Loading more vocabs, skip:', vocabs.length);

      const data = await vocabularyAPI.getNewVocabs(LIMIT, null, topicId, vocabs.length);
      console.log('Loaded more vocabularies:', data);

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
    console.log('Flip button pressed, current state:', isFlipped);
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: false,
    }).start(() => {
      console.log('Animation completed, new state:', !isFlipped);
    });
  };

  const handleResponse = async (quality) => {
    try {
      const currentVocab = vocabs[currentIndex];
      console.log(currentVocab)
      await learningAPI.startLearning(currentVocab._id, quality);

      // Check if finished all available vocabs
      if (currentIndex >= vocabs.length - 1 && !hasMore) {
        Alert.alert('Hoàn thành', 'Bạn đã học hết tất cả từ trong chủ đề này!', [
          {
            text: 'OK',
            onPress:  () => {
              // Navigate to Home and trigger reload stats in HomeScreen
              navigation.navigate('HomeTab', { reloadStats: true });
            }
          },
        ]);
        return;
      }

      // Move to next word
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
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
        {/* Progress bar based on total vocabs in topic */}
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
          <Animated.View
              style={[
                styles.card,
                styles.cardFront,
                frontAnimatedStyle,
                { zIndex: isFlipped ? 0 : 1 }
              ]}
          >
            <Text style={styles.wordText}>{currentVocab.word}</Text>
            <View style={styles.metaContainer}>
              {currentVocab.partOfSpeech && (
                <Text style={styles.partOfSpeech}>
                  {currentVocab.partOfSpeech}
                </Text>
              )}
              {currentVocab.cefrLevel && (
                <Text style={styles.cefrLevel}>
                  {currentVocab.cefrLevel}
                </Text>
              )}
            </View>
            <Text style={styles.phonetic}>
              {currentVocab.pronunciation || '...'}
            </Text>
            <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
              <Text style={styles.flipButtonText}>Xem nghĩa ›</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                backAnimatedStyle,
                { zIndex: isFlipped ? 1 : 0 }
              ]}
          >
            <Text style={styles.meaningText}>{currentVocab.meaning}</Text>
            <Text style={styles.exampleText}>
              {currentVocab.examples[0].sentence || 'Không có ví dụ'}
            </Text>
            <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
              <Text style={[styles.flipButtonText, { color: '#FFFFFF' }]}>
                Xem từ ›
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

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
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
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
    color: '#4F46E5',
    fontStyle: 'italic',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    perspective: 1000,
  },
  card: {
    width: '100%',
    aspectRatio: 1.5,
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  cardBack: {
    backgroundColor: '#4F46E5',
    transform: [{ rotateY: '180deg' }],
    zIndex: 0,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  phonetic: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  meaningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  exampleText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  flipButton: {
    padding: 8,
  },
  flipButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    margin: 4,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});