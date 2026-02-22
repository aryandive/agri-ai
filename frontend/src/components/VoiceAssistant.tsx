"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/lib/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VoiceAssistant() {
    const { user } = useUser();
    const { language } = useLanguage();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [response, setResponse] = useState("");
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setIsListening(false);
                handleChat(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [language]);

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            recognitionRef.current.start();
        } else {
            alert("Speech recognition is not supported in this browser.");
        }
    };

    const handleChat = async (message: string) => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/assistant/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerk_id: user.id,
                    message,
                    language
                }),
            });
            const data = await res.json();
            if (data.response) {
                setResponse(data.response);
                speak(data.response);
            }
        } catch (error) {
            console.error("Assistant error:", error);
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;

        // Stop any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === "hi" ? "hi-IN" : "en-US";

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="voice-assistant-container">
            {isSpeaking && response && (
                <div className="assistant-bubble">
                    <p>{response}</p>
                </div>
            )}

            <button
                onClick={isListening ? () => { } : startListening}
                className={`voice-btn ${isListening ? "pulsing" : ""} ${isSpeaking ? "speaking" : ""}`}
                title="Speak to Agri AI"
            >
                {isListening ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                ) : isSpeaking ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )}
            </button>

            <style jsx>{`
                .voice-assistant-container {
                    position: fixed;
                    bottom: 24px;
                    left: 280px; /* Offset from sidebar */
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .voice-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 28px;
                    background: var(--color-primary);
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justifyContent: center;
                    box-shadow: 0 4px 15px rgba(22, 163, 74, 0.4);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .voice-btn:hover {
                    transform: scale(1.1);
                    background: var(--color-primary-light);
                }
                
                .voice-btn.speaking {
                    animation: pulse-green 2s infinite;
                }
                
                .pulsing {
                    animation: pulse-red 1.5s infinite;
                    background: #ef4444; /* Alert color when listening */
                }

                .assistant-bubble {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    padding: 12px 16px;
                    border-radius: 16px 16px 16px 4px;
                    max-width: 250px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    color: var(--color-text-main);
                    font-size: 0.9rem;
                    line-height: 1.4;
                    animation: slide-up 0.3s ease-out;
                }

                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }

                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 768px) {
                    .voice-assistant-container {
                        left: 24px;
                        bottom: 80px;
                    }
                }
            `}</style>
        </div>
    );
}
