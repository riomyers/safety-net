import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import './Register.css'; // Assuming you have a CSS file for styling
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      password2: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
      password2: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
          },
        };
        const { name, email, password } = values;
        const body = JSON.stringify({ name, email, password }); // Ensure the password is correctly sent
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        await axios.post(`${API_URL}/auth/register`, body, config);
        toast.success('Registration successful!');
        navigate('/login');
      } catch (err) {
        if (err.response && err.response.data.errors) {
          err.response.data.errors.forEach(error => {
            toast.error(error.msg);
          });
        } else {
          toast.error('Registration failed. Please try again.');
        }
      }
    },
  });

  return (
    <div className="register">
      <h1>Register</h1>
      <form onSubmit={formik.handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            name="name"
            autoComplete="name"
            {...formik.getFieldProps('name')}
          />
          {formik.touched.name && formik.errors.name ? (
            <div className="error">{formik.errors.name}</div>
          ) : null}
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            {...formik.getFieldProps('password')}
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="error">{formik.errors.password}</div>
          ) : null}
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            name="password2"
            autoComplete="new-password"
            {...formik.getFieldProps('password2')}
          />
          {formik.touched.password2 && formik.errors.password2 ? (
            <div className="error">{formik.errors.password2}</div>
          ) : null}
        </div>
        <input type="submit" className="btn" value="Register" />
      </form>
    </div>
  );
};

export default Register;
