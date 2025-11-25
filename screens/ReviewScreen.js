import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { vocabularyAPI, learningAPI } from '../services/api';
import {AudioButton, AutoDownloadAudio} from '../components/AudioButton';
import AudioService from '../services/AudioService';

// ============= QUIZ METHOD CONFIGURATIONS =============
const QUIZ_METHODS = {
  MULTIPLE_CHOICE_WORD_TO_MEANING: {
    id: 'mc_word_meaning',
    name: 'Trắc nghiệm: Word → Meaning',
    difficulty: 1,
    description: 'Chọn nghĩa đúng của từ',
    minRepetition: 0,
    autoPlayAudio: true, // Tự động phát âm khi hiển thị
  },
  MULTIPLE_CHOICE_MEANING_TO_WORD: {
    id: 'mc_meaning_word',
    name: 'Trắc nghiệm: Meaning → Word',
    difficulty: 2,
    description: 'Chọn từ đúng theo nghĩa',
    minRepetition: 2,
    autoPlayAudio: false, // Không tự động phát (người dùng nhấn button)
  },
  FILL_IN_BLANK: {
    id: 'fill_blank',
    name: 'Điền từ',
    difficulty: 3,
    description: 'Điền từ vào chỗ trống',
    minRepetition: 4,
    autoPlayAudio: false,
  },
  SENTENCE_COMPLETION: {
    id: 'sentence_completion',
    name: 'Hoàn thành câu',
    difficulty: 4,
    description: 'Viết từ đúng trong câu',
    minRepetition: 6,
    autoPlayAudio: false,
  },
};

// ============= QUIZ METHOD SELECTOR =============
const selectQuizMethod = (repetitionCount, availableMethods = null) => {
  const methods = availableMethods || Object.values(QUIZ_METHODS).filter(m => !m.isExtension);

  const eligibleMethods = methods.filter(
      method => repetitionCount >= method.minRepetition
  );

  if (eligibleMethods.length === 0) {
    return methods[0];
  }

  return eligibleMethods[Math.floor(Math.random() * eligibleMethods.length)];
};

