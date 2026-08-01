import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/api';
import { FiMessageCircle, FiX, FiSend, FiMic, FiMicOff, FiNavigation, FiInfo, FiVolume2, FiVolumeX } from 'react-icons/fi';
import './AIChatWidget.css';

const QUICK_PROMPTS = [
  { text: "Nanga def ! 👋", wolof: "Nanga def ! (Bonjour !)", query: "Nanga def !" },
  { text: "Panier bi 🛒", wolof: "Où se trouve mon panier ?", query: "Montre-moi mon panier" },
  { text: "Xool boutique bi 🛍️", wolof: "Je veux voir la boutique", query: "Je veux parcourir la boutique" },
  { text: "Naka laay faye ? 💳", wolof: "Comment payer ma commande ?", query: "Comment puis-je payer ma commande ?" }
];

function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      content: 'Salamalekoum ! Casa IA laa tudd. Maa ngi lay nuyu. Naka laay mën a dimbalé tey ngir nga naviguer ci site bi ? (Bonjour ! Je suis Casa IA, votre assistant. Comment puis-je vous aider aujourd\'hui ?)',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [unread, setUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Fonction pour faire parler le chatbot en synthèse vocale
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Arrêter toute lecture précédente
      
      // Essayer de trouver la traduction française entre parenthèses
      const translationMatch = text.match(/\(([^)]+)\)/);
      let textToRead = text;

      if (translationMatch && translationMatch[1]) {
        // Si une traduction existe, on lit la traduction en français (qui sera parfaitement prononcée)
        textToRead = translationMatch[1];
      } else {
        // Sinon, on nettoie le texte brut (enlever emojis)
        textToRead = text.replace(/[🤖🇸🇳]/g, '').trim();
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'fr-FR'; // Langue de lecture
      
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(voice => voice.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Nettoyer l'enregistrement à la fermeture du composant
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Arrêter le micro
        stream.getTracks().forEach(track => track.stop());

        setLoading(true);
        try {
          const res = await aiService.transcribeAudio(audioBlob);
          if (res.data && res.data.text) {
            setInputValue(res.data.text);
          }
        } catch (err) {
          console.error("Erreur de transcription vocale:", err);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Impossible d'accéder au microphone:", err);
      alert("Impossible d'accéder au microphone. Veuillez autoriser l'accès pour utiliser la saisie vocale.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Ajouter le message de l'utilisateur
    const userMsg = {
      sender: 'user',
      content: text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      // Envoyer l'historique complet pour préserver le contexte
      const history = messages.concat(userMsg).map(m => ({
        sender: m.sender,
        content: m.content
      }));

      const response = await aiService.chat(history);
      const data = response.data;

      const botMsg = {
        sender: 'bot',
        content: data.reply || "Désolé, je n'ai pas compris.",
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        action: data.action || null
      };

      setMessages(prev => [...prev, botMsg]);

      // Lecture vocale automatique si activée
      if (autoSpeak && data.reply) {
        speakText(data.reply);
      }

      // Si l'assistant renvoie une action de redirection
      if (data.action && data.action.type === 'navigate' && data.action.payload) {
        setTimeout(() => {
          navigate(data.action.payload);
          // Fermer le chat ou laisser une indication
        }, 1500);
      }

    } catch (error) {
      console.error('Erreur chatbot:', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          content: "Jëf. Am nañu problème touti. Mën nga ma waxaat li nga bëgg ? (Merci. Nous rencontrons un petit problème de connexion. Pouvez-vous répéter ?)",
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setUnread(false);
  };

  return (
    <div className={`ai-chat-widget ${isOpen ? 'open' : ''}`}>
      {/* Bouton de déclenchement */}
      {!isOpen && (
        <button className={`chat-trigger ${unread ? 'pulse' : ''}`} onClick={toggleChat} title="Assistant IA">
          <FiMessageCircle size={28} />
          <span className="tooltip-text">Besoin d'aide ? 🇸🇳</span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="chat-window">
          {/* En-tête */}
          <div className="chat-header">
            <div className="avatar-area">
              <span className="avatar-icon">🤖</span>
              <div>
                <h6 className="mb-0 fw-bold">Casa IA 🇸🇳</h6>
                <small className="status-indicator"><span className="dot"></span> En ligne (Wolof / Fr)</small>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className={`header-action-btn ${autoSpeak ? 'active' : ''}`} 
                onClick={() => setAutoSpeak(!autoSpeak)}
                title={autoSpeak ? "Désactiver la lecture vocale automatique" : "Activer la lecture vocale automatique"}
              >
                {autoSpeak ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
              </button>
              <button className="close-btn" onClick={toggleChat}>
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Corps du chat */}
          <div className="chat-body">
            <div className="info-banner">
              <FiInfo className="info-icon" />
              <span>Je peux vous rediriger automatiquement si vous me demandez d'aller vers le panier, la boutique, etc.</span>
            </div>

            {/* Suggestions de départ */}
            {messages.length <= 1 && (
              <div className="quick-suggestions">
                <p className="suggest-title">Suggestions rapides :</p>
                <div className="suggestions-grid">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button key={idx} className="suggestion-chip" onClick={() => handleSendMessage(prompt.query)}>
                      <span className="chip-text">{prompt.text}</span>
                      <small className="chip-desc">{prompt.wolof}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="messages-list">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  <div className="message-bubble">
                    <p className="message-text">{msg.content}</p>
                    
                    {/* Badge de redirection automatique */}
                    {msg.action && msg.action.type === 'navigate' && msg.action.payload && (
                      <div className="action-badge">
                        <FiNavigation className="spin-icon" />
                        <span>Redirection vers {msg.action.payload}...</span>
                      </div>
                    )}
                    
                    <div className="bubble-footer">
                      {msg.sender === 'bot' && (
                        <button 
                          className="speak-msg-btn" 
                          onClick={() => speakText(msg.content)}
                          title="Écouter le message"
                        >
                          <FiVolume2 size={14} />
                        </button>
                      )}
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="message-wrapper bot">
                  <div className="message-bubble loading-bubble">
                    <span className="dot-flashing"></span>
                    <span className="dot-flashing delay-1"></span>
                    <span className="dot-flashing delay-2"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Formulaire d'envoi */}
          <div className="chat-footer">
            <button 
              className={`voice-btn ${isListening ? 'active' : ''}`} 
              onClick={toggleVoice}
              title={isListening ? "Arrêter l'écoute" : "Parler"}
            >
              {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
            </button>
            <input
              type="text"
              className="chat-input"
              placeholder={isListening ? "Écoute en cours..." : "Posez une question en wolof ou français..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isListening}
            />
            <button className="send-btn" onClick={() => handleSendMessage()} disabled={!inputValue.trim() && !loading}>
              <FiSend size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatWidget;
