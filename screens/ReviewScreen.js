import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { vocabularyAPI, learningAPI } from '../services/api';

export default function ReviewScreen() {
  const [vocabs, setVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const flipAnim = new Animated.Value(0);

  useEffect(() => {
    loadVocabs();
  }, []);

  const loadVocabs = async () => {
    try {
      const data = await vocabularyAPI.getReviewVocabs();
      setVocabs(data);
      setLoading(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải từ vựng');
      setLoading(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleResponse = async (quality) => {
    if (currentIndex >= vocabs.length - 1) {
      Alert.alert('Hoàn thành', 'Bạn đã ôn tập xong!', [
        { text: 'OK', onPress: () => loadVocabs() },
      ]);
      return;
    }

    try {
      await learningAPI.updateProgress(vocabs[currentIndex].vocabId._id, quality);
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật tiến trình');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  if (vocabs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Chưa có từ nào cần ôn tập. Hãy quay lại sau nhé! 🎉
        </Text>
      </View>
    );
  }

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

  const currentVocab = vocabs[currentIndex].vocabId;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentIndex / vocabs.length) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.counter}>
        {currentIndex + 1} / {vocabs.length}
      </Text>

      <View style={styles.cardContainer}>
        <Animated.View
          style={[styles.card, styles.cardFront, frontAnimatedStyle]}
        >
          <Text style={styles.wordText}>{currentVocab.word}</Text>
          <Text style={styles.phonetic}>{currentVocab.pronunciation}</Text>
          <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
            <Text style={styles.flipButtonText}>Xem nghĩa ↺</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <Text style={styles.meaningText}>{currentVocab.meaning}</Text>
          <Text style={styles.exampleText}>{currentVocab.example}</Text>
          <TouchableOpacity style={styles.flipButton} onPress={flipCard}>
            <Text style={styles.flipButtonText}>Xem từ ↺</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.hardButton]}
          onPress={() => handleResponse(1)}
        >
          <Text style={styles.buttonText}>Quên (1)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.okButton]}
          onPress={() => handleResponse(3)}
        >
          <Text style={styles.buttonText}>Mơ hồ (3)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.easyButton]}
          onPress={() => handleResponse(5)}
        >
          <Text style={styles.buttonText}>Nhớ rõ (5)</Text>
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
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 20,
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
  counter: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  cardBack: {
    backgroundColor: '#4F46E5',
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
  },
  flipButton: {
    padding: 8,
  },
  flipButtonText: {
    color: '#4F46E5',
    fontSize: 16,
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
});