// ============= QUIZ GENERATORS =============
const QuizGenerators = {
  [QUIZ_METHODS.MULTIPLE_CHOICE_WORD_TO_MEANING.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;
    const correctAnswer = currentVocab.meaning;

    const wrongAnswers = vocabs
        .filter((v, idx) => idx !== currentIndex && v.vocabId)
        .map(v => v.vocabId.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    const options = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

    return {
      question: currentVocab.word,
      questionLabel: 'Nghĩa của từ này là gì?',
      options,
      correctAnswer,
      hint: currentVocab.pronunciation,
      type: 'multiple_choice',
      audioWord: currentVocab.word, // Từ cần phát âm
    };
  },

  [QUIZ_METHODS.MULTIPLE_CHOICE_MEANING_TO_WORD.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;
    const correctAnswer = currentVocab.word;

    const wrongAnswers = vocabs
        .filter((v, idx) => idx !== currentIndex && v.vocabId)
        .map(v => v.vocabId.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

    const options = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

    return {
      question: currentVocab.meaning,
      questionLabel: 'Từ tiếng Anh nào có nghĩa này?',
      options,
      correctAnswer,
      hint: currentVocab.pronunciation,
      type: 'multiple_choice',
      audioWord: currentVocab.word,
    };
  },

  [QUIZ_METHODS.FILL_IN_BLANK.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;
    let sentence = currentVocab.example || `The word means "${currentVocab.meaning}"`;

    const wordRegex = new RegExp(`\\b${currentVocab.word}\\b`, 'gi');
    const blankedSentence = sentence.replace(wordRegex, '______');

    return {
      question: blankedSentence,
      questionLabel: 'Điền từ vào chỗ trống',
      correctAnswer: currentVocab.word.toLowerCase(),
      hint: `Nghĩa: ${currentVocab.meaning}`,
      type: 'fill_blank',
      audioWord: currentVocab.word,
    };
  },

  [QUIZ_METHODS.SENTENCE_COMPLETION.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;

    let sentence = currentVocab.example;
    if (!sentence) {
      sentence = `I need to use the word that means "${currentVocab.meaning}" here: ______`;
    } else {
      const wordRegex = new RegExp(`\\b${currentVocab.word}\\b`, 'gi');
      sentence = sentence.replace(wordRegex, '______');
    }

    return {
      question: sentence,
      questionLabel: 'Viết từ đúng để hoàn thành câu',
      correctAnswer: currentVocab.word.toLowerCase(),
      hint: `${currentVocab.pronunciation || ''} - Nghĩa: ${currentVocab.meaning}`,
      type: 'sentence_completion',
      audioWord: currentVocab.word,
    };
  },
};

// ============= MAIN COMPONENT =============
export default function ReviewScreen() {
  const [vocabs, setVocabs] = useState([]);
  const [incorrectVocabs, setIncorrectVocabs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentMethod, setCurrentMethod] = useState(null);

  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    loadVocabs();

    // Cleanup audio khi unmount
    return () => {
      AudioService.stop();
    };
  }, []);

  useEffect(() => {
    if (vocabs.length > 0 && currentIndex < vocabs.length) {
      generateQuiz();
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

  const generateQuiz = () => {
    if (!vocabs[currentIndex]?.vocabId) return;

    const vocab = vocabs[currentIndex];
    const repetitionCount = vocab.repetitionCount || 0;

    const method = selectQuizMethod(repetitionCount);
    setCurrentMethod(method);

    const generator = QuizGenerators[method.id];
    if (generator) {
      const quiz = generator(vocabs, currentIndex);
      setCurrentQuiz(quiz);
    }
  };

  const checkAnswer = (userAnswer) => {
    if (!currentQuiz) return false;

    const correct = currentQuiz.correctAnswer.toLowerCase();
    const user = userAnswer.toLowerCase().trim();

    if (currentQuiz.type !== 'multiple_choice') {
      if (user === correct) return true;

      const normalizedCorrect = correct.replace(/[^\w]/g, '');
      const normalizedUser = user.replace(/[^\w]/g, '');
      return normalizedUser === normalizedCorrect;
    }

    return user === correct;
  };

  const handleAnswerSelect = async (answer) => {
    if (showResult) return;

    const currentVocab = vocabs[currentIndex].vocabId;
    if (!currentVocab) return;

    const correct = checkAnswer(answer);

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setShowResult(true);

    // 🔊 PHÁT ÂM THANH KHI CHỌN ĐÁP ÁN
    try {
      await AudioService.playSmart(currentQuiz.audioWord, { language: 'en-US' });
    } catch (error) {
      console.error('Audio playback failed:', error);
    }

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

    // Tự động chuyển sang câu tiếp theo
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu trả lời');
      return;
    }
    handleAnswerSelect(textAnswer);
  };

  const handleNext = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex >= vocabs.length - 1) {
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
                    resetCard();
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
    setTextAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // ============= RENDER HELPERS =============
  const renderMultipleChoice = () => {
    if (!currentQuiz?.options) return null;

    return (
        <View style={styles.optionsContainer}>
          {currentQuiz.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = showResult && option === currentQuiz.correctAnswer;
            const isWrongOption = showResult && isSelected && !isCorrect;

            let optionStyle = styles.option;
            let textStyle = styles.optionText;

            if (!showResult && isSelected) {
              optionStyle = styles.optionSelected;
              textStyle = styles.optionTextSelected;
            } else if (isCorrectOption) {
              optionStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
            } else if (isWrongOption) {
              optionStyle = styles.optionWrong;
              textStyle = styles.optionTextWrong;
            } else if (showResult) {
              optionStyle = styles.optionDisabled;
              textStyle = styles.optionTextDisabled;
            }

            return (
                <TouchableOpacity
                    key={index}
                    style={optionStyle}
                    onPress={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionNumber}>
                      {String.fromCharCode(65 + index)}.
                    </Text>
                    <Text style={textStyle}>{option}</Text>
                  </View>
                  {isCorrectOption && <Text style={styles.checkIcon}>✓</Text>}
                  {isWrongOption && <Text style={styles.crossIcon}>✗</Text>}
                </TouchableOpacity>
            );
          })}
        </View>
    );
  };

  const renderTextInput = () => {
    return (
        <View style={styles.textInputContainer}>
          <TextInput
              style={[
                styles.textInput,
                showResult && (isCorrect ? styles.textInputCorrect : styles.textInputWrong)
              ]}
              value={textAnswer}
              onChangeText={setTextAnswer}
              placeholder="Nhập câu trả lời..."
              placeholderTextColor="#9CA3AF"
              editable={!showResult}
              autoCapitalize="none"
              autoCorrect={false}
          />
          {!showResult && (
              <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleTextSubmit}
              >
                <Text style={styles.submitButtonText}>Trả lời</Text>
              </TouchableOpacity>
          )}
          {showResult && (
              <View style={styles.answerFeedback}>
                {isCorrect ? (
                    <Text style={styles.feedbackCorrect}>✓ Chính xác!</Text>
                ) : (
                    <View>
                      <Text style={styles.feedbackWrong}>✗ Chưa đúng</Text>
                      <Text style={styles.correctAnswerText}>
                        Đáp án: {currentQuiz.correctAnswer}
                      </Text>
                    </View>
                )}
              </View>
          )}
        </View>
    );
  };

  const renderQuiz = () => {
    if (!currentQuiz) return null;

    return (
        <>
          <View style={styles.questionCard}>
            <View style={styles.methodBadge}>
              <Text style={styles.methodBadgeText}>
                {currentMethod?.name}
              </Text>
              <Text style={styles.difficultyBadge}>
                {'⭐'.repeat(currentMethod?.difficulty || 1)}
              </Text>
            </View>

            <Text style={styles.questionLabel}>{currentQuiz.questionLabel}</Text>

            {/* 🔊 QUESTION WITH AUDIO BUTTON */}
            <View style={styles.questionWithAudio}>
              <Text style={styles.wordText}>{currentQuiz.question}</Text>
              <AudioButton
                  word={currentQuiz.audioWord}
                  language="en-US"
                  size="medium"
              />
            </View>

            {currentQuiz.hint && (
                <Text style={styles.phonetic}>{currentQuiz.hint}</Text>
            )}

            {/* 🔊 AUTO-PLAY AUDIO (nếu method yêu cầu) */}
              {currentMethod?.autoPlayAudio && (
                  <AutoDownloadAudio
                      word={currentQuiz.audioWord}
                      language="en-US"
                  />
              )}
          </View>

          {currentQuiz.type === 'multiple_choice'
              ? renderMultipleChoice()
              : renderTextInput()
          }
        </>
    );
  };

  // ============= MAIN RENDER =============
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
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.counter}>
          {currentIndex + 1} / {vocabs.length}
          {incorrectVocabs.length > 0 && (
              <Text style={styles.incorrectCount}>
                {' '}({incorrectVocabs.length} cần ôn lại)
              </Text>
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
          {renderQuiz()}

          {showResult && currentVocab.example && (
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
                      <Text style={styles.exampleText}>
                        Ví dụ: {currentVocab.example}
                      </Text>
                    </View>
                )}
              </Animated.View>
          )}
        </Animated.View>
      </View>
  );
}

// ============= STYLES =============
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
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  methodBadgeText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '600',
    marginRight: 8,
  },
  difficultyBadge: {
    fontSize: 10,
  },
  questionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  questionWithAudio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  phonetic: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
  textInputContainer: {
    gap: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },
  textInputCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  textInputWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  answerFeedback: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  feedbackCorrect: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
  },
  feedbackWrong: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
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