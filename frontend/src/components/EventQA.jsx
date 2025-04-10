import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  FaQuestion,
  FaReply,
  FaUser,
  FaClock,
  FaCheck,
  FaTimes,
  FaCrown, 
  FaShieldAlt,
  FaCheckCircle,
  FaSpinner,
} from 'react-icons/fa';
import api from '../utils/api';
import styles from '../assets/css/eventQA.module.css';
import { ACCESS_TOKEN } from '../utils/constants';

const EventQA = ({ event, isOrganizer }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [answerSubmitting, setAnswerSubmitting] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (event && event.id) {
      fetchQuestions();
    }
    
    // Get current user
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [event?.id]);

  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions for event:", event.id);
      // The correct endpoint for questions in the backend
      const response = await api.get(`/events/questions/?event=${event.id}`);
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      // Set empty array on error to avoid undefined errors
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/events/questions/`, {
        question: newQuestion,
        event: event.id
      });
      setQuestions([...questions, response.data]);
      setNewQuestion("");
      toast.success("Question submitted successfully");
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to submit question");
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    try {
      const response = await api.post(`/events/questions/${questionId}/answers/`, {
        answer: answers[questionId]
      });
      
      // Update the questions list with the new answer
      const updatedQuestions = questions.map(q => {
        if (q.id === questionId) {
          return {
              ...q, 
            answers: [...(q.answers || []), response.data],
            is_answered: true
          };
        }
        return q;
      });
      
      setQuestions(updatedQuestions);
      setAnswers({ ...answers, [questionId]: "" });
      toast.success("Answer submitted successfully");
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
    }
  };

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return 'Anonymous';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.name || 'User';
  };

  // Helper function to check if a user is coordinator or admin
  const isCoordinatorOrAdmin = (user) => {
    if (!user) return false;
    return user.user_role === 'coordinator' || 
           user.user_role === 'admin' || 
           user.role === 'coordinator' ||
           user.role === 'admin';
  };

  // Helper function to check if a user is the event organizer
  const isEventOrganizer = (user) => {
    if (!user || !event) return false;
    
    // Get the user ID, ensuring it's a number for proper comparison
    const userId = parseInt(user.id || user.user_id);
    if (isNaN(userId)) return false;
    
    // Get the event creator/organizer ID
    const eventCreatorId = parseInt(event.created_by?.id || event.organizer?.id);
    if (isNaN(eventCreatorId)) return false;
    
    // Check if user is the event creator - MUST be exact match
    const isCreator = userId === eventCreatorId;
    
    // Check if user is admin - always allowed to post official responses
    const isAdmin = user.user_role === 'admin' || user.role === 'admin';
    
    // Very strict check for assigned coordinators
    const coordinatorIds = (event.coordinators || [])
      .map(coord => parseInt(coord.id))
      .filter(id => !isNaN(id));
    
    const isAssignedCoordinator = 
      coordinatorIds.includes(userId) && 
      (user.user_role === 'coordinator' || user.role === 'coordinator');
    
    return isCreator || isAdmin || isAssignedCoordinator;
  };

  // Determine if an answer is an official response
  const isOfficialResponse = (answer) => {
    if (!answer || !answer.user) {
      return false;
    }
    
    // Safety checks for user data
    const answererUserData = answer.user;
    if (!answererUserData) {
      return false;
    }
    
    // Check if user has a role that allows official responses
    const isAdmin = 
      answererUserData.user_role === 'admin' || 
      answererUserData.role === 'admin';
    
    const isCoordinator = 
      answererUserData.user_role === 'coordinator' || 
      answererUserData.role === 'coordinator';
      
    // If no event data, can't determine if this is the event organizer
    if (!event) {
      return isAdmin; // Admin is always considered official
    }
    
    // Try to safely get IDs, with defensive programming
    let answerUserId = null;
    try {
      if (typeof answererUserData.id !== 'undefined') {
        answerUserId = parseInt(answererUserData.id);
      } else if (typeof answererUserData.user_id !== 'undefined') {
        answerUserId = parseInt(answererUserData.user_id);
      }
    } catch (e) {
      // If ID parsing fails, this user can't be the event creator
      return isAdmin; // Still consider admins as official
    }
    
    let eventCreatorId = null;
    try {
      if (event.created_by && typeof event.created_by.id !== 'undefined') {
        eventCreatorId = parseInt(event.created_by.id);
      } else if (event.created_by && typeof event.created_by !== 'object') {
        eventCreatorId = parseInt(event.created_by);
      }
    } catch (e) {
      // If creator ID parsing fails, can't compare
      return isAdmin; // Still consider admins as official
    }
    
    // User is official if they're admin OR they're the event creator
    const isCreator = !isNaN(answerUserId) && !isNaN(eventCreatorId) && answerUserId === eventCreatorId;
    
    return isAdmin || (isCoordinator && isCreator);
  };

  // Check if user is logged in
  const isLoggedIn = !!user;

  if (loading) {
    return <div className={styles.loading}>Loading Q&A...</div>;
  }

  return (
    <div className={styles.qaSection}>
      <h2><FaQuestion /> Questions & Answers</h2>

      {/* Ask Question Form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmitQuestion} className={styles.questionForm}>
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
      ) : (
        <div className={styles.loginPrompt}>
          <p>Please log in to ask or answer questions</p>
        </div>
      )}

      {/* Questions List */}
      <div className={styles.questionsList}>
        {loading ? (
          <div className={styles.loading}>
            <FaSpinner className="spinner" /> Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className={styles.noQuestions}>
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map(question => {
            return (
              <div key={question.id} className={styles.questionCard}>
                <div className={styles.questionHeader}>
                  <div className={styles.userInfo}>
                    <FaUser /> {question.user_name || 'Anonymous User'}
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
                {question.answers && question.answers.length > 0 && question.answers.map(answer => {
                  const isOrganizerAnswer = isOfficialResponse(answer);
                  
                  return (
                    <div key={answer.id} className={`${styles.answer} ${isOrganizerAnswer ? styles.organizerAnswer : ''}`}>
                      <div className={styles.answerHeader}>
                        <div className={`${styles.userInfo} ${isOrganizerAnswer ? styles.organizerInfo : ''}`}>
                          {isOrganizerAnswer ? (
                            <>
                              <FaCrown className={styles.organizerIcon} /> 
                              {answer.user_name || 'Event Organizer'}
                              <span className={styles.organizerBadge}>
                                <FaShieldAlt /> Official Response
                              </span>
                            </>
                          ) : (
                            <>
                              <FaUser /> {answer.user_name || 'User'}
                            </>
                          )}
                        </div>
                        <div className={styles.timestamp}>
                          <FaClock /> {new Date(answer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={styles.answerContent}>
                        <p>{answer.answer}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Reply Form for all logged-in users */}
                {isLoggedIn && !replyingTo && (
                  <div className={styles.replySection}>
                    <button
                      onClick={() => setReplyingTo(question.id)}
                      className={styles.replyButton}
                    >
                      <FaReply /> {isEventOrganizer(user) ? (
                        <>Reply as Organizer <FaCrown /></>
                      ) : (
                        <>Reply</>
                      )}
                    </button>
                  </div>
                )}
                
                {isLoggedIn && replyingTo === question.id && (
                  <div className={styles.replyForm}>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isEventOrganizer(user) ? 
                        "Write your answer as an organizer..." : 
                        "Write your answer..."}
                      rows="3"
                    />
                    <div className={styles.replyActions}>
                      <button
                        onClick={() => handleSubmitAnswer(question.id)}
                        disabled={!replyText.trim() || answerSubmitting[question.id]}
                      >
                        {answerSubmitting[question.id] ? (
                          <><FaSpinner className="spinner" /> Submitting...</>
                        ) : isEventOrganizer(user) ? (
                          <><FaShieldAlt /> Post Official Answer</>
                        ) : (
                          <>Post Answer</>
                        )}
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
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventQA; 