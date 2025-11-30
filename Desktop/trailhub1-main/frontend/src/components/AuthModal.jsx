import React, { useEffect, useState, useRef } from 'react';
import './authModal.css';
import {
	auth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
} from '../firebase';

// Validation constants
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 100;

export default function AuthModal({ open, onClose, initialTab = 'login' }) {
	// Track manually switched tab (only used when user clicks tab buttons)
	const [manualTab, setManualTab] = useState(null);
	
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [fullName, setFullName] = useState('');
	const [selectedRole, setSelectedRole] = useState('hiker');
	const [loading, setLoading] = useState(false);
	
	// Error states
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [nameError, setNameError] = useState('');

	// When modal opens or initialTab changes, reset everything
	React.useEffect(() => {
		// Reset manual tab when initialTab changes (modal opened with different tab)
		setManualTab(null);
		
		// Clear errors and form fields when modal opens
		if (open) {
			setEmailError('');
			setPasswordError('');
			setNameError('');
			setEmail('');
			setPassword('');
			setFullName('');
		}
	}, [open, initialTab]);

	// Determine the active tab: use initialTab by default, manualTab if user switched
	const tab = manualTab !== null ? manualTab : (initialTab || 'login');

	// Validation functions
	const validateEmail = (value) => {
		if (!value) {
			setEmailError('');
			return true;
		}
		if (value.length > MAX_EMAIL_LENGTH) {
			setEmailError(`Email must be no more than ${MAX_EMAIL_LENGTH} characters`);
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) {
			setEmailError('Please enter a valid email address');
			return false;
		}
		setEmailError('');
		return true;
	};

	const validatePassword = (value) => {
		if (!value) {
			setPasswordError('');
			return true;
		}
		if (value.length < MIN_PASSWORD_LENGTH) {
			setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
			return false;
		}
		if (value.length > MAX_PASSWORD_LENGTH) {
			setPasswordError(`Password must be no more than ${MAX_PASSWORD_LENGTH} characters`);
			return false;
		}
		setPasswordError('');
		return true;
	};

	const validateName = (value) => {
		if (!value) {
			setNameError('');
			return true;
		}
		if (value.length > MAX_NAME_LENGTH) {
			setNameError(`Name must be no more than ${MAX_NAME_LENGTH} characters`);
			return false;
		}
		setNameError('');
		return true;
	};

	if (!open) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Clear previous errors
		setEmailError('');
		setPasswordError('');
		setNameError('');
		
		// Validate fields
		let isValid = true;
		
		if (tab === 'signup') {
			if (!fullName.trim()) {
				setNameError('Name is required');
				isValid = false;
			} else {
				isValid = validateName(fullName) && isValid;
			}
		}
		
		isValid = validateEmail(email) && isValid;
		isValid = validatePassword(password) && isValid;
		
		if (!isValid) {
			return;
		}
		
		setLoading(true);
		try {
			if (tab === 'login') {
				await signInWithEmailAndPassword(auth, email, password);
				onClose(); // Close modal after successful login
			} else {
				// create user in Firebase (Firebase automatically logs them in)
				const userCred = await createUserWithEmailAndPassword(auth, email, password);
				
				// Get user info we need before signing out
				const firebaseUid = userCred.user.uid;
				
				// Sign out IMMEDIATELY - do this first to prevent header from updating
				// Firebase auto-logs in after signup, but we want manual login
				await auth.signOut();
				
				// Update displayName after signout (this will be saved for when they log in)
				// Note: We can't update profile after signout, so we'll skip this
				// The name will be set in the database and can be synced on first login
				
				// Register user in Prisma database (user is already signed out, so header won't update)
				try {
					const api = (await import('../api')).default;
					const response = await api.post('/api/users/register', {
						firebaseUid: firebaseUid,
						email: email,
						name: fullName,
						role: selectedRole, // 'hiker' or 'guide'
					});
					console.log('User registered successfully in database:', response.data);
				} catch (regErr) {
					console.error('Failed to register user in database:', regErr);
					console.error('Error details:', regErr.response?.data || regErr.message);
					// Show error to user but don't fail the signup - user is already in Firebase
					alert('Account created in Firebase, but failed to save to database. Please try logging in.');
				}
				
				// Switch to login tab and keep email filled in
				// Clear form fields but keep email for convenience
				setManualTab('login');
				setPassword(''); // Clear password - user must enter it to log in
				setFullName(''); // Clear name field
				setNameError('');
				setPasswordError('');
				setEmailError('');
				// Email stays filled in for user convenience
			}
		} catch (err) {
			console.error('Auth error', err);
			
			// Handle Firebase auth errors
			if (err.code === 'auth/email-already-in-use') {
				setEmailError('This email is already registered. Please use a different email or log in.');
			} else if (err.code === 'auth/invalid-email') {
				setEmailError('Please enter a valid email address');
			} else if (err.code === 'auth/weak-password') {
				setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
			} else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
				setPasswordError('Invalid email or password');
			} else if (err.code === 'auth/configuration-not-found') {
				// Show a helpful error message for configuration issues
				const errorMsg = 'Firebase Authentication is not properly configured. Please enable Email/Password authentication in Firebase Console: Authentication > Sign-in method > Email/Password > Enable';
				setEmailError(errorMsg);
				alert('Configuration Error: ' + errorMsg);
			} else {
				// For other errors, show generic message
				const errorMessage = err.message || 'Authentication failed';
				if (tab === 'signup') {
					setEmailError(errorMessage);
				} else {
					setPasswordError(errorMessage);
				}
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-modal-overlay" onClick={onClose}>
			<div className="auth-modal" onClick={(e) => e.stopPropagation()}>
				<button className="auth-modal-close" onClick={onClose}>×</button>
				<h3 className="auth-modal-title">Welcome to TrailHub</h3>

				<div className="auth-tabs">
					<button
						className={"auth-tab " + (tab === 'login' ? 'active' : '')}
						onClick={() => setManualTab('login')}
						type="button"
					>
						Log In
					</button>
					<button
						className={"auth-tab " + (tab === 'signup' ? 'active' : '')}
						onClick={() => setManualTab('signup')}
						type="button"
					>
						Sign Up
					</button>
				</div>

				<form className="auth-form" onSubmit={handleSubmit}>
					{tab === 'signup' && (
						<>
							<label className="auth-label">Full Name</label>
							<input
								className={`auth-input ${nameError ? 'auth-input-error' : ''}`}
								type="text"
								value={fullName}
								onChange={(e) => {
									const value = e.target.value;
									if (value.length <= MAX_NAME_LENGTH) {
										setFullName(value);
										validateName(value);
									}
								}}
								placeholder="Your name"
								maxLength={MAX_NAME_LENGTH}
							/>
							{nameError && <div className="auth-error">{nameError}</div>}
						</>
					)}

					<label className="auth-label">Email</label>
					<input
						className={`auth-input ${emailError ? 'auth-input-error' : ''}`}
						type="email"
						value={email}
						onChange={(e) => {
							const value = e.target.value;
							if (value.length <= MAX_EMAIL_LENGTH) {
								setEmail(value);
								validateEmail(value);
							}
						}}
						placeholder="your@email.com"
						maxLength={MAX_EMAIL_LENGTH}
						required
					/>
					{emailError && <div className="auth-error">{emailError}</div>}

					<label className="auth-label">Password</label>
					<input
						className={`auth-input ${passwordError ? 'auth-input-error' : ''}`}
						type="password"
						value={password}
						onChange={(e) => {
							const value = e.target.value;
							if (value.length <= MAX_PASSWORD_LENGTH) {
								setPassword(value);
								validatePassword(value);
							}
						}}
						placeholder="********"
						maxLength={MAX_PASSWORD_LENGTH}
						required
					/>
					{passwordError && <div className="auth-error">{passwordError}</div>}

					{tab === 'signup' && (
						<>
							<div className="auth-label" style={{ marginTop: 10 }}>I want to join as</div>
							<div className="role-grid">
								<button
									type="button"
									className={"role-card " + (selectedRole === 'hiker' ? 'selected' : '')}
									onClick={() => setSelectedRole('hiker')}
								>
									<div className="role-icon">👣</div>
									<div className="role-title">Hiker</div>
									<div className="role-sub">Join hikes & explore</div>
								</button>
								<button
									type="button"
									className={"role-card " + (selectedRole === 'guide' ? 'selected' : '')}
									onClick={() => setSelectedRole('guide')}
								>
									<div className="role-icon">🧭</div>
									<div className="role-title">Guide</div>
									<div className="role-sub">Lead & create hikes</div>
								</button>
							</div>
						</>
					)}

					<button className="auth-submit" type="submit" disabled={loading}>
						{tab === 'login' ? 'Log In' : `Sign Up as ${selectedRole === 'guide' ? 'Guide' : 'Hiker'}`}
					</button>
				</form>

			</div>
		</div>
	);
}
