import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FaQuestion,
  FaReply,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import api from '../utils/api';
import styles from '../assets/css/eventQA.module.css';

const EventQA = ({ event, isOrganizer }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [event.id]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/events/events/${event.id}/questions/`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      await api.post(`/events/events/${event.id}/questions/`, {
        question: newQuestion
      });
      setNewQuestion('');
      toast.success('Question posted successfully');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to post question');
    }
  };

  const handleAnswer = async (questionId) => {
    if (!replyText.trim()) return;

    try {
      await api.post(`/events/questions/${questionId}/answers/`, {
        answer: replyText
      });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Answer posted successfully');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to post answer');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Q&A...</div>;
  }

  return (
    <div className={styles.qaSection}>
      <h2><FaQuestion /> Questions & Answers</h2>

      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} className={styles.questionForm}>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question about this event..."
          rows="3"
        />
        <button type="submit" disabled={!newQuestion.trim()}>
          Ask Question
        </button>
      </form>

      {/* Questions List */}
      <div className={styles.questionsList}>
        {questions.length === 0 ? (
          <div className={styles.noQuestions}>
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map(question => (
            <div key={question.id} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <div className={styles.userInfo}>
                  <FaUser /> {question.user_name}
                </div>
                <div className={styles.timestamp}>
                  <FaClock /> {new Date(question.created_at).toLocaleDateString()}
                </div>
                <div className={styles.status}>
                  {question.is_answered ? (
                    <span className={styles.answered}><FaCheck /> Answered</span>
                  ) : (
                    <span className={styles.unanswered}><FaTimes /> Awaiting Answer</span>
                  )}
                </div>
              </div>

              <div className={styles.questionContent}>
                <p>{question.question}</p>
              </div>

              {/* Answers */}
              {question.answers.map(answer => (
                <div key={answer.id} className={styles.answer}>
                  <div className={styles.answerHeader}>
                    <div className={styles.userInfo}>
                      <FaUser /> {answer.user_name}
                    </div>
                    <div className={styles.timestamp}>
                      <FaClock /> {new Date(answer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.answerContent}>
                    <p>{answer.answer}</p>
                  </div>
                </div>
              ))}

              {/* Reply Form for Organizers */}
              {isOrganizer && !question.is_answered && (
                <div className={styles.replySection}>
                  {replyingTo === question.id ? (
                    <div className={styles.replyForm}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your answer..."
                        rows="3"
                      />
                      <div className={styles.replyActions}>
                        <button
                          onClick={() => handleAnswer(question.id)}
                          disabled={!replyText.trim()}
                        >
                          Post Answer
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(question.id)}
                      className={styles.replyButton}
                    >
                      <FaReply /> Reply
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventQA; 