import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import './Profile.css';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const Profile = () => {
  const { authState, updateProfile } = useAuth();
  const { user: currentUser } = authState;
  const [loading, setLoading] = useState(true);
  const formikRef = useRef();

  const { isChatEnabled, toggleChat } = useContext(ChatContext);
  const [chatStatus, setChatStatus] = useState(isChatEnabled);
  const [locationDistance, setLocationDistance] = useState(10); // Default 10 km

  useEffect(() => {
    setChatStatus(isChatEnabled);
  }, [isChatEnabled]);

  useEffect(() => {
    if (currentUser && formikRef.current) {
      formikRef.current.setValues({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      });
      setLocationDistance(currentUser.locationDistance / 1000); // Convert meters to kilometers
      setLoading(false);
    }
  }, [currentUser]);

  const handleToggleChat = (e) => {
    toggleChat(e.target.checked);
  };

  const handleSliderChange = (value) => {
    setLocationDistance(value);
  };

  const formik = useFormik({
    initialValues: {
      id: '',
      name: '',
      email: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
    }),
    onSubmit: async (values) => {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        };
        const profileBody = JSON.stringify({
          id: values.id,
          name: values.name,
          email: values.email,
          locationDistance: locationDistance * 1000, // Convert kilometers to meters
        });

        const resProfile = await axios.put('http://localhost:8000/api/auth/profile', profileBody, config);

        if (resProfile.data) {
          updateProfile(resProfile.data);
          toast.success('Profile updated successfully!');
        } else {
          toast.error('Profile update failed.');
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        toast.error(err.response?.data?.msg || 'An error occurred');
      }
    },
  });

  formikRef.current = formik;

  const handleResetPassword = async () => {
    try {
      await axios.post('http://localhost:8000/api/auth/reset-password', { email: formik.values.email });
      toast.success('Password reset link sent to your email');
    } catch (err) {
      console.error('Error sending password reset link:', err);
      toast.error('Error sending password reset link');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <form onSubmit={formik.handleSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
          />
          {formik.touched.name && formik.errors.name ? (
            <div className="invalid-feedback">{formik.errors.name}</div>
          ) : null}
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="invalid-feedback">{formik.errors.email}</div>
          ) : null}
        </div>
        <div className="form-group">
          <label>Location Sharing Distance (km): {locationDistance} km</label>
          <Slider
            min={1}
            max={100}
            value={locationDistance}
            onChange={handleSliderChange}
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Profile</button>
        <button type="button" className="btn btn-secondary" onClick={handleResetPassword}>
          Reset Password
        </button>
        <div className="form-group chat-toggle">
          <label htmlFor="chatToggle" className="chat-toggle-label">Enable Chat</label>
          <label className="switch">
            <input
              type="checkbox"
              id="chatToggle"
              checked={chatStatus}
              onChange={handleToggleChat}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </form>
    </div>
  );
};

export default Profile;
