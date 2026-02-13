import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Loader, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
import { authAPI, captchaAPI, saveAuth } from '../services/api';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, canClose = true }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Math captcha state
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [captchaLoading, setCaptchaLoading] = useState(false);

    // OTP verification state
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [pendingUser, setPendingUser] = useState(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: ''
    });

    // Load captcha challenge
    const loadCaptcha = useCallback(async () => {
        setCaptchaLoading(true);
        setCaptchaAnswer('');
        try {
            const res = await captchaAPI.getChallenge();
            setCaptchaQuestion(res.data.question);
            setCaptchaToken(res.data.token);
        } catch {
            setCaptchaQuestion('');
            setCaptchaToken('');
        } finally {
            setCaptchaLoading(false);
        }
    }, []);

    // Clear OTP refs when step changes
    useEffect(() => {
        otpRefs.current = [];
    }, [step]);

    // Load captcha when switching to login mode
    useEffect(() => {
        if (isLogin && step === 'form') {
            loadCaptcha();
        }
    }, [isLogin, step, loadCaptcha]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // OTP input handlers
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('');
        while (newOtp.length < 6) newOtp.push('');
        setOtp(newOtp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Require captcha answer
                if (!captchaAnswer.trim()) {
                    setError('Please solve the math problem');
                    setLoading(false);
                    return;
                }

                const res = await authAPI.login({
                    email: formData.email,
                    password: formData.password,
                    captchaAnswer: captchaAnswer.trim(),
                    captchaToken: captchaToken
                });

                saveAuth(res.data.token, res.data.user);
                onAuthSuccess(res.data.user);
            } else {
                const res = await authAPI.signup({
                    fullName: formData.fullName,
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });

                if (res.data.requiresVerification) {
                    setPendingUser({ userId: res.data.userId, email: res.data.email });
                    setStep('otp');
                    setSuccess('Check your email for OTP!');
                }
            }
        } catch (err) {
            if (err.response?.data?.requiresVerification) {
                setPendingUser({
                    userId: err.response.data.userId,
                    email: err.response.data.email
                });
                setStep('otp');
                setSuccess('OTP sent to your email!');
            } else {
                setError(err.response?.data?.error || 'Something went wrong');
            }
            // Refresh captcha on error
            loadCaptcha();
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await authAPI.verifyOtp(pendingUser.userId, otpString);
            saveAuth(res.data.token, res.data.user);
            onAuthSuccess(res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.resendOtp(pendingUser.userId);
            setSuccess('New OTP sent!');
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await authAPI.forgotPassword(formData.email);
            setSuccess(res.data.message);
            setStep('forgot-reset');
            setOtp(['', '', '', '', '', '']); // Reset OTP inputs
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            setError('Please enter the 6-digit code');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await authAPI.resetPassword(formData.email, otpString, formData.password);

            // Success! Switch back to login
            setSuccess(res.data.message);
            setTimeout(() => {
                setIsLogin(true);
                setStep('form');
                // Keep email filled for convenience, clear password
                setFormData(prev => ({ ...prev, password: '' }));
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setStep('form');
        setPendingUser(null);
        setOtp(['', '', '', '', '', '']);
        // Keep email if typing, clear password
        setFormData(prev => ({ ...prev, password: '' }));
        setCaptchaAnswer('');
    };

    const resetToForm = () => {
        setStep('form');
        setPendingUser(null);
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSuccess('');
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal">
                {canClose && step === 'form' && (
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                )}

                {/* STEP 1: Login/Signup Form */}
                {step === 'form' && (
                    <>
                        <div className="modal-header">
                            <div className="modal-logo">
                                <img src="/logo.svg" alt="SNSR AI" className="modal-logo-img" />
                            </div>
                            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                            <p>{isLogin ? 'Login to continue chatting' : 'Sign up to save your chats'}</p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}
                        {success && <div className="auth-success">{success}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {!isLogin && (
                                <>
                                    <div className="input-group">
                                        <User size={18} className="input-icon" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="Full Name"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <span className="input-icon">@</span>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            minLength={3}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Forgot Password Link - Only for Login */}
                            {isLogin && (
                                <div className="forgot-password-link">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('forgot-email');
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            {/* Math Captcha — Login only */}
                            {isLogin && (
                                <div className="captcha-box">
                                    <div className="captcha-header">
                                        <ShieldCheck size={16} />
                                        <span>Security Check</span>
                                    </div>
                                    <div className="captcha-body">
                                        {captchaLoading ? (
                                            <div className="captcha-loading">
                                                <Loader size={14} className="spin" />
                                                <span>Loading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="captcha-question">
                                                    <span className="captcha-math">{captchaQuestion}</span>
                                                    <span className="captcha-equals">=</span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="captcha-input"
                                                        placeholder="?"
                                                        value={captchaAnswer}
                                                        onChange={(e) => {
                                                            setCaptchaAnswer(e.target.value);
                                                            setError('');
                                                        }}
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="captcha-refresh"
                                                    onClick={loadCaptcha}
                                                    title="New question"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading || (isLogin && !captchaAnswer.trim())}
                            >
                                {loading ? (
                                    <Loader size={18} className="spin" />
                                ) : (
                                    <>
                                        {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                        {isLogin ? 'Login' : 'Create Account'}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-switch">
                            {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            <button onClick={switchMode}>
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: OTP Verification (Signup) */}
                {step === 'otp' && (
                    <div className="otp-step">
                        <div className="modal-header">
                            <div className="modal-logo otp-icon">
                                <KeyRound size={32} />
                            </div>
                            <h2>Enter OTP</h2>
                            <p>We sent a code to <strong>{pendingUser?.email}</strong></p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}
                        {success && <div className="auth-success">{success}</div>}

                        <div className="otp-inputs" onPaste={handleOtpPaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => otpRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className="otp-input"
                                />
                            ))}
                        </div>

                        <button
                            className="auth-submit"
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.join('').length !== 6}
                        >
                            {loading ? (
                                <Loader size={18} className="spin" />
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <div className="otp-actions">
                            <button
                                className="resend-btn"
                                onClick={handleResendOtp}
                                disabled={loading}
                            >
                                <RefreshCw size={14} />
                                Resend OTP
                            </button>
                            <button className="back-link" onClick={resetToForm}>
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {/* FORGOT PASSWORD: Step 1 - Email */}
                {step === 'forgot-email' && (
                    <>
                        <div className="modal-header">
                            <div className="modal-logo">
                                <KeyRound size={32} />
                            </div>
                            <h2>Reset Password</h2>
                            <p>Enter your email to receive a reset code</p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleForgotPassword} className="auth-form">
                            <div className="input-group">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading || !formData.email}
                            >
                                {loading ? (
                                    <Loader size={18} className="spin" />
                                ) : (
                                    'Send Reset Code'
                                )}
                            </button>
                        </form>

                        <button className="back-link center-back" onClick={resetToForm}>
                            ← Back to Login
                        </button>
                    </>
                )}

                {/* FORGOT PASSWORD: Step 2 - Verify & Reset */}
                {step === 'forgot-reset' && (
                    <>
                        <div className="modal-header">
                            <div className="modal-logo">
                                <KeyRound size={32} />
                            </div>
                            <h2>New Password</h2>
                            <p>Enter the code sent to <strong>{formData.email}</strong></p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}
                        {success && <div className="auth-success">{success}</div>}

                        <form onSubmit={handleResetPassword} className="auth-form">
                            <label className="input-label">Verification Code</label>
                            <div className="otp-inputs small-otp" onPaste={handleOtpPaste}>
                                {Array.isArray(otp) && otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="otp-input"
                                    />
                                ))}
                            </div>

                            <label className="input-label" style={{ marginTop: '16px' }}>New Password</label>
                            <div className="input-group">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading || otp.join('').length !== 6 || formData.password.length < 6}
                            >
                                {loading ? (
                                    <Loader size={18} className="spin" />
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <div className="otp-actions">
                            <button
                                className="resend-btn"
                                onClick={handleForgotPassword} // Reuse this to resend
                                disabled={loading}
                            >
                                <RefreshCw size={14} />
                                Resend Code
                            </button>
                            <button className="back-link" onClick={() => setStep('forgot-email')}>
                                ← Change Email
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
