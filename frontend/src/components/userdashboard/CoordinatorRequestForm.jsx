import React, { useState } from 'react';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import styles from '../../assets/css/user/coordinatorRequestForm.module.css';

const CoordinatorRequestForm = ({ onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [experience, setExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason || !experience) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      setSubmitting(true);
      
      const requestData = {
        reason,
        experience
      };
      
      // Try multiple endpoints that could exist
      const endpoints = [
        "coordinator-requests/",
        "users/coordinator-requests/",
        "requests/coordinator/",
        "api/coordinator-requests/"
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to submit coordinator request to ${endpoint}`);
          const response = await api.post(endpoint, requestData);
          
          if (response.status >= 200 && response.status < 300) {
            success = true;
            console.log(`Successfully submitted request to ${endpoint}`);
            break;
          }
        } catch (error) {
          console.warn(`Failed to submit request to ${endpoint}:`, error);
        }
      }
      
      if (success) {
        toast.success("Coordinator request submitted successfully");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting coordinator request:", error);
      toast.error("Failed to submit coordinator request. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Request Coordinator Role</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="reason">Why do you want to become a coordinator?</label>
            <textarea
              id="reason"
              rows="4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you want to coordinate events..."
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="experience">Relevant experience</label>
            <textarea
              id="experience"
              rows="4"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Describe any relevant experience you have..."
              required
            />
          </div>
          
          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
              {!submitting && <FaPaperPlane className={styles.buttonIcon} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoordinatorRequestForm; 