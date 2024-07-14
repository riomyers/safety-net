import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../contexts/AuthContext'; // Import the AuthContext

const Login = () => {
  const navigate = useNavigate();
  const { setAuthState } = useContext(AuthContext); // Get the setAuthState function from context
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
        };
        const API_URL = process.env.REACT_APP_API_URL || 'https://safety-net-innov8r-1f5b89760363.herokuapp.com/api';
        const res = await axios.post(`${API_URL}/auth/login`, values, config);

        // Ensure token is stored in localStorage
        const token = res.data.token;
        if (token) {
          localStorage.setItem('token', token);
          setAuthState({ isAuthenticated: true, user: { email: values.email }, token });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          toast.success('Login successful!');
          navigate('/');
        } else {
          toast.error('Login failed. Please try again.');
        }
      } catch (err) {
        toast.error('Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="login">
      <h1>Login</h1>
      <form onSubmit={formik.handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            name="email"
            autoComplete="username"
            {...formik.getFieldProps('email')}
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="error">{formik.errors.email}</div>
          ) : null}
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            name="password"
            autoComplete="current-password"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error">{formik.errors.password}</div>
          ) : null}
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
