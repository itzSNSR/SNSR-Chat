import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Loader, KeyRound, RefreshCw } from 'lucide-react';
import { authAPI, saveAuth } from '../services/api';
import './AuthModal.css';

// Turnstile site key
const TURNSTILE_SITE_KEY = '0x4AAAAAACa89XDfGYfGumbE';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, canClose = true }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Turnstile captcha state
    const [captchaToken, setCaptchaToken] = useState(null);
    const [turnstileReady, setTurnstileReady] = useState(false);
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetId = useRef(null);

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

    // Load Turnstile script
    useEffect(() => {
        if (window.turnstile) {
            setTurnstileReady(true);
            return;
        }

        if (document.querySelector('script[data-turnstile]')) return;

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-turnstile', 'true');
        document.head.appendChild(script);

        window.onTurnstileReady = () => {
            setTurnstileReady(true);
        };

        return () => {
            delete window.onTurnstileReady;
        };
    }, []);

    // Render Turnstile widget when ready and in login mode
    useEffect(() => {
        if (!turnstileReady || !isLogin || step !== 'form' || !turnstileContainerRef.current) return;
        if (!window.turnstile) return;

        // Clean up previous widget
        if (turnstileWidgetId.current !== null) {
            try { window.turnstile.remove(turnstileWidgetId.current); } catch { }
            turnstileWidgetId.current = null;
        }

        // Render new widget
        turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: 'dark',
            size: 'flexible',
            callback: (token) => {
                setCaptchaToken(token);
                setError('');
            },
            'error-callback': () => {
                setCaptchaToken(null);
            },
            'expired-callback': () => {
                setCaptchaToken(null);
            },
        });

        return () => {
            if (turnstileWidgetId.current !== null) {
                try { window.turnstile.remove(turnstileWidgetId.current); } catch { }
                turnstileWidgetId.current = null;
            }
        };
    }, [turnstileReady, isLogin, step]);

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

    const resetCaptcha = useCallback(() => {
        setCaptchaToken(null);
        if (window.turnstile && turnstileWidgetId.current !== null) {
            try { window.turnstile.reset(turnstileWidgetId.current); } catch { }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Require captcha for login
                if (!captchaToken) {
                    setError('Please complete the security check');
                    setLoading(false);
                    return;
                }

                const res = await authAPI.login({
                    email: formData.email,
                    password: formData.password,
                    captchaPayload: captchaToken
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
            resetCaptcha();
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

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setStep('form');
        setPendingUser(null);
        setOtp(['', '', '', '', '', '']);
        setFormData({ fullName: '', username: '', email: '', password: '' });
        setCaptchaToken(null);
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

                            {/* Cloudflare Turnstile — Login only */}
                            {isLogin && (
                                <div className="captcha-wrapper">
                                    <div ref={turnstileContainerRef}></div>
                                    {!turnstileReady && (
                                        <div className="captcha-loading">
                                            <Loader size={14} className="spin" />
                                            <span>Loading security check...</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading || (isLogin && !captchaToken)}
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

                {/* STEP 2: OTP Verification */}
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
            </div>
        </div>
    );
};

export default AuthModal;
