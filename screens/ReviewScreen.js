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
  const [incorrectVocabs, setIncorrectVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [options, setOptions] = useState([]);

  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    loadVocabs();
  }, []);

  useEffect(() => {
    if (vocabs.length > 0 && currentIndex < vocabs.length) {
      generateOptions();
    }
  }, [currentIndex, vocabs]);

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

  const generateOptions = () => {
    if (!vocabs[currentIndex]) return;

    const currentVocab = vocabs[currentIndex].vocabId;
    if (!currentVocab) return;

    const correctAnswer = currentVocab.meaning;

    // Lấy 3 đáp án sai từ các từ khác
    const wrongAnswers = vocabs
        .filter((v, idx) => idx !== currentIndex && v.vocabId)
        .map(v => v.vocabId.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    // Trộn đáp án đúng vào
    const allOptions = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

    setOptions(allOptions);
  };

  const handleAnswerSelect = async (answer) => {
    if (showResult) return;

    const currentVocab = vocabs[currentIndex].vocabId;
    if (!currentVocab) return;

    const correct = answer === currentVocab.meaning;

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);

    // Hiệu ứng rung nếu sai
    if (!correct) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Thêm vào danh sách cần ôn lại (chỉ thêm nếu chưa có)
      const isDuplicate = incorrectVocabs.some(
          v => v.vocabId._id === currentVocab._id
      );
      if (!isDuplicate) {
        setIncorrectVocabs(prev => [...prev, vocabs[currentIndex]]);
      }
    }

    // Gửi kết quả lên server
    try {
      await learningAPI.updateProgress(currentVocab._id, correct);
    } catch (error) {
      console.error('Không thể cập nhật tiến trình:', error);
    }

    // Tự động chuyển sang câu tiếp theo sau 1.5s
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    // Hiệu ứng fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex >= vocabs.length - 1) {
        // Nếu còn từ sai, cho ôn lại
        if (incorrectVocabs.length > 0) {
          const vocabsToReview = [...incorrectVocabs];
          Alert.alert(
              'Ôn tập lại',
              `Bạn còn ${vocabsToReview.length} từ cần ôn lại. Hãy cố gắng nhé!`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIncorrectVocabs([]);
                    setCurrentIndex(0);
                    setVocabs(vocabsToReview);
                    setSelectedAnswer(null);
                    setShowResult(false);
                    setIsCorrect(false);
                    fadeAnim.setValue(1);
                  },
                },
              ]
          );
        } else {
          Alert.alert('Hoàn thành', 'Bạn đã ôn tập xong! 🎉', [
            { text: 'OK', onPress: () => loadVocabs() },
          ]);
        }
      } else {
        setCurrentIndex(currentIndex + 1);
        resetCard();
      }
    });
  };

  const resetCard = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getOptionStyle = (option) => {
    if (!showResult) {
      return selectedAnswer === option ? styles.optionSelected : styles.option;
    }

    const currentVocab = vocabs[currentIndex]?.vocabId;
    if (!currentVocab) return styles.option;

    if (option === currentVocab.meaning) {
      return styles.optionCorrect;
    }
    if (option === selectedAnswer && !isCorrect) {
      return styles.optionWrong;
    }
    return styles.optionDisabled;
  };

  const getOptionTextStyle = (option) => {
    if (!showResult) {
      return selectedAnswer === option ? styles.optionTextSelected : styles.optionText;
    }

    const currentVocab = vocabs[currentIndex]?.vocabId;
    if (!currentVocab) return styles.optionText;

    if (option === currentVocab.meaning) {
      return styles.optionTextCorrect;
    }
    if (option === selectedAnswer && !isCorrect) {
      return styles.optionTextWrong;
    }
    return styles.optionTextDisabled;
  };

  if (loading) {
    return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Đang tải...</Text>
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

  const currentVocab = vocabs[currentIndex]?.vocabId;
  if (!currentVocab) {
    return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
    );
  }

  const totalVocabs = vocabs.length + incorrectVocabs.length;
  const progress = ((currentIndex + incorrectVocabs.length) / totalVocabs) * 100;

  return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View
              style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>

        <Text style={styles.counter}>
          {currentIndex + 1} / {vocabs.length}
          {incorrectVocabs.length > 0 && (
              <Text style={styles.incorrectCount}> ({incorrectVocabs.length} cần ôn lại)</Text>
          )}
        </Text>

        <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
        >
          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>Nghĩa của từ này là gì?</Text>
            <Text style={styles.wordText}>{currentVocab.word}</Text>
            {currentVocab.pronunciation && (
                <Text style={styles.phonetic}>{currentVocab.pronunciation}</Text>
            )}
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
                <TouchableOpacity
                    key={index}
                    style={getOptionStyle(option)}
                    onPress={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionNumber}>{String.fromCharCode(65 + index)}.</Text>
                    <Text style={getOptionTextStyle(option)}>{option}</Text>
                  </View>
                  {showResult && option === currentVocab.meaning && (
                      <Text style={styles.checkIcon}>✓</Text>
                  )}
                  {showResult && option === selectedAnswer && !isCorrect && (
                      <Text style={styles.crossIcon}>✗</Text>
                  )}
                </TouchableOpacity>
            ))}
          </View>

          {showResult && (
              <Animated.View style={styles.resultContainer}>
                {isCorrect ? (
                    <View style={styles.resultCorrect}>
                      <Text style={styles.resultIcon}>🎉</Text>
                      <Text style={styles.resultText}>Chính xác!</Text>
                    </View>
                ) : (
                    <View style={styles.resultWrong}>
                      <Text style={styles.resultIcon}>💪</Text>
                      <Text style={styles.resultText}>Ôn lại nhé!</Text>
                      {currentVocab.example && (
                          <Text style={styles.exampleText}>
                            Ví dụ: {currentVocab.example}
                          </Text>
                      )}
                    </View>
                )}
              </Animated.View>
          )}
        </Animated.View>
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
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 20,
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
    transition: 'width 0.3s ease',
  },
  counter: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 20,
    fontSize: 14,
  },
  incorrectCount: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  wordText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  phonetic: {
    fontSize: 18,
    color: '#6B7280',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionDisabled: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 12,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  optionTextSelected: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
    flex: 1,
  },
  optionTextCorrect: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    flex: 1,
  },
  optionTextWrong: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  optionTextDisabled: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  checkIcon: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: 'bold',
  },
  crossIcon: {
    fontSize: 24,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultCorrect: {
    alignItems: 'center',
  },
  resultWrong: {
    alignItems: 'center',
  },
  resultIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});