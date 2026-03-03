import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { parseVoiceTransaction } from '../utils/voiceParser';
import { formatCurrency } from '../utils/helpers';
import { IconX } from './Icons';

export default function VoiceInput() {
    const { accounts, categories, addTransaction, showToast } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event) => {
                const text = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setTranscript(text);
                if (event.results[0].isFinal) {
                    stopListening(text);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
                showToast("Voice recognition error: " + event.error);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    }, [showToast]);

    const startListening = () => {
        if (!recognitionRef.current) {
            showToast("Voice recognition not supported in this browser.");
            return;
        }
        setTranscript('');
        setParsedData(null);
        setIsListening(true);
        recognitionRef.current.start();
    };

    const stopListening = async (finalText) => {
        setIsListening(false);
        recognitionRef.current?.stop();

        const query = finalText || transcript;
        if (!query.trim()) return;

        setIsParsing(true);
        try {
            const data = await parseVoiceTransaction(query, accounts, categories);
            if (data && data.amount) {
                setParsedData(data);
            } else {
                showToast("Could not understand the transaction. Try again!");
            }
        } catch (err) {
            showToast("Error parsing voice input.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleConfirm = async () => {
        if (!parsedData) return;

        // Final mapping check
        if (!parsedData.accountId) {
            showToast("Please select an account first.");
            return;
        }

        try {
            await addTransaction({
                type: parsedData.type || 'expense',
                amount: Number(parsedData.amount),
                category: parsedData.category || 'Miscellaneous',
                accountId: parsedData.accountId,
                toAccountId: parsedData.toAccountId || null,
                notes: parsedData.notes || 'Voice Entry',
                date: parsedData.date || new Date().toISOString().split('T')[0]
            });
            setParsedData(null);
            setTranscript('');
            showToast("Transaction added via voice!");
        } catch (err) {
            showToast("Failed to add transaction.");
        }
    };

    return (
        <>
            {/* Voice Activation Button */}
            <div className="voice-btn-container">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={isListening ? () => stopListening() : startListening}
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    aria-label="Voice Input"
                >
                    {isListening ? (
                        <div className="mic-pulse" />
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    )}
                </motion.button>
            </div>

            {/* Listening Overlay */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        style={{ zIndex: 2000 }}
                    >
                        <div className="voice-overlay-content">
                            <div className="pulse-circle">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            </div>
                            <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Listening...</h2>
                            <p className="transcript-preview">{transcript || "Say something like 'Spent 500 at Zudio using Cash'..."}</p>
                            <button className="btn-secondary" style={{ marginTop: '24px' }} onClick={() => setIsListening(false)}>Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {(isParsing || parsedData) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        style={{ zIndex: 2000 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="card modal-card"
                            style={{ maxWidth: '400px', width: '90%', padding: '24px' }}
                        >
                            <div className="modal-header">
                                <h3>{isParsing ? 'Parsing with Gemini...' : 'Confirm Voice Entry'}</h3>
                                {!isParsing && <button onClick={() => setParsedData(null)} className="btn-icon"><IconX /></button>}
                            </div>

                            {isParsing ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                                    <p style={{ color: 'var(--text-tertiary)' }}>Extracting transaction details...</p>
                                </div>
                            ) : (
                                <div className="voice-confirm-body">
                                    <div className="confirm-row">
                                        <span className="label">Amount</span>
                                        <span className="value large">{formatCurrency(parsedData.amount)}</span>
                                    </div>
                                    <div className="confirm-row">
                                        <span className="label">Category</span>
                                        <span className="value">{parsedData.category}</span>
                                    </div>
                                    <div className="confirm-row">
                                        <span className="label">Account</span>
                                        <span className="value">{parsedData.accountName || 'Unknown'}</span>
                                    </div>
                                    <div className="confirm-row">
                                        <span className="label">Notes</span>
                                        <span className="value">{parsedData.notes || 'No description'}</span>
                                    </div>

                                    <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <button className="btn-secondary" onClick={() => setParsedData(null)}>Cancel</button>
                                        <button className="btn-primary" onClick={handleConfirm}>Add Transaction</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
