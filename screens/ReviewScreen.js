import React, { useState, useEffect, useRef  } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import api, { vocabularyAPI, learningAPI } from '../services/api';
import {AudioButton, AutoDownloadAudio} from '../components/AudioButton';
import AudioService from '../services/AudioService';
import { useNavigation } from '@react-navigation/native';

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
    minRepetition: 1,
    autoPlayAudio: false, // Không tự động phát (người dùng nhấn button)
  },
  FILL_IN_BLANK: {
    id: 'fill_blank',
    name: 'Điền từ',
    difficulty: 3,
    description: 'Điền từ vào chỗ trống',
    minRepetition: 3,
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
  [QUIZ_METHODS.MULTIPLE_CHOICE_WORD_TO_MEANING.id]: (vocabs, currentIndex, allLearning) => {
    const currentVocab = vocabs[currentIndex].vocabId;
      const correctAnswer = currentVocab.partOfSpeech[0]?.meaning;

    // note : cần sửa lại filter theo cùng partOfSpeech để tránh đáp án sai quá lạ
      let wrongAnswers = vocabs
          .filter((v, idx) => idx !== currentIndex && v.vocabId)
          .map(v => v.vocabId.partOfSpeech[0]?.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
    // nếu wrongAnswers không đủ 3 thì thêm các nghĩa khác từ currentVocab
      if (wrongAnswers.length < 3 && allLearning && allLearning.length > 0) {
          const numberNeeded = 3 - wrongAnswers.length;

          // Lọc allLearning để lấy các ứng viên:
          const additionalCandidates = allLearning
              .filter(l =>
                  l.vocabId &&
                  l.vocabId._id !== currentVocab._id &&
                  !wrongAnswers.includes(l.vocabId.partOfSpeech[0]?.meaning)
              )
              .map(l => l.vocabId.partOfSpeech[0]?.meaning);

          // Xáo trộn và lấy số lượng cần thiết
          const additionalAnswers = additionalCandidates
              .sort(() => Math.random() - 0.5)
              .slice(0, numberNeeded);

          // Gộp vào mảng wrongAnswers
          wrongAnswers = [...wrongAnswers, ...additionalAnswers];
      }
    const options = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

    return {
      question: currentVocab.word,
      questionLabel: 'Nghĩa của từ này là gì?',
      options,
      correctAnswer,
      hint: currentVocab.partOfSpeech[0]?.pronunciation,
      type: 'multiple_choice',
      audioWord: currentVocab.word, // Từ cần phát âm
    };
  },

  [QUIZ_METHODS.MULTIPLE_CHOICE_MEANING_TO_WORD.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;
    const correctAnswer = currentVocab.word;

    let wrongAnswers = vocabs
        .filter((v, idx) => idx !== currentIndex && v.vocabId)
        .map(v => v.vocabId.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    // 2. Lấy thêm từ allLearning nếu thiếu
      if (wrongAnswers.length < 3 && allLearning && allLearning.length > 0) {
          const numberNeeded = 3 - wrongAnswers.length;

          const additionalCandidates = allLearning
              .filter(l =>
                  l.vocabId &&
                  l.vocabId._id !== currentVocab._id &&
                  !wrongAnswers.includes(l.vocabId.word)
              )
              .map(l => l.vocabId.word);

          const additionalAnswers = additionalCandidates
              .sort(() => Math.random() - 0.5)
              .slice(0, numberNeeded);

          wrongAnswers = [...wrongAnswers, ...additionalAnswers];
      }
    const options = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

    return {
      question: currentVocab.partOfSpeech[0]?.meaning,
      questionLabel: 'Từ tiếng Anh nào có nghĩa này?',
      options,
      correctAnswer,
      hint: currentVocab.partOfSpeech[0]?.pronunciation,
      type: 'multiple_choice',
      audioWord: currentVocab.word,
    };
  },

  [QUIZ_METHODS.FILL_IN_BLANK.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;
    let sentence = currentVocab.partOfSpeech[0]?.examples[0]?.sentence || `The word means "${currentVocab.partOfSpeech[0]?.meaning}"`;

    const wordRegex = new RegExp(`\\b${currentVocab.word}\\b`, 'gi');
    const blankedSentence = sentence.replace(wordRegex, '______');

    return {
      question: blankedSentence,
      questionLabel: 'Điền từ vào chỗ trống',
      correctAnswer: currentVocab.word.toLowerCase(),
      hint: `Nghĩa: ${currentVocab.partOfSpeech[0]?.meaning}`,
      type: 'fill_blank',
      audioWord: currentVocab.word,
    };
  },

  [QUIZ_METHODS.SENTENCE_COMPLETION.id]: (vocabs, currentIndex) => {
    const currentVocab = vocabs[currentIndex].vocabId;

    let sentence = currentVocab.partOfSpeech[0]?.examples[0]?.sentence;
    if (!sentence) {
      sentence = `I need to use the word that means "${currentVocab.partOfSpeech[0]?.meaning}" here: ______`;
    } else {
      const wordRegex = new RegExp(`\\b${currentVocab.word}\\b`, 'gi');
      sentence = sentence.replace(wordRegex, '______');
    }

    return {
      question: sentence,
      questionLabel: 'Viết từ đúng để hoàn thành câu',
      correctAnswer: currentVocab.word.toLowerCase(),
      hint: `${currentVocab.partOfSpeech[0]?.pronunciation || ''} - Nghĩa: ${currentVocab.partOfSpeech[0]?.meaning}`,
      type: 'sentence_completion',
      audioWord: currentVocab.word,
    };
  },
};

// ============= MAIN COMPONENT =============
export default function ReviewScreen() {
    const navigation = useNavigation();
    const [vocabs, setVocabs] = useState([]);
    const [allLearning, setAllLearning] = useState([]);
    const [incorrectVocabs, setIncorrectVocabs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [currentMethod, setCurrentMethod] = useState(null);
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionType, setCompletionType] = useState(null); // 'success' hoặc 'retry'
    const [showHint, setShowHint] = useState(false);
// Dùng useRef để giữ nguyên Animated.Value giữa các lần render
    const completionFadeAnim = useRef(new Animated.Value(0)).current;
    const completionScaleAnim = useRef(new Animated.Value(0.5)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

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
      const learningData = await vocabularyAPI.getAllLearning();
      setVocabs(data);
      setAllLearning(learningData);
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
      const quiz = generator(vocabs, currentIndex, allLearning);
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
      await learningAPI.updateProgress(currentVocab._id, correct, currentMethod.id);
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
                setCompletionType('retry');
                showCompletionScreen();
            } else {
                setCompletionType('success');
                showCompletionScreen();
            }
        } else {
            setCurrentIndex(currentIndex + 1);
            resetCard();
        }
    });
  };

    const showCompletionScreen = () => {
        setShowCompletion(true);
        Animated.parallel([
            Animated.timing(completionFadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(completionScaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleCompletionAction = () => {
        Animated.parallel([
            Animated.timing(completionFadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(completionScaleAnim, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowCompletion(false);
            if (completionType === 'retry') {
                const vocabsToReview = [...incorrectVocabs];
                setIncorrectVocabs([]);
                setCurrentIndex(0);
                setVocabs(vocabsToReview);
                resetCard();
            } else {
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'MainTabs',
                            params: {
                                screen: 'HomeTab' // Tên tab bên trong BottomTabNavigator
                            }
                        }
                    ],
                });
            }
        });
    };

    const toggleHint = () => {
        setShowHint(prev => !prev);
    };
  const resetCard = () => {
    setSelectedAnswer(null);
    setTextAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setShowHint(false);
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

        // LƯU Ý: Khởi tạo logic tách từ vựng ngay tại đây
        const wordString = currentQuiz.question;
        const parts = wordString.split(' - ');
        const hasReading = parts.length > 1;
        const mainText = hasReading ? parts[1] : parts[0]; // Hiragana (hoặc Word gốc)
        const subText = hasReading ? parts[0] : null;      // Kanji (hoặc null)

        return (
            <>
                <View style={styles.questionCard}>
                    {/* ... code methodBadge/questionLabel cũ ... */}

                    <Text style={styles.questionLabel}>{currentQuiz.questionLabel}</Text>

                    {/* 🔊 QUESTION WITH AUDIO BUTTON VÀ 2 DÒNG TEXT */}
                    <View style={styles.questionWithAudio}>

                        {/* 1. KHỐI TEXT: Hiển thị 2 dòng nếu cần */}
                        <View style={styles.textColumnContainer}>
                            <Text style={styles.wordText}>{mainText}</Text>
                            {subText && (
                                <Text style={styles.subWordText}>({subText})</Text>
                            )}
                        </View>

                        {/* 2. NÚT AUDIO */}
                        <AudioButton
                            word={currentQuiz.audioWord}
                            size="medium"
                        />
                    </View>

                    {/* 3. HINT: Nút ẩn hiện và Text */}
                    <TouchableOpacity
                        onPress={toggleHint}
                        style={styles.hintButton}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.hintButtonText}>
                            {showHint ? 'Ẩn Gợi ý' : 'Bấm để xem Gợi ý'}
                        </Text>
                    </TouchableOpacity>

                    {/* 4. TEXT GỢI Ý (ẨN/HIỆN) */}
                    {currentQuiz.hint && showHint && (
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
    const renderCompletionScreen = () => {
        if (!showCompletion) return null;

        const isRetry = completionType === 'retry';

        return (
            <Animated.View
                style={[
                    styles.completionOverlay,
                    {
                        opacity: completionFadeAnim,
                    }
                ]}
            >
                <Animated.View
                    style={[
                        styles.completionCard,
                        {
                            transform: [{ scale: completionScaleAnim }]
                        }
                    ]}
                >
                    <Text style={styles.completionIcon}>
                        {isRetry ? '💪' : '🎉'}
                    </Text>

                    <Text style={styles.completionTitle}>
                        {isRetry ? 'Ôn tập lại' : 'Hoàn thành!'}
                    </Text>

                    <Text style={styles.completionMessage}>
                        {isRetry
                            ? `Bạn còn ${incorrectVocabs.length} từ cần ôn lại.\nHãy cố gắng nhé!`
                            : 'Bạn đã ôn tập xong!\nTuyệt vời! 🌟'
                        }
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.completionButton,
                            isRetry ? styles.completionButtonRetry : styles.completionButtonSuccess
                        ]}
                        onPress={handleCompletionAction}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.completionButtonText}>
                            {isRetry ? 'Ôn lại ngay' : 'Về trang chủ'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
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

                {showResult && currentVocab.partOfSpeech[0]?.examples[0]?.sentence && (
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
                                    Ví dụ: {currentVocab.partOfSpeech[0]?.examples[0]?.sentence}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </Animated.View>

            {/* ĐẶT Ở ĐÂY - NGOÀI Animated.View */}
            {renderCompletionScreen()}
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
    // Container mới để chứa 2 dòng text (Kanji/Hiragana)
    textColumnContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
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
    completionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    completionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 40,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    completionIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    completionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    completionMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    completionButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    completionButtonSuccess: {
        backgroundColor: '#10B981',
    },
    completionButtonRetry: {
        backgroundColor: '#4F46E5',
    },
    completionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    // Style cho dòng Kanji phụ (dòng dưới)
    subWordText: {
        fontSize: 24,
        fontWeight: '500',
        color: '#6B7280',     // Màu xám
        marginTop: 4,
        fontStyle: 'italic',
    },

    // Style cho Hint
    hintButton: {
        marginTop: 10,
        marginBottom: 10,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#F3F4F6', // Màu nền nhẹ
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    hintButtonText: {
        fontSize: 14,
        color: '#4F46E5', // Màu tím nổi bật
        fontWeight: '600',
    },

    phonetic: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 5, // Đảm bảo có khoảng cách sau nút Hint
    },
